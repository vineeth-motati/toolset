/**
 * PDF converters via pdf.js. Text extraction reads the embedded text layer
 * only — no OCR, so scanned/image-only PDFs are rejected with a pointer to
 * the OCR converter. Page rendering (PDF → JPG/PNG) draws each page to a
 * canvas; multi-page documents come back as a zip. The pdf.js worker script
 * is bundled locally (Vite `?url` import), so this needs no CDN and no
 * manual asset copying.
 */
import { canvasToBlob } from './imageConverters';
import { textResult, replaceExtension } from './shared';

// Opens a PDF and hands the document to `fn`, always destroying the
// loading task after — pdf.js documents hold worker-side resources that
// don't get GC'd. (In pdf.js v6, destroy() lives on the loading task,
// not the document proxy.)
export const withPdfDocument = async (file, fn) => {
    const pdfjsLib = await import('pdfjs-dist');
    const workerSrc = (
        await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    ).default;
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

    const buffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    let doc;
    try {
        doc = await loadingTask.promise;
    } catch (error) {
        await loadingTask.destroy();
        if (error?.name === 'PasswordException') {
            throw new Error(
                `${file.name} is password-protected — remove the password and try again`
            );
        }
        throw new Error(
            `Could not open ${file.name} — is it a valid PDF?`
        );
    }
    try {
        return await fn(doc);
    } finally {
        await loadingTask.destroy();
    }
};

// Scale 2 ≈ 144 DPI for a standard page — enough for readable exports
// and reliable OCR without ballooning canvas memory on long documents.
export const renderPdfPage = async (page, scale = 2) => {
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    // pdf.js paints a white background by default, so JPG needs no
    // compositing pass here.
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas;
};

export const pdfToText = async (file) =>
    withPdfDocument(file, async (doc) => {
        const pages = [];
        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const content = await page.getTextContent();
            pages.push(content.items.map((item) => item.str).join(' '));
        }
        if (!pages.some((page) => page.trim())) {
            throw new Error(
                `No embedded text found in ${file.name} — it may be a scanned PDF. Try "OCR: PDF to Text" instead.`
            );
        }
        return textResult(
            pages.join('\n\n'),
            replaceExtension(file.name, 'txt')
        );
    });

// Single page → plain image; multiple pages → zip of images. The images
// are already compressed, so zip entries are stored (level 0) rather than
// deflated again.
const pdfToImages = (mime, extension, quality) => (file) =>
    withPdfDocument(file, async (doc) => {
        const pageBlobs = [];
        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const canvas = await renderPdfPage(page);
            pageBlobs.push(await canvasToBlob(canvas, mime, quality));
        }

        if (pageBlobs.length === 1) {
            return {
                blob: pageBlobs[0],
                filename: replaceExtension(file.name, extension),
            };
        }

        const { zipSync } = await import('fflate');
        const base = file.name.replace(/\.[^.]+$/, '');
        const entries = {};
        for (const [i, blob] of pageBlobs.entries()) {
            entries[`${base}-page-${i + 1}.${extension}`] = [
                new Uint8Array(await blob.arrayBuffer()),
                { level: 0 },
            ];
        }
        return {
            blob: new Blob([zipSync(entries)], { type: 'application/zip' }),
            filename: replaceExtension(file.name, 'zip'),
        };
    });

export const pdfToJpg = pdfToImages('image/jpeg', 'jpg', 0.92);
export const pdfToPng = pdfToImages('image/png', 'png');
