/**
 * PDF converters. pdf.js, its worker asset URL, fflate and the canvas are
 * mocked — the tests verify OUR wiring: worker src set before getDocument,
 * pages read in order, document always destroyed, scanned-PDF/password
 * error paths, and single-page vs multi-page (zip) output shapes.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    pdfToText,
    pdfToJpg,
    pdfToPng,
} from '@/utils/converters/pdfConverters';
import { makeFile } from '../helpers';

vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({
    default: 'mock-worker-url',
}));

const globalWorkerOptions = vi.hoisted(() => ({ workerSrc: undefined }));
const getDocumentMock = vi.hoisted(() => vi.fn());
vi.mock('pdfjs-dist', () => ({
    GlobalWorkerOptions: globalWorkerOptions,
    getDocument: getDocumentMock,
}));

const zipCalls = vi.hoisted(() => []);
vi.mock('fflate', () => ({
    zipSync: (entries) => {
        zipCalls.push(entries);
        return new Uint8Array([0x50, 0x4b, 0x03, 0x04]); // 'PK\x03\x04'
    },
}));

// pagesText: one string[] of text items per page. Rendering succeeds on
// every page; per-page dimensions come from getViewport.
const fakeDoc = (pagesText) => ({
    numPages: pagesText.length,
    getPage: vi.fn(async (num) => ({
        getTextContent: vi.fn(async () => ({
            items: pagesText[num - 1].map((str) => ({ str })),
        })),
        getViewport: vi.fn(({ scale }) => ({
            width: 100 * scale,
            height: 140 * scale,
        })),
        render: vi.fn(() => ({ promise: Promise.resolve() })),
    })),
});

// getDocument returns a loading task; destroy() lives on the task, not
// the document proxy (pdf.js v6 API).
const resolveDoc = (doc, { destroy = vi.fn() } = {}) => {
    const task = { promise: Promise.resolve(doc), destroy };
    getDocumentMock.mockReturnValue(task);
    return task;
};

const rejectDoc = (error, { destroy = vi.fn() } = {}) => {
    const task = { promise: Promise.reject(error), destroy };
    getDocumentMock.mockReturnValue(task);
    return task;
};

let canvases;
const fakeCanvas = (idx) => {
    const canvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({})),
        toBlob(callback, mime, quality) {
            canvas.toBlobArgs = { mime, quality };
            callback(new Blob([`page-${idx}`], { type: mime }));
        },
    };
    return canvas;
};

beforeEach(() => {
    canvases = [];
    const original = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'canvas') {
            const canvas = fakeCanvas(canvases.length);
            canvases.push(canvas);
            return canvas;
        }
        return original(tag);
    });
});

afterEach(() => {
    vi.restoreAllMocks();
    getDocumentMock.mockReset();
    globalWorkerOptions.workerSrc = undefined;
    zipCalls.length = 0;
});

describe('pdfToText (/tools/convert/pdf-to-text)', () => {
    it('sets the worker src before loading the document', async () => {
        resolveDoc(fakeDoc([['Hello', 'world']]));
        await pdfToText(makeFile('%PDF-fake', 'doc.pdf'));
        expect(globalWorkerOptions.workerSrc).toBe('mock-worker-url');
    });

    it('joins text items within a page and pages with a blank line', async () => {
        resolveDoc(
            fakeDoc([
                ['Page', 'one'],
                ['Page', 'two'],
            ])
        );

        const result = await pdfToText(makeFile('%PDF-fake', 'doc.pdf'));

        expect(result.filename).toBe('doc.txt');
        expect(result.text).toBe('Page one\n\nPage two');
        expect(await result.blob.text()).toBe('Page one\n\nPage two');
    });

    it('destroys the loading task after conversion', async () => {
        const destroy = vi.fn();
        resolveDoc(fakeDoc([['x']]), { destroy });
        await pdfToText(makeFile('%PDF-fake', 'doc.pdf'));
        expect(destroy).toHaveBeenCalled();
    });

    it('destroys the loading task even when a page read fails', async () => {
        const destroy = vi.fn();
        const doc = fakeDoc([['x']]);
        doc.getPage.mockRejectedValue(new Error('page corrupt'));
        resolveDoc(doc, { destroy });
        await expect(
            pdfToText(makeFile('%PDF-fake', 'doc.pdf'))
        ).rejects.toThrow('page corrupt');
        expect(destroy).toHaveBeenCalled();
    });

    it('rejects scanned PDFs (no text layer) pointing at the OCR tool', async () => {
        resolveDoc(fakeDoc([[''], [' ']]));
        await expect(
            pdfToText(makeFile('%PDF-fake', 'scan.pdf'))
        ).rejects.toThrow(/scanned PDF.*OCR: PDF to Text/);
    });

    it('reports password-protected PDFs by name', async () => {
        const error = new Error('No password given');
        error.name = 'PasswordException';
        const destroy = vi.fn();
        rejectDoc(error, { destroy });
        await expect(
            pdfToText(makeFile('%PDF-fake', 'locked.pdf'))
        ).rejects.toThrow('locked.pdf is password-protected');
        expect(destroy).toHaveBeenCalled();
    });

    it('reports unreadable input by filename', async () => {
        rejectDoc(new Error('Invalid PDF structure'));
        await expect(pdfToText(makeFile('junk', 'broken.pdf'))).rejects.toThrow(
            'Could not open broken.pdf'
        );
    });
});

describe.each([
    ['pdfToJpg', pdfToJpg, 'jpg', 'image/jpeg', 0.92],
    ['pdfToPng', pdfToPng, 'png', 'image/png', undefined],
])('%s', (name, convert, extension, mime, quality) => {
    it(`renders a single page straight to ${mime}`, async () => {
        const destroy = vi.fn();
        resolveDoc(fakeDoc([['ignored']]), { destroy });

        const result = await convert(makeFile('%PDF-fake', 'doc.pdf'));

        expect(result.filename).toBe(`doc.${extension}`);
        expect(result.blob.type).toBe(mime);
        // Canvas sized from the scale-2 viewport (100x140 base).
        expect(canvases).toHaveLength(1);
        expect(canvases[0].width).toBe(200);
        expect(canvases[0].height).toBe(280);
        expect(canvases[0].toBlobArgs).toEqual({ mime, quality });
        expect(destroy).toHaveBeenCalled();
        expect(zipCalls).toHaveLength(0);
    });

    it('bundles multi-page documents into a stored (level 0) zip', async () => {
        resolveDoc(fakeDoc([['p1'], ['p2'], ['p3']]));

        const result = await convert(makeFile('%PDF-fake', 'report.pdf'));

        expect(result.filename).toBe('report.zip');
        expect(result.blob.type).toBe('application/zip');
        expect(zipCalls).toHaveLength(1);
        const entries = zipCalls[0];
        expect(Object.keys(entries)).toEqual([
            `report-page-1.${extension}`,
            `report-page-2.${extension}`,
            `report-page-3.${extension}`,
        ]);
        for (const [data, opts] of Object.values(entries)) {
            expect(data).toBeInstanceOf(Uint8Array);
            expect(opts).toEqual({ level: 0 });
        }
    });
});
