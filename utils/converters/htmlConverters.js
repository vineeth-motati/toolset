/**
 * HTML converters. Images render the file in a sandboxed iframe (scripts
 * disabled — untrusted HTML must never execute) and capture it with snapdom.
 * PDF goes through html-to-pdfmake → pdfmake for selectable vector text
 * (raster html2canvas-style output is deliberately avoided). External
 * resources referenced by the file are subject to CORS and may be skipped —
 * self-contained HTML converts with full fidelity.
 */
import { replaceExtension } from './shared';

const VIEWPORT_WIDTH = 1024;
const VIEWPORT_HEIGHT = 768;

// Render untrusted HTML off-screen. `allow-same-origin` without
// `allow-scripts` is safe (no code runs) and is required so we can reach
// contentDocument to hand the DOM to snapdom.
const renderHtmlOffscreen = async (html) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-same-origin');
    iframe.style.cssText = `position:fixed;left:-100000px;top:0;width:${VIEWPORT_WIDTH}px;height:${VIEWPORT_HEIGHT}px;border:0;`;
    document.body.appendChild(iframe);

    await new Promise((resolve, reject) => {
        iframe.onload = resolve;
        iframe.onerror = () =>
            reject(new Error('Could not render the HTML file'));
        iframe.srcdoc = html;
    });

    const doc = iframe.contentDocument;
    if (!doc?.body) {
        iframe.remove();
        throw new Error('Could not render the HTML file');
    }
    await doc.fonts?.ready?.catch?.(() => {});
    // Grow the iframe to the full content height so the capture isn't
    // clipped to the initial viewport.
    iframe.style.height = `${Math.max(
        VIEWPORT_HEIGHT,
        doc.documentElement.scrollHeight
    )}px`;

    return { doc, cleanup: () => iframe.remove() };
};

const htmlToImage = async (file, format) => {
    const html = await file.text();
    if (!html.trim()) {
        throw new Error(`${file.name} is empty — nothing to capture`);
    }
    const { snapdom } = await import('@zumer/snapdom');
    const { doc, cleanup } = await renderHtmlOffscreen(html);
    try {
        const capture = await snapdom(doc.body, {
            backgroundColor: '#ffffff',
            embedFonts: true,
        });
        const blob = await capture.toBlob({
            type: format,
            quality: format === 'jpg' ? 0.92 : undefined,
        });
        return {
            blob,
            filename: replaceExtension(file.name, format),
        };
    } finally {
        cleanup();
    }
};

export const htmlToPng = (file) => htmlToImage(file, 'png');
export const htmlToJpg = (file) => htmlToImage(file, 'jpg');

export const htmlToPdf = async (file) => {
    const html = await file.text();
    if (!html.trim()) {
        throw new Error(`${file.name} is empty — nothing to convert`);
    }

    const [pdfMakeModule, vfsModule, htmlToPdfmakeModule] = await Promise.all([
        import('pdfmake/build/pdfmake'),
        import('pdfmake/build/vfs_fonts'),
        import('html-to-pdfmake'),
    ]);
    const pdfMake = pdfMakeModule.default ?? pdfMakeModule;
    const vfs = vfsModule.default ?? vfsModule;
    if (typeof pdfMake.addVirtualFileSystem === 'function') {
        pdfMake.addVirtualFileSystem(vfs);
    } else {
        pdfMake.vfs = vfs;
    }
    const htmlToPdfmake = htmlToPdfmakeModule.default ?? htmlToPdfmakeModule;

    let content;
    try {
        content = htmlToPdfmake(html, { window });
    } catch (error) {
        throw new Error(
            `Could not parse ${file.name} as HTML: ${error.message}`
        );
    }

    const blob = await pdfMake
        .createPdf({
            content,
            pageMargins: [40, 40, 40, 40],
        })
        .getBlob();

    return {
        blob,
        filename: replaceExtension(file.name, 'pdf'),
    };
};
