/**
 * HEIC converters. heic2any is lazily imported and mocked — the tests
 * verify OUR wiring: toType/quality passed through, multi-frame HEIC
 * containers reduced to their first frame, filenames, and error paths.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { heicToPng, heicToJpg } from '@/utils/converters/heicConverters';
import { makeFile } from '../helpers';

const heic2anyMock = vi.hoisted(() => vi.fn());
vi.mock('heic2any', () => ({ default: heic2anyMock }));

afterEach(() => {
    heic2anyMock.mockReset();
});

describe.each([
    ['heicToPng', heicToPng, 'photo.heic', 'photo.png', 'image/png', undefined],
    ['heicToJpg', heicToJpg, 'photo.heic', 'photo.jpg', 'image/jpeg', 0.92],
])('%s', (name, convert, input, output, toType, quality) => {
    it(`decodes to ${toType} as ${output}`, async () => {
        heic2anyMock.mockResolvedValue(new Blob(['img'], { type: toType }));
        const result = await convert(makeFile('heic-bytes', input));

        expect(result.filename).toBe(output);
        expect(result.blob.type).toBe(toType);
        expect(heic2anyMock).toHaveBeenCalledWith(
            expect.objectContaining({ toType, quality })
        );
    });

    it('takes the first frame of a multi-image HEIC container', async () => {
        const first = new Blob(['frame-1'], { type: toType });
        const second = new Blob(['frame-2'], { type: toType });
        heic2anyMock.mockResolvedValue([first, second]);

        const result = await convert(makeFile('heic-bytes', input));
        expect(result.blob).toBe(first);
    });

    it('reports undecodable input by filename', async () => {
        heic2anyMock.mockRejectedValue(new Error('bad data'));
        await expect(convert(makeFile('junk', input))).rejects.toThrow(
            `Could not decode ${input}`
        );
    });
});
