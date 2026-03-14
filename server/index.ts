import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import http from "http";
import { Server } from "socket.io";
import { nanoid } from "nanoid";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { supabase } from "./supabase.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());

// Track which socket is the controller for each session
const controllers = new Map<string, string>();

// --- REST API ---

app.post("/api/sessions", upload.single("pdf"), async (req, res) => {
  try {
    const file = req.file;
    if (!file || file.mimetype !== "application/pdf") {
      res.status(400).json({ error: "A PDF file is required" });
      return;
    }

    const id = nanoid(6);
    const pdfPath = `${id}.pdf`;

    // Count pages
    const doc = await getDocument({ data: new Uint8Array(file.buffer) }).promise;
    const totalSlides = doc.numPages;
    doc.destroy();

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("presentations")
      .upload(pdfPath, file.buffer, { contentType: "application/pdf", upsert: true });

    if (uploadError) {
      res.status(500).json({ error: "Failed to upload PDF" });
      return;
    }

    // Insert session row
    const { error: dbError } = await supabase.from("sessions").insert({
      id,
      pdf_path: pdfPath,
      total_slides: totalSlides,
    });

    if (dbError) {
      res.status(500).json({ error: "Failed to create session" });
      return;
    }

    res.json({ id, totalSlides });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/sessions/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error || !data) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const { data: urlData } = supabase.storage
    .from("presentations")
    .getPublicUrl(data.pdf_path);

  res.json({ ...data, pdfUrl: urlData.publicUrl });
});

// --- WebSocket ---

io.on("connection", (socket) => {
  socket.on("join_session", async ({ sessionId, role }: { sessionId: string; role: string }) => {
    const { data } = await supabase
      .from("sessions")
      .select("current_slide, total_slides")
      .eq("id", sessionId)
      .single();

    if (!data) {
      socket.emit("error", { message: "Session not found" });
      return;
    }

    socket.join(sessionId);
    socket.data.sessionId = sessionId;
    socket.data.role = role;

    if (role === "controller") {
      controllers.set(sessionId, socket.id);
    }

    socket.emit("session_state", {
      currentSlide: data.current_slide,
      totalSlides: data.total_slides,
    });
  });

  socket.on("slide_change", async ({ slideNumber }: { slideNumber: number }) => {
    const { sessionId } = socket.data;
    if (!sessionId) return;

    if (controllers.get(sessionId) !== socket.id) return;

    await supabase
      .from("sessions")
      .update({ current_slide: slideNumber })
      .eq("id", sessionId);

    io.to(sessionId).emit("slide_update", { slideNumber });
  });

  socket.on("disconnect", () => {
    const { sessionId } = socket.data;
    if (sessionId && controllers.get(sessionId) === socket.id) {
      controllers.delete(sessionId);
    }
  });
});

// --- Cleanup expired sessions (every hour) ---

async function cleanupExpired() {
  const { data: expired } = await supabase
    .from("sessions")
    .select("id, pdf_path")
    .lt("expires_at", new Date().toISOString());

  if (!expired?.length) return;

  const paths = expired.map((s) => s.pdf_path);
  await supabase.storage.from("presentations").remove(paths);

  const ids = expired.map((s) => s.id);
  await supabase.from("sessions").delete().in("id", ids);

  console.log(`Cleaned up ${expired.length} expired session(s)`);
}

setInterval(cleanupExpired, 60 * 60 * 1000);

// --- Start ---

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
