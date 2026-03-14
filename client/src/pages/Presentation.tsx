import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { loadPdf, renderPage, clearCache } from "@/lib/pdf";
import { socket } from "@/lib/socket";
import { Button } from "@/components/ui/button";

export default function Presentation() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "viewer";

  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentCanvasRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLDivElement>(null);

  // Fetch session & load PDF
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/sessions/${id}`);
        if (!res.ok) throw new Error("Session not found");
        const session = await res.json();
        const doc = await loadPdf(session.pdfUrl);
        if (cancelled) return;
        setPdfUrl(session.pdfUrl);
        setPdf(doc);
        setTotalSlides(session.total_slides);
        setCurrentSlide(session.current_slide);
      } catch {
        if (!cancelled) setError("Failed to load presentation");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      clearCache();
    };
  }, [id]);

  // Connect socket
  useEffect(() => {
    socket.connect();
    socket.emit("join_session", { sessionId: id, role });

    socket.on("session_state", ({ currentSlide, totalSlides }) => {
      setCurrentSlide(currentSlide);
      setTotalSlides(totalSlides);
    });

    socket.on("slide_update", ({ slideNumber }) => {
      setCurrentSlide(slideNumber);
    });

    socket.on("error", ({ message }) => {
      setError(message);
    });

    return () => {
      socket.off("session_state");
      socket.off("slide_update");
      socket.off("error");
      socket.disconnect();
    };
  }, [id, role]);

  // Render current slide
  useEffect(() => {
    if (!pdf || !currentCanvasRef.current) return;
    const container = currentCanvasRef.current;
    renderPage(pdf, currentSlide).then((canvas) => {
      container.innerHTML = "";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.objectFit = "contain";
      container.appendChild(canvas);
    });
  }, [pdf, currentSlide]);

  // Render next-slide preview (controller only)
  useEffect(() => {
    if (!pdf || role !== "controller" || !previewCanvasRef.current) return;
    const container = previewCanvasRef.current;
    if (currentSlide < totalSlides) {
      renderPage(pdf, currentSlide + 1, 1).then((canvas) => {
        container.innerHTML = "";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.objectFit = "contain";
        container.appendChild(canvas);
      });
    } else {
      container.innerHTML =
        '<div class="flex items-center justify-center h-full text-muted-foreground text-sm">End of presentation</div>';
    }
  }, [pdf, currentSlide, totalSlides, role]);

  const goTo = useCallback(
    (slide: number) => {
      if (slide < 1 || slide > totalSlides) return;
      socket.emit("slide_change", { slideNumber: slide });
      setCurrentSlide(slide);
    },
    [totalSlides]
  );

  // Keyboard shortcuts
  useEffect(() => {
    if (role !== "controller") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goTo(currentSlide + 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(currentSlide - 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [role, currentSlide, goTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading presentation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (role === "viewer") {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center relative">
        <div ref={currentCanvasRef} className="w-full h-full" />
        {pdfUrl && (
          <a
            href={pdfUrl}
            download
            className="absolute bottom-4 right-4 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
          >
            <Button size="sm" variant="secondary">
              Download PDF
            </Button>
          </a>
        )}
      </div>
    );
  }

  // Controller view
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex gap-4 p-4">
        {/* Current slide */}
        <div className="flex-3 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground font-medium">Current Slide</p>
          <div
            ref={currentCanvasRef}
            className="flex-1 border rounded-lg overflow-hidden bg-white"
          />
        </div>
        {/* Next slide preview */}
        <div className="flex-1 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground font-medium">Next</p>
          <div
            ref={previewCanvasRef}
            className="flex-1 border rounded-lg overflow-hidden bg-white"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="border-t p-4 flex items-center justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => goTo(currentSlide - 1)}
          disabled={currentSlide <= 1}
        >
          Previous
        </Button>
        <span className="text-sm font-medium tabular-nums">
          {currentSlide} / {totalSlides}
        </span>
        <Button
          variant="outline"
          onClick={() => goTo(currentSlide + 1)}
          disabled={currentSlide >= totalSlides}
        >
          Next
        </Button>
        {pdfUrl && (
          <Button variant="ghost" size="sm" asChild className="ml-auto">
            <a href={pdfUrl} download>
              Download PDF
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
