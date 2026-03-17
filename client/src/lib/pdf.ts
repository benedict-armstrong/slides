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

let notesCache: Map<number, string> | null = null;
let notesCachePdf: PDFDocumentProxy | null = null;

async function loadNotesFromAttachments(pdf: PDFDocumentProxy): Promise<Map<number, string>> {
  if (notesCachePdf === pdf && notesCache) return notesCache;

  const map = new Map<number, string>();
  const attachments = await pdf.getAttachments();
  console.log("[pdf] attachments:", attachments);
  if (attachments) {
    for (const [, attachment] of Object.entries<any>(attachments)) {
      const match = (attachment.filename ?? "").match(/^notes-slide-(\d+)\.json$/);
      if (!match) continue;
      try {
        const text = new TextDecoder().decode(attachment.content);
        const data = JSON.parse(text);
        const slideNum = parseInt(match[1], 10);
        map.set(slideNum, typeof data.notes === "string" ? data.notes : JSON.stringify(data.notes));
      } catch { /* skip malformed */ }
    }
  }

  notesCache = map;
  notesCachePdf = pdf;
  return map;
}

async function extractNotesFromAnnotations(
  pdf: PDFDocumentProxy,
  pageNum: number,
  prefix = "note:"
): Promise<string> {
  const page = await pdf.getPage(pageNum);
  const annotations = await page.getAnnotations();
  const notes: string[] = [];
  for (const ann of annotations) {
    const url: string | undefined = ann.url || ann.unsafeUrl;
    if (url && url.startsWith(prefix)) {
      notes.push(decodeURIComponent(url.slice(prefix.length)));
    }
  }
  return notes.join("\n\n");
}

export async function extractSpeakerNotes(
  pdf: PDFDocumentProxy,
  pageNum: number,
  prefix = "note:"
): Promise<string> {
  const map = await loadNotesFromAttachments(pdf);
  if (map.has(pageNum)) return map.get(pageNum)!;
  return extractNotesFromAnnotations(pdf, pageNum, prefix);
}

export function clearCache() {
  pageCache.clear();
}
