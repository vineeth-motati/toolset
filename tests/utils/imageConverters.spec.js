/**
 * Image converter tools. happy-dom has no real image decoder/encoder, so
 * createImageBitmap, the canvas 2D context and jsPDF are mocked — the tests
 * verify OUR wiring: target mime, encode quality, white-background
 * compositing for alpha-less JPG, filenames and error paths.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    pngToWebp,
    jpgToWebp,
    webpToPng,
    webpToJpg,
    pngToJpg,
    jpgToPng,
    imageToPdf,
} from '@/utils/converters/imageConverters';
import { makeFile } from '../helpers';

// Captures constructor + addImage calls of the lazily-imported jsPDF.
const jsPdfCalls = vi.hoisted(() => ({ ctor: [], addImage: [] }));
vi.mock('jspdf', () => ({
    jsPDF: class {
        constructor(opts) {
            jsPdfCalls.ctor.push(opts);
        }
        addImage(...args) {
            jsPdfCalls.addImage.push(args);
        }
        output(kind) {
            expect(kind).toBe('blob');
            return new Blob(['%PDF-fake'], { type: 'application/pdf' });
        }
    },
}));

let lastCanvas;
let bitmap;
let encoderFails; // when true, canvas.toBlob yields null (encoding failure)

const fakeCanvas = () => {
    const ctx = {
        fillStyle: null,
        fillRect: vi.fn(),
        drawImage: vi.fn(),
    };
    const canvas = {
        width: 0,
        height: 0,
        ctx,
        getContext: vi.fn(() => ctx),
        toBlob(callback, mime, quality) {
            canvas.toBlobArgs = { mime, quality };
            callback(encoderFails ? null : new Blob(['img'], { type: mime }));
        },
        toDataURL: vi.fn(() => 'data:image/jpeg;base64,FAKE'),
    };
    return canvas;
};

beforeEach(() => {
    encoderFails = false;
    bitmap = { width: 40, height: 30, close: vi.fn() };
    vi.stubGlobal(
        'createImageBitmap',
        vi.fn(async () => bitmap)
    );
    const original = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'canvas') {
            lastCanvas = fakeCanvas();
            return lastCanvas;
        }
        return original(tag);
    });
});

afterEach(() => {
    vi.restoreAllMocks();
    jsPdfCalls.ctor.length = 0;
    jsPdfCalls.addImage.length = 0;
});

describe.each([
    ['pngToWebp', pngToWebp, 'photo.png', 'photo.webp', 'image/webp', 0.9, false],
    ['jpgToWebp', jpgToWebp, 'photo.jpg', 'photo.webp', 'image/webp', 0.9, false],
    ['webpToPng', webpToPng, 'photo.webp', 'photo.png', 'image/png', undefined, false],
    ['jpgToPng', jpgToPng, 'photo.jpg', 'photo.png', 'image/png', undefined, false],
    ['webpToJpg', webpToJpg, 'photo.webp', 'photo.jpg', 'image/jpeg', 0.92, true],
    ['pngToJpg', pngToJpg, 'photo.png', 'photo.jpg', 'image/jpeg', 0.92, true],
])('%s', (name, convert, input, output, mime, quality, needsBackground) => {
    it(`encodes to ${mime} as ${output}`, async () => {
        const result = await convert(makeFile('img-bytes', input));
        expect(result.filename).toBe(output);
        expect(result.blob.type).toBe(mime);
        expect(lastCanvas.toBlobArgs).toEqual({ mime, quality });
        // Canvas sized to the source bitmap, bitmap drawn then released.
        expect(lastCanvas.width).toBe(40);
        expect(lastCanvas.height).toBe(30);
        expect(lastCanvas.ctx.drawImage).toHaveBeenCalledWith(bitmap, 0, 0);
        expect(bitmap.close).toHaveBeenCalled();
    });

    it(
        needsBackground
            ? 'composites onto white — JPG has no alpha channel'
            : 'keeps transparency (no background fill)',
        async () => {
            await convert(makeFile('img-bytes', input));
            if (needsBackground) {
                expect(lastCanvas.ctx.fillStyle).toBe('#ffffff');
                expect(lastCanvas.ctx.fillRect).toHaveBeenCalledWith(
                    0,
                    0,
                    40,
                    30
                );
            } else {
                expect(lastCanvas.ctx.fillRect).not.toHaveBeenCalled();
            }
        }
    );

    it('reports undecodable input by filename', async () => {
        createImageBitmap.mockRejectedValueOnce(new Error('bad data'));
        await expect(convert(makeFile('junk', input))).rejects.toThrow(
            `Could not decode ${input}`
        );
    });

    it('surfaces encoder failure (toBlob → null)', async () => {
        encoderFails = true;
        await expect(convert(makeFile('img-bytes', input))).rejects.toThrow(
            'Image encoding failed'
        );
    });
});

describe('imageToPdf (/tools/convert/jpg-to-pdf, /tools/convert/png-to-pdf)', () => {
    it('creates a single page sized to the image, landscape for wide images', async () => {
        bitmap.width = 400;
        bitmap.height = 300;
        const result = await imageToPdf(makeFile('img', 'scan.jpg'));
        expect(result.filename).toBe('scan.pdf');
        expect(result.blob.type).toBe('application/pdf');
        expect(jsPdfCalls.ctor[0]).toEqual({
            orientation: 'l',
            unit: 'px',
            format: [400, 300],
        });
        expect(jsPdfCalls.addImage[0]).toEqual([
            'data:image/jpeg;base64,FAKE',
            'JPEG',
            0,
            0,
            400,
            300,
        ]);
        // PDF pages are opaque — transparent PNGs must not turn black.
        expect(lastCanvas.ctx.fillStyle).toBe('#ffffff');
    });

    it('uses portrait orientation for tall images', async () => {
        bitmap.width = 300;
        bitmap.height = 500;
        await imageToPdf(makeFile('img', 'tall.png'));
        expect(jsPdfCalls.ctor[0].orientation).toBe('p');
        expect(jsPdfCalls.ctor[0].format).toEqual([300, 500]);
    });

    it('propagates decode failures', async () => {
        createImageBitmap.mockRejectedValueOnce(new Error('nope'));
        await expect(imageToPdf(makeFile('junk', 'bad.png'))).rejects.toThrow(
            /Could not decode bad\.png/
        );
    });
});
