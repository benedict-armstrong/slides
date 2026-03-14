import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { loadPdf, renderPage, clearCache } from "@/lib/pdf";
import { socket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DialogOverlay } from "@/components/ui/dialog-overlay";
import { SessionQRCode } from "@/components/SessionQRCode";

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex gap-1.5">
        <code className="flex-1 text-xs bg-muted rounded px-2 py-1.5 overflow-x-auto select-all truncate">
          {value}
        </code>
        <Button
          size="xs"
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button
          size="xs"
          variant="outline"
          onClick={() => window.open(value, "_blank", "noopener,noreferrer")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />
            <path d="M21 3 12 12" />
            <path d="M15 3h6v6" />
          </svg>
        </Button>
      </div>
    </div>
  );
}

export default function Presentation() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get("role") || "viewer";

  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const currentCanvasRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLDivElement>(null);

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
  }, [id, role, navigate]);

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

  const controllerUrl = `${window.location.origin}/s/${id}?role=controller`;
  const viewerUrl = `${window.location.origin}/s/${id}?role=viewer`;

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Code:</span>
          <span className="font-mono font-bold tracking-widest select-all">{id}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setQrOpen(true)}>
            QR Code
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShareOpen((v) => !v)}>
            {shareOpen ? "Hide Links" : "Share Links"}
          </Button>
        </div>
      </div>

      {shareOpen && (
        <div className="border-b px-4 py-3 space-y-2 bg-muted/30">
          <CopyField label="Viewer link" value={viewerUrl} />
          <CopyField label="Controller link" value={controllerUrl} />
        </div>
      )}

      <div className="flex-1 flex gap-4 p-4 min-h-0">
        <div className="flex-3 flex flex-col gap-2 min-h-0">
          <p className="text-xs text-muted-foreground font-medium">Current Slide</p>
          <div
            ref={currentCanvasRef}
            className="flex-1 border rounded-lg overflow-hidden bg-white min-h-0"
          />
        </div>
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <p className="text-xs text-muted-foreground font-medium">Next</p>
          <div
            ref={previewCanvasRef}
            className="flex-1 border rounded-lg overflow-hidden bg-white min-h-0"
          />
        </div>
      </div>

      <SlideControls
        currentSlide={currentSlide}
        totalSlides={totalSlides}
        pdfUrl={pdfUrl}
        onGoTo={goTo}
        onEndPresentation={() => setConfirmEnd(true)}
      />

      {qrOpen && (
        <DialogOverlay onClose={() => setQrOpen(false)} maxWidth="max-w-xs">
          <SessionQRCode sessionId={id!} />
          <Button className="w-full" variant="ghost" onClick={() => setQrOpen(false)}>
            Close
          </Button>
        </DialogOverlay>
      )}

      {confirmEnd && (
        <DialogOverlay onClose={() => setConfirmEnd(false)}>
          <div className="space-y-2 text-center">
            <h2 className="text-lg font-semibold">End Presentation?</h2>
            <p className="text-sm text-muted-foreground">
              This will disconnect all viewers and permanently delete the
              presentation. This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" variant="outline" onClick={() => setConfirmEnd(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              variant="destructive"
              onClick={async () => {
                await fetch(`/api/sessions/${id}`, { method: "DELETE" });
                navigate("/", { replace: true });
              }}
            >
              End Presentation
            </Button>
          </div>
        </DialogOverlay>
      )}
    </div>
  );
}

function SlideControls({
  currentSlide,
  totalSlides,
  pdfUrl,
  onGoTo,
  onEndPresentation,
}: {
  currentSlide: number;
  totalSlides: number;
  pdfUrl: string;
  onGoTo: (slide: number) => void;
  onEndPresentation: () => void;
}) {
  return (
    <div className="border-t p-4 flex items-center justify-center gap-4">
      <Button
        variant="outline"
        onClick={() => onGoTo(currentSlide - 1)}
        disabled={currentSlide <= 1}
      >
        Previous
      </Button>
      <span className="text-sm font-medium tabular-nums">
        {currentSlide} / {totalSlides}
      </span>
      <Button
        variant="outline"
        onClick={() => onGoTo(currentSlide + 1)}
        disabled={currentSlide >= totalSlides}
      >
        Next
      </Button>
      <div className="ml-auto flex items-center gap-2">
        {pdfUrl && (
          <Button variant="ghost" size="sm" asChild>
            <a href={pdfUrl} download>
              Download PDF
            </a>
          </Button>
        )}
        <Button variant="destructive" size="sm" onClick={onEndPresentation}>
          End Presentation
        </Button>
      </div>
    </div>
  );
}

function ViewerView({
  id,
  pdfUrl,
  canvasRef,
}: {
  id: string;
  pdfUrl: string;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}) {
  const navigate = useNavigate();
  const [cursorVisible, setCursorVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const resetTimer = useCallback(() => {
    setCursorVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!menuOpen) setCursorVisible(false);
    }, 3000);
  }, [menuOpen]);

  useEffect(() => {
    resetTimer();
    window.addEventListener("mousemove", resetTimer);
    return () => {
      window.removeEventListener("mousemove", resetTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  return (
    <div
      className="h-screen w-screen bg-black flex items-center justify-center relative"
      style={{ cursor: cursorVisible ? "default" : "none" }}
    >
      <div ref={canvasRef} className="w-full h-full" />

      <button
        onClick={() => setMenuOpen(true)}
        className={`absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur transition-opacity duration-300 ${
          cursorVisible ? "opacity-70 hover:opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </button>

      {menuOpen && (
        <DialogOverlay onClose={() => setMenuOpen(false)} maxWidth="max-w-xs">
          <SessionQRCode sessionId={id} size={160} />
          <div className="space-y-2">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => navigate(`/s/${id}?role=controller`)}
            >
              Switch to Controller
            </Button>
            {pdfUrl && (
              <Button className="w-full" variant="outline" asChild>
                <a href={pdfUrl} download>
                  Download PDF
                </a>
              </Button>
            )}
            <Button className="w-full" variant="ghost" onClick={() => setMenuOpen(false)}>
              Close
            </Button>
          </div>
        </DialogOverlay>
      )}
    </div>
  );
}
