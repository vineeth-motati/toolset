/**
 * HTML converters. snapdom / pdfmake / html-to-pdfmake are lazily imported
 * and mocked — the tests verify OUR wiring: the sandboxed script-less
 * iframe, capture options, pdfmake vfs registration, filenames, and the
 * empty-input error paths.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import {
    htmlToPng,
    htmlToJpg,
    htmlToPdf,
} from '@/utils/converters/htmlConverters';
import { makeFile } from '../helpers';

const mocks = vi.hoisted(() => {
    const capture = { toBlob: vi.fn() };
    return {
        capture,
        snapdom: vi.fn().mockResolvedValue(capture),
        getBlob: vi.fn(),
        createPdf: vi.fn(),
        addVirtualFileSystem: vi.fn(),
        htmlToPdfmake: vi.fn().mockReturnValue([{ text: 'parsed' }]),
    };
});

vi.mock('@zumer/snapdom', () => ({ snapdom: mocks.snapdom }));
vi.mock('pdfmake/build/pdfmake', () => ({
    default: {
        addVirtualFileSystem: mocks.addVirtualFileSystem,
        createPdf: mocks.createPdf,
    },
}));
vi.mock('pdfmake/build/vfs_fonts', () => ({
    default: { 'Roboto-Regular.ttf': 'font-bytes' },
}));
vi.mock('html-to-pdfmake', () => ({ default: mocks.htmlToPdfmake }));

afterEach(() => {
    vi.clearAllMocks();
    mocks.snapdom.mockResolvedValue(mocks.capture);
    mocks.htmlToPdfmake.mockReturnValue([{ text: 'parsed' }]);
    document.querySelectorAll('iframe').forEach((el) => el.remove());
});

const SAMPLE_HTML = '<h1>Hello</h1><p>World</p>';

describe.each([
    ['htmlToPng', htmlToPng, 'page.png', 'png', undefined],
    ['htmlToJpg', htmlToJpg, 'page.jpg', 'jpg', 0.92],
])('%s', (name, convert, output, format, quality) => {
    it(`captures the rendered page as ${format}`, async () => {
        const expected = new Blob(['img'], { type: `image/${format}` });
        mocks.capture.toBlob.mockResolvedValue(expected);
        // Snapshot the live iframe at capture time — it must be sandboxed
        // with scripts disabled, and gone again after the conversion.
        let sandboxAttr;
        mocks.snapdom.mockImplementation(async () => {
            sandboxAttr = document
                .querySelector('iframe')
                ?.getAttribute('sandbox');
            return mocks.capture;
        });

        const result = await convert(makeFile(SAMPLE_HTML, 'page.html'));

        expect(result.filename).toBe(output);
        expect(result.blob).toBe(expected);
        expect(mocks.capture.toBlob).toHaveBeenCalledWith(
            expect.objectContaining({ type: format, quality })
        );
        expect(sandboxAttr).toBe('allow-same-origin');
        expect(document.querySelectorAll('iframe')).toHaveLength(0);
    });

    it('rejects an empty file by name', async () => {
        await expect(convert(makeFile('  ', 'empty.html'))).rejects.toThrow(
            'empty.html is empty'
        );
        expect(mocks.snapdom).not.toHaveBeenCalled();
    });

    it('removes the iframe even when the capture fails', async () => {
        mocks.snapdom.mockRejectedValue(new Error('capture exploded'));
        await expect(
            convert(makeFile(SAMPLE_HTML, 'page.html'))
        ).rejects.toThrow('capture exploded');
        expect(document.querySelectorAll('iframe')).toHaveLength(0);
    });
});

describe('htmlToPdf', () => {
    it('produces a selectable-text PDF via html-to-pdfmake', async () => {
        const expected = new Blob(['%PDF'], { type: 'application/pdf' });
        mocks.getBlob.mockResolvedValue(expected);
        mocks.createPdf.mockReturnValue({ getBlob: mocks.getBlob });

        const result = await htmlToPdf(makeFile(SAMPLE_HTML, 'page.html'));

        expect(result.filename).toBe('page.pdf');
        expect(result.blob).toBe(expected);
        expect(mocks.addVirtualFileSystem).toHaveBeenCalledOnce();
        expect(mocks.htmlToPdfmake).toHaveBeenCalledWith(SAMPLE_HTML, {
            window,
        });
        expect(mocks.createPdf).toHaveBeenCalledWith(
            expect.objectContaining({ content: [{ text: 'parsed' }] })
        );
    });

    it('wraps parser failures with the filename', async () => {
        mocks.htmlToPdfmake.mockImplementation(() => {
            throw new Error('unexpected tag');
        });
        await expect(
            htmlToPdf(makeFile(SAMPLE_HTML, 'page.html'))
        ).rejects.toThrow('Could not parse page.html as HTML: unexpected tag');
    });

    it('rejects an empty file by name', async () => {
        await expect(htmlToPdf(makeFile('', 'empty.html'))).rejects.toThrow(
            'empty.html is empty'
        );
    });
});
