import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorker;

const pageCache = new Map<string, HTMLCanvasElement>();

export async function loadPdf(url: string): Promise<PDFDocumentProxy> {
  return getDocument(url).promise;
}

export async function renderPage(
  pdf: PDFDocumentProxy,
  pageNum: number,
  scale = 2
): Promise<HTMLCanvasElement> {
  const key = `${pageNum}-${scale}`;
  if (pageCache.has(key)) return pageCache.get(key)!;

  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: canvas.getContext("2d")!,
    canvas,
    viewport,
  }).promise;

  pageCache.set(key, canvas);
  return canvas;
}

export function clearCache() {
  pageCache.clear();
}
