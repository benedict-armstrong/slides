import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { renderPage } from "@/lib/pdf";

export function ThumbnailsCard({
  pdf,
  totalSlides,
  currentSlide,
  onGoTo,
}: {
  pdf: PDFDocumentProxy;
  totalSlides: number;
  currentSlide: number;
  onGoTo: (slide: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    pdf.getPage(1).then((page) => {
      const vp = page.getViewport({ scale: 1 });
      setAspectRatio(vp.width / vp.height);
    });
  }, [pdf]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const pageNum = Number((entry.target as HTMLElement).dataset.page);
          if (!pageNum) return;
          renderPage(pdf, pageNum, 0.5).then((canvas) => {
            const el = entry.target as HTMLDivElement;
            if (el.childElementCount > 0) return;
            canvas.style.width = "100%";
            canvas.style.height = "100%";
            canvas.style.objectFit = "contain";
            el.appendChild(canvas);
          });
          observer.unobserve(entry.target);
        });
      },
      { root: containerRef.current, threshold: 0.1 }
    );
    thumbRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pdf, totalSlides]);

  useEffect(() => {
    const el = thumbRefs.current.get(currentSlide);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [currentSlide]);

  return (
    <div
      ref={containerRef}
      className="flex gap-2 overflow-x-auto h-full items-start p-1"
    >
      {Array.from({ length: totalSlides }, (_, i) => i + 1).map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onGoTo(num)}
          className={`shrink-0 h-full rounded border overflow-hidden transition-all ${
            num === currentSlide
              ? "ring-2 ring-red-500 border-red-500"
              : "border-border hover:border-foreground/30"
          }`}
          style={aspectRatio ? { aspectRatio, minWidth: 80 } : { minWidth: 80 }}
        >
          <div
            ref={(el) => { if (el) thumbRefs.current.set(num, el); }}
            data-page={num}
            className="w-full h-full"
          />
        </button>
      ))}
    </div>
  );
}
