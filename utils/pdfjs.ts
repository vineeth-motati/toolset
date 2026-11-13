/**
 * Single place that loads pdf.js and points it at our worker. Previously each
 * caller (resume preview, resume countPages, the PDF converters) repeated the
 * import + workerSrc dance; they now share this memoised loader so the worker
 * URL and the Upsert polyfill can never drift apart between them.
 *
 * `?worker&url` makes Vite bundle workers/pdfjs.js — polyfill and all — and
 * hand back the emitted asset's URL, so pdf.js keeps constructing its own
 * workers from `workerSrc` exactly as before. Needs vite.worker.format='es'
 * (set in nuxt.config.ts) because the pdf.js worker is an ES module.
 */
import { installMapUpsert } from './polyfills/mapUpsert';
import pdfWorkerUrl from '~/workers/pdfjs.js?worker&url';

let pdfjsPromise: Promise<any> | null = null;

export async function loadPdfjs(): Promise<any> {
    if (!pdfjsPromise) {
        // Synchronously, before the import is even started, so pdf.js never
        // observes a Map without the method — main thread as well as worker.
        installMapUpsert();
        pdfjsPromise = import('pdfjs-dist');
    }
    const lib = await pdfjsPromise;
    // Re-asserted on every call rather than once at load: it is a string
    // assignment, and it keeps callers independent of who loaded pdf.js first.
    lib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    return lib;
}
