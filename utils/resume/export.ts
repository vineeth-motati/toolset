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
import type { ResumeDoc } from './types';

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
