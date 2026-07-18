/**
 * Video converters. mediabunny is lazily imported and mocked — the tests
 * verify OUR wiring: remux-first Conversion setup, the conditional AAC
 * polyfill registration, output blob/filename, and the invalid-input path.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { movToMp4, mkvToMp4 } from '@/utils/converters/videoConverters';
import { makeFile } from '../helpers';

const mocks = vi.hoisted(() => {
    const conversion = {
        isValid: true,
        discardedTracks: [],
        execute: vi.fn().mockResolvedValue(undefined),
    };
    return {
        conversion,
        conversionInit: vi.fn().mockResolvedValue(conversion),
        canEncodeAudio: vi.fn().mockResolvedValue(true),
        registerAacEncoder: vi.fn(),
        blobSource: vi.fn(),
        mp4OutputFormat: vi.fn(),
    };
});

vi.mock('mediabunny', () => ({
    ALL_FORMATS: ['all-formats-sentinel'],
    Input: class {
        constructor(opts) {
            this.opts = opts;
        }
    },
    Output: class {
        constructor(opts) {
            this.format = opts.format;
            this.target = opts.target;
        }
    },
    BlobSource: class {
        constructor(blob) {
            mocks.blobSource(blob);
            this.blob = blob;
        }
    },
    BufferTarget: class {
        constructor() {
            this.buffer = new Uint8Array([1, 2, 3]).buffer;
        }
    },
    Mp4OutputFormat: class {
        constructor() {
            mocks.mp4OutputFormat();
        }
    },
    Conversion: { init: mocks.conversionInit },
    canEncodeAudio: mocks.canEncodeAudio,
}));

vi.mock('@mediabunny/aac-encoder', () => ({
    registerAacEncoder: mocks.registerAacEncoder,
}));

afterEach(() => {
    vi.clearAllMocks();
    mocks.conversion.isValid = true;
    mocks.conversion.discardedTracks = [];
    mocks.conversionInit.mockResolvedValue(mocks.conversion);
    mocks.canEncodeAudio.mockResolvedValue(true);
});

describe.each([
    ['movToMp4', movToMp4, 'clip.mov'],
    ['mkvToMp4', mkvToMp4, 'clip.mkv'],
])('%s', (name, convert, input) => {
    it('remuxes/transcodes to an .mp4 blob', async () => {
        const result = await convert(makeFile('video-bytes', input));

        expect(result.filename).toBe('clip.mp4');
        expect(result.blob.type).toBe('video/mp4');
        expect(result.blob.size).toBe(3);
        expect(mocks.conversion.execute).toHaveBeenCalledOnce();
        expect(mocks.mp4OutputFormat).toHaveBeenCalledOnce();
        // The uploaded File itself must feed the source — no copies.
        expect(mocks.blobSource.mock.calls[0][0].name).toBe(input);
    });

    it('surfaces discarded-track reasons when nothing is convertible', async () => {
        mocks.conversion.isValid = false;
        mocks.conversion.discardedTracks = [
            { track: { type: 'video' }, reason: 'undecodable_source_codec' },
        ];

        await expect(convert(makeFile('junk', input))).rejects.toThrow(
            /no usable media tracks.*video: undecodable_source_codec/
        );
        expect(mocks.conversion.execute).not.toHaveBeenCalled();
    });
});

describe('AAC encoder polyfill', () => {
    it('is not registered when the browser encodes AAC natively', async () => {
        await movToMp4(makeFile('v', 'a.mov'));
        expect(mocks.registerAacEncoder).not.toHaveBeenCalled();
    });

    it('is registered when native AAC encoding is missing', async () => {
        mocks.canEncodeAudio.mockResolvedValue(false);
        await movToMp4(makeFile('v', 'a.mov'));
        expect(mocks.registerAacEncoder).toHaveBeenCalledOnce();
    });
});
