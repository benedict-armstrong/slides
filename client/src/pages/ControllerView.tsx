import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { renderPage } from "@/lib/pdf";
import { getSessionAuth } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DialogOverlay } from "@/components/ui/dialog-overlay";
import { SessionQRCode } from "@/components/SessionQRCode";
import { CopyField } from "@/components/CopyField";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileControllerMenu } from "@/components/MobileControllerMenu";
import { useIsMobile } from "@/hooks/useIsMobile";

interface ControllerViewProps {
  id: string;
  pdf: PDFDocumentProxy;
  pdfUrl: string;
  currentSlide: number;
  totalSlides: number;
  onGoTo: (slide: number) => void;
  currentCanvasRef: React.RefObject<HTMLDivElement | null>;
}

export function ControllerView({
  id,
  pdf,
  pdfUrl,
  currentSlide,
  totalSlides,
  onGoTo,
  currentCanvasRef,
}: ControllerViewProps) {
  const navigate = useNavigate();
  const previewCanvasRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [passphraseDialogOpen, setPassphraseDialogOpen] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  useEffect(() => {
    if (!previewCanvasRef.current) return;
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
  }, [pdf, currentSlide, totalSlides]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        onGoTo(currentSlide + 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onGoTo(currentSlide - 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentSlide, onGoTo]);

  const controllerUrl = `${window.location.origin}/s/${id}?role=controller`;
  const viewerUrl = `${window.location.origin}/s/${id}?role=viewer`;
  const { passphrase } = getSessionAuth(id);

  if (isMobile) {
    return (
      <div className="h-dvh bg-background flex flex-col">
        <div className="border-b px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-sm font-semibold hover:text-muted-foreground transition-colors">
              Presio
            </Link>
            <span className="text-muted-foreground/40">|</span>
            <span className="font-mono font-bold tracking-widest text-sm select-all">{id}</span>
          </div>
          <MobileControllerMenu id={id} pdfUrl={pdfUrl} passphrase={passphrase} />
        </div>

        <div className="flex-1 flex flex-col gap-2 p-3 min-h-0">
          <div className="flex-3 flex flex-col gap-1 min-h-0">
            <p className="text-xs text-muted-foreground font-medium">Current</p>
            <div
              ref={currentCanvasRef}
              className="flex-1 border rounded-lg overflow-hidden bg-white min-h-0"
            />
          </div>
          <div className="flex-2 flex flex-col gap-1 min-h-0">
            <p className="text-xs text-muted-foreground font-medium">Next</p>
            <div
              ref={previewCanvasRef}
              className="flex-1 border rounded-lg overflow-hidden bg-white min-h-0"
            />
          </div>
        </div>

        <div className="border-t px-3 py-3 space-y-2">
          <p className="text-center text-xs text-muted-foreground tabular-nums">
            {currentSlide} / {totalSlides}
          </p>
          <div className="flex gap-2">
            <Button
              className="flex-1 h-12 text-base"
              variant="outline"
              onClick={() => onGoTo(currentSlide - 1)}
              disabled={currentSlide <= 1}
            >
              Previous
            </Button>
            <Button
              className="flex-1 h-12 text-base"
              variant="outline"
              onClick={() => onGoTo(currentSlide + 1)}
              disabled={currentSlide >= totalSlides}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm font-semibold hover:text-muted-foreground transition-colors">
            Presio
          </Link>
          <span className="text-muted-foreground/40">|</span>
          <span className="text-xs text-muted-foreground">Code:</span>
          <span className="font-mono font-bold tracking-widest select-all">{id}</span>
        </div>
        <div className="flex items-center gap-1">
          {passphrase && (
            <Button size="sm" variant="ghost" onClick={() => setPassphraseDialogOpen(true)}>
              Passphrase
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setShareDialogOpen(true)}>
            Share
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/s/${id}?role=viewer`, { replace: true })}>
            Switch to Viewer
          </Button>
          <ThemeToggle />
        </div>
      </div>

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
          <Button variant="destructive" size="sm" onClick={() => setConfirmEnd(true)}>
            End Presentation
          </Button>
        </div>
      </div>

      {shareDialogOpen && (
        <DialogOverlay onClose={() => setShareDialogOpen(false)} maxWidth="max-w-[50%]">
          <SessionQRCode sessionId={id} />
          <div className="space-y-2">
            <CopyField label="Viewer link" value={viewerUrl} />
            <CopyField label="Controller link" value={controllerUrl} />
          </div>
          <Button className="w-full" variant="ghost" onClick={() => setShareDialogOpen(false)}>
            Close
          </Button>
        </DialogOverlay>
      )}

      {passphraseDialogOpen && (
        <DialogOverlay onClose={() => setPassphraseDialogOpen(false)} maxWidth="max-w-xs">
          <div className="text-center space-y-3">
            <h2 className="text-lg font-semibold">Controller Passphrase</h2>
            <p className="text-xs text-muted-foreground">
              Share this passphrase to grant controller access
            </p>
            <p className="text-2xl font-bold tracking-widest font-mono select-all">
              {passphrase}
            </p>
            <CopyField label="" value={passphrase} />
          </div>
          <Button className="w-full" variant="ghost" onClick={() => setPassphraseDialogOpen(false)}>
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
