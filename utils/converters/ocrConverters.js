/**
 * OCR via tesseract.js. The worker/core/language files are fetched from
 * tesseract.js's default CDN on first use per language, then cached by the
 * browser (IndexedDB) — unlike every other local converter, these need
 * network access the first time a given OCR language is used.
 */
import { withPdfDocument, renderPdfPage } from './pdfConverters';
import { textResult, replaceExtension } from './shared';

// Creates a worker for the selected language, hands it to `fn`, and always
// terminates it — tesseract workers are real Web Workers and won't be GC'd.
const withOcrWorker = async (options = {}, fn) => {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker(options.language_ocr || 'eng');
    try {
        return await fn(worker);
    } finally {
        await worker.terminate();
    }
};

const ocrImageToText = (file, options) =>
    withOcrWorker(options, async (worker) => {
        const {
            data: { text },
        } = await worker.recognize(file);
        return textResult(text, replaceExtension(file.name, 'txt'));
    });

export const ocrPngToText = ocrImageToText;
export const ocrJpgToText = ocrImageToText;

// Image → searchable PDF: tesseract renders the image with an invisible
// text layer on top, so the output PDF is selectable/searchable.
const ocrImageToPdf = (file, options) =>
    withOcrWorker(options, async (worker) => {
        const { data } = await worker.recognize(
            file,
            { pdfTitle: file.name.replace(/\.[^.]+$/, '') },
            { pdf: true }
        );
        return {
            blob: new Blob([new Uint8Array(data.pdf)], {
                type: 'application/pdf',
            }),
            filename: replaceExtension(file.name, 'pdf'),
        };
    });

export const ocrPngToPdf = ocrImageToPdf;
export const ocrJpgToPdf = ocrImageToPdf;

// Scanned PDF → text: pdf.js rasterizes each page, tesseract reads it.
// One worker is reused across pages (per tesseract.js guidance — worker
// startup dwarfs per-page recognition for short documents).
export const ocrPdfToText = (file, options) =>
    withPdfDocument(file, (doc) =>
        withOcrWorker(options, async (worker) => {
            const pages = [];
            for (let i = 1; i <= doc.numPages; i++) {
                const page = await doc.getPage(i);
                const canvas = await renderPdfPage(page);
                const {
                    data: { text },
                } = await worker.recognize(canvas);
                pages.push(text);
            }
            return textResult(
                pages.join('\n\n'),
                replaceExtension(file.name, 'txt')
            );
        })
    );
