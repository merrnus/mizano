// Tarayıcı-yan: PDF'in ilk sayfasının küçük resmini üretir.
// Worker'ı `?url` ile lazy import eder, SSR'a sızmaz.

const cache = new Map<string, string>();
const inFlight = new Map<string, Promise<string | null>>();

const MAX_BOYUT = 10 * 1024 * 1024;

export async function pdfThumbnailUret(
  storagePath: string,
  signedUrl: string,
  boyut?: number | null,
): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (boyut != null && boyut > MAX_BOYUT) return null;
  const cached = cache.get(storagePath);
  if (cached) return cached;
  const ongoing = inFlight.get(storagePath);
  if (ongoing) return ongoing;

  const p = (async () => {
    try {
      const pdfjs = await import("pdfjs-dist");
      const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url"))
        .default;
      (pdfjs.GlobalWorkerOptions as { workerSrc: string }).workerSrc = workerUrl;

      const loadingTask = pdfjs.getDocument({ url: signedUrl });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const targetWidth = 240;
      const scale = targetWidth / viewport.width;
      const scaled = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = scaled.width;
      canvas.height = scaled.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      await page.render({ canvas, canvasContext: ctx, viewport: scaled } as Parameters<typeof page.render>[0])
        .promise;
      const url = canvas.toDataURL("image/jpeg", 0.7);
      cache.set(storagePath, url);
      return url;
    } catch {
      return null;
    } finally {
      inFlight.delete(storagePath);
    }
  })();
  inFlight.set(storagePath, p);
  return p;
}