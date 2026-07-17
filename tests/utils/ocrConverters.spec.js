/**
 * OCR converters. tesseract.js and the pdf.js helpers are mocked — the
 * tests verify OUR wiring: language passed to createWorker (defaulting to
 * 'eng'), the worker always terminated (even on failure), searchable-PDF
 * output assembly, and the render-then-recognize loop for scanned PDFs.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import {
    ocrPngToText,
    ocrJpgToText,
    ocrPngToPdf,
    ocrJpgToPdf,
    ocrPdfToText,
} from '@/utils/converters/ocrConverters';
import { makeFile } from '../helpers';

const workerCalls = vi.hoisted(() => ({ createWorker: vi.fn() }));
const fakeWorker = vi.hoisted(() => ({
    recognize: vi.fn(),
    terminate: vi.fn(),
}));
vi.mock('tesseract.js', () => ({
    createWorker: (...args) => {
        workerCalls.createWorker(...args);
        return Promise.resolve(fakeWorker);
    },
}));

// ocrPdfToText composes the pdf.js helpers — mocked here so these tests
// only exercise the OCR loop (pdfConverters.spec.js covers the real ones).
const pdfMocks = vi.hoisted(() => ({
    doc: null,
    renderPdfPage: vi.fn(),
}));
vi.mock('@/utils/converters/pdfConverters', () => ({
    withPdfDocument: (file, fn) => fn(pdfMocks.doc),
    renderPdfPage: pdfMocks.renderPdfPage,
}));

afterEach(() => {
    workerCalls.createWorker.mockClear();
    fakeWorker.recognize.mockReset();
    fakeWorker.terminate.mockReset();
    pdfMocks.doc = null;
    pdfMocks.renderPdfPage.mockReset();
});

describe.each([
    ['ocrPngToText', ocrPngToText, 'scan.png'],
    ['ocrJpgToText', ocrJpgToText, 'scan.jpg'],
])('%s', (name, convert, input) => {
    it('recognizes text with the default language and terminates the worker', async () => {
        fakeWorker.recognize.mockResolvedValue({ data: { text: 'Hello' } });

        const result = await convert(makeFile('img-bytes', input));

        expect(workerCalls.createWorker).toHaveBeenCalledWith('eng');
        expect(result.filename).toBe('scan.txt');
        expect(result.text).toBe('Hello');
        expect(await result.blob.text()).toBe('Hello');
        expect(fakeWorker.terminate).toHaveBeenCalled();
    });

    it('passes through the selected OCR language', async () => {
        fakeWorker.recognize.mockResolvedValue({ data: { text: 'Bonjour' } });
        await convert(makeFile('img-bytes', input), { language_ocr: 'fra' });
        expect(workerCalls.createWorker).toHaveBeenCalledWith('fra');
    });

    it('terminates the worker even when recognition fails', async () => {
        fakeWorker.recognize.mockRejectedValue(new Error('OCR engine crashed'));
        await expect(convert(makeFile('img-bytes', input))).rejects.toThrow(
            'OCR engine crashed'
        );
        expect(fakeWorker.terminate).toHaveBeenCalled();
    });
});

describe.each([
    ['ocrPngToPdf', ocrPngToPdf, 'scan.png'],
    ['ocrJpgToPdf', ocrJpgToPdf, 'scan.jpg'],
])('%s', (name, convert, input) => {
    it('requests searchable-PDF output and wraps the bytes in a blob', async () => {
        fakeWorker.recognize.mockResolvedValue({
            data: { pdf: [0x25, 0x50, 0x44, 0x46] }, // '%PDF'
        });

        const file = makeFile('img-bytes', input);
        const result = await convert(file);

        expect(fakeWorker.recognize).toHaveBeenCalledWith(
            file,
            { pdfTitle: 'scan' },
            { pdf: true }
        );
        expect(result.filename).toBe('scan.pdf');
        expect(result.blob.type).toBe('application/pdf');
        expect(await result.blob.text()).toBe('%PDF');
        expect(fakeWorker.terminate).toHaveBeenCalled();
    });

    it('passes through the selected OCR language', async () => {
        fakeWorker.recognize.mockResolvedValue({ data: { pdf: [1] } });
        await convert(makeFile('img-bytes', input), { language_ocr: 'deu' });
        expect(workerCalls.createWorker).toHaveBeenCalledWith('deu');
    });

    it('terminates the worker even when recognition fails', async () => {
        fakeWorker.recognize.mockRejectedValue(new Error('boom'));
        await expect(convert(makeFile('img-bytes', input))).rejects.toThrow(
            'boom'
        );
        expect(fakeWorker.terminate).toHaveBeenCalled();
    });
});

describe('ocrPdfToText (/tools/convert/ocr-pdf-to-text)', () => {
    it('renders each page and OCRs it with one shared worker', async () => {
        const pages = { 1: { num: 1 }, 2: { num: 2 } };
        pdfMocks.doc = {
            numPages: 2,
            getPage: vi.fn(async (num) => pages[num]),
        };
        pdfMocks.renderPdfPage.mockImplementation(async (page) => ({
            canvasFor: page.num,
        }));
        fakeWorker.recognize.mockImplementation(async (canvas) => ({
            data: { text: `Text from page ${canvas.canvasFor}` },
        }));

        const result = await ocrPdfToText(makeFile('%PDF-fake', 'scan.pdf'), {
            language_ocr: 'spa',
        });

        expect(workerCalls.createWorker).toHaveBeenCalledTimes(1);
        expect(workerCalls.createWorker).toHaveBeenCalledWith('spa');
        expect(fakeWorker.recognize).toHaveBeenCalledTimes(2);
        expect(result.filename).toBe('scan.txt');
        expect(result.text).toBe('Text from page 1\n\nText from page 2');
        expect(fakeWorker.terminate).toHaveBeenCalled();
    });

    it('terminates the worker even when a page fails to OCR', async () => {
        pdfMocks.doc = {
            numPages: 1,
            getPage: vi.fn(async () => ({ num: 1 })),
        };
        pdfMocks.renderPdfPage.mockResolvedValue({});
        fakeWorker.recognize.mockRejectedValue(new Error('page unreadable'));

        await expect(
            ocrPdfToText(makeFile('%PDF-fake', 'scan.pdf'))
        ).rejects.toThrow('page unreadable');
        expect(fakeWorker.terminate).toHaveBeenCalled();
    });
});
