import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { loadPdf, renderPage, clearCache } from "@/lib/pdf";
import { socket } from "@/lib/socket";
import { getSessionAuth } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ControllerView } from "./ControllerView";
import { ViewerView } from "./ViewerView";

export default function Presentation() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedRole = searchParams.get("role") || "viewer";
  const [role, setRole] = useState(requestedRole);

  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [filename, setFilename] = useState("");
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentCanvasRef = useRef<HTMLDivElement>(null);

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
        setFilename(session.filename);
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

  useEffect(() => {
    if (!filename) return;
    const suffix = role === "controller" ? "Controller" : "Viewer";
    document.title = `${filename} - ${suffix}`;
    return () => { document.title = "Slide Controller"; };
  }, [filename, role]);

  useEffect(() => {
    const { controllerToken } = getSessionAuth(id!);
    socket.connect();
    socket.emit("join_session", { sessionId: id, role: requestedRole, token: controllerToken });

    socket.on("session_state", ({ currentSlide, totalSlides, role: grantedRole }) => {
      setCurrentSlide(currentSlide);
      setTotalSlides(totalSlides);
      if (grantedRole && grantedRole !== requestedRole) {
        setRole(grantedRole);
        setSearchParams({ role: grantedRole }, { replace: true });
      } else {
        setRole(requestedRole);
      }
    });

    socket.on("slide_update", ({ slideNumber }) => {
      setCurrentSlide(slideNumber);
    });

    socket.on("error", ({ message }) => {
      setError(message);
    });

    socket.on("session_ended", () => {
      navigate("/", { replace: true });
    });

    return () => {
      socket.off("session_state");
      socket.off("slide_update");
      socket.off("error");
      socket.off("session_ended");
      socket.disconnect();
    };
  }, [id, requestedRole, navigate, setSearchParams]);

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
  }, [pdf, currentSlide, role]);

  const goTo = useCallback(
    (slide: number) => {
      if (slide < 1 || slide > totalSlides) return;
      socket.emit("slide_change", { slideNumber: slide });
      setCurrentSlide(slide);
    },
    [totalSlides]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading presentation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 space-y-4 text-center">
            <p className="text-3xl">😕</p>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{error}</h2>
              <p className="text-sm text-muted-foreground">
                The presentation may have expired or been ended by the presenter.
              </p>
            </div>
            <Button asChild className="w-full">
              <Link to="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (role === "viewer") {
    return <ViewerView id={id!} pdfUrl={pdfUrl} canvasRef={currentCanvasRef} />;
  }

  return (
    <ControllerView
      id={id!}
      pdf={pdf!}
      pdfUrl={pdfUrl}
      currentSlide={currentSlide}
      totalSlides={totalSlides}
      onGoTo={goTo}
      currentCanvasRef={currentCanvasRef}
    />
  );
}
