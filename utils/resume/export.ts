/**
 * PDF/JSON export + preview. The pdfmake engine is lazy-loaded inside the
 * handlers (dynamic import) so nothing is added to the base bundle — matching
 * the local-converters house rule (see utils/converters/htmlConverters.js).
 *
 * The SAME docDefinition feeds getDataUrl() (live preview iframe) and getBlob()
 * (download), guaranteeing the preview and the file are identical.
 */
import { buildDocDefinition } from './templates';
import { toJsonResume } from './jsonResume';
import { buildDocxParts } from './docx';
import type { ResumeDoc } from './types';

export const DOCX_MIME =
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

let pdfMakePromise: Promise<any> | null = null;

async function getPdfMake(): Promise<any> {
    if (!pdfMakePromise) {
        pdfMakePromise = (async () => {
            const [pdfMakeModule, vfsModule] = await Promise.all([
                import('pdfmake/build/pdfmake'),
                import('pdfmake/build/vfs_fonts'),
            ]);
            const pdfMake = pdfMakeModule.default ?? pdfMakeModule;
            const vfs = vfsModule.default ?? vfsModule;
            if (typeof pdfMake.addVirtualFileSystem === 'function') {
                pdfMake.addVirtualFileSystem(vfs);
            } else {
                pdfMake.vfs = vfs;
            }
            return pdfMake;
        })();
    }
    return pdfMakePromise;
}

/** Create a pdfmake document object for the current resume. */
async function createPdf(doc: ResumeDoc) {
    const pdfMake = await getPdfMake();
    const def = buildDocDefinition(doc, doc.meta.theme);
    return pdfMake.createPdf(def);
}

// pdfmake 0.3.x returns a Promise from getBlob() when no callback is passed
// (the callback form never fires) — so we await directly, matching
// utils/converters/htmlConverters.js. The blob feeds both the live preview
// (URL.createObjectURL) and the download.
export async function toBlob(doc: ResumeDoc): Promise<Blob> {
    const pdf = await createPdf(doc);
    return pdf.getBlob();
}

/**
 * How many pages the resume currently occupies. pdfmake exposes no page count,
 * so the cheapest reliable answer is to open the produced bytes with pdf.js —
 * already a dependency for the PDF converters. Used by "fit to one page".
 */
export async function countPages(doc: ResumeDoc): Promise<number> {
    const blob = await toBlob(doc);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const pdfjsLib = await import('pdfjs-dist');
    const workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
    const task = pdfjsLib.getDocument({ data: bytes });
    try {
        const pdf = await task.promise;
        return pdf.numPages;
    } finally {
        await task.destroy();
    }
}

function safeFileName(doc: ResumeDoc, ext: string): string {
    const base =
        (doc.basics.name || doc.name || 'resume')
            .trim()
            .replace(/[^a-z0-9]+/gi, '_')
            .replace(/^_+|_+$/g, '') || 'resume';
    return `${base}.${ext}`;
}

function triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Revoke on the next tick so the download has a chance to start.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Build and download the resume as a PDF. */
export async function downloadPdf(doc: ResumeDoc): Promise<void> {
    const blob = await toBlob(doc);
    triggerDownload(blob, safeFileName(doc, 'pdf'));
}

/** Download the resume as a spec-valid JSON Resume file. */
export function downloadJsonResume(doc: ResumeDoc): void {
    const json = JSON.stringify(toJsonResume(doc), null, 2);
    triggerDownload(new Blob([json], { type: 'application/json' }), safeFileName(doc, 'json'));
}

/** Download a plain-text copy (handy for pasting into ATS web forms). */
export function downloadPlainText(doc: ResumeDoc, text: string): void {
    triggerDownload(new Blob([text], { type: 'text/plain' }), safeFileName(doc, 'txt'));
}

/**
 * Zip the WordprocessingML parts into a .docx. fflate is lazy-imported to keep
 * it out of the base bundle, matching the local-converters house rule.
 */
export async function toDocxBlob(doc: ResumeDoc): Promise<Blob> {
    const { zipSync, strToU8 } = await import('fflate');
    const parts = buildDocxParts(doc, doc.meta.theme);
    const files: Record<string, Uint8Array> = {};
    for (const [path, xml] of Object.entries(parts)) {
        files[path] = strToU8(xml);
    }
    return new Blob([zipSync(files, { level: 6 })], { type: DOCX_MIME });
}

/** Build and download the resume as an editable Word document. */
export async function downloadDocx(doc: ResumeDoc): Promise<void> {
    triggerDownload(await toDocxBlob(doc), safeFileName(doc, 'docx'));
}
