/**
 * Audio converters. happy-dom has no Web Audio, so AudioContext and lamejs
 * are mocked — the tests verify OUR wiring: decode → int16 conversion →
 * chunked MP3 encoding (channels, sample rate, bitrate), the real PCM16
 * RIFF/WAV writer output, context cleanup, and error paths.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    wavToMp3,
    flacToMp3,
    mp3ToWav,
    mp4ToMp3,
} from '@/utils/converters/audioConverters';
import { makeFile } from '../helpers';

const lameCalls = vi.hoisted(() => ({ ctor: [], encode: [], flush: 0 }));
vi.mock('@breezystack/lamejs', () => ({
    Mp3Encoder: class {
        constructor(...args) {
            lameCalls.ctor.push(args);
        }
        encodeBuffer(...channels) {
            lameCalls.encode.push(channels.map((c) => c?.length));
            return new Uint8Array([1, 2, 3]);
        }
        flush() {
            lameCalls.flush += 1;
            return new Uint8Array([9]);
        }
    },
}));

// 2304 frames = exactly two 1152-sample MPEG blocks.
const makeAudioBuffer = ({
    channels = 2,
    sampleRate = 44100,
    frames = 2304,
} = {}) => {
    const data = Array.from({ length: channels }, (_, c) =>
        new Float32Array(frames).fill(c === 0 ? 0.5 : -0.25)
    );
    return {
        numberOfChannels: channels,
        sampleRate,
        length: frames,
        getChannelData: (c) => data[c],
    };
};

let decodeMock;
let closeMock;

beforeEach(() => {
    decodeMock = vi.fn(async () => makeAudioBuffer());
    closeMock = vi.fn(async () => {});
    vi.stubGlobal(
        'AudioContext',
        class {
            decodeAudioData(buffer) {
                return decodeMock(buffer);
            }
            close() {
                return closeMock();
            }
        }
    );
});

afterEach(() => {
    lameCalls.ctor.length = 0;
    lameCalls.encode.length = 0;
    lameCalls.flush = 0;
});

describe.each([
    ['wavToMp3', wavToMp3, 'song.wav'],
    ['flacToMp3', flacToMp3, 'song.flac'],
])('%s', (name, convert, input) => {
    it('encodes stereo audio to MP3 at the 128 kbps default', async () => {
        const result = await convert(makeFile('audio-bytes', input));

        expect(result.filename).toBe('song.mp3');
        expect(result.blob.type).toBe('audio/mpeg');
        expect(lameCalls.ctor[0]).toEqual([2, 44100, 128]);
        // 2304 frames → two full 1152-sample stereo chunks + one flush.
        expect(lameCalls.encode).toEqual([
            [1152, 1152],
            [1152, 1152],
        ]);
        expect(lameCalls.flush).toBe(1);
        expect(closeMock).toHaveBeenCalled();
    });

    it('reports undecodable input by filename and still closes the context', async () => {
        decodeMock.mockRejectedValue(new Error('bad data'));
        await expect(convert(makeFile('junk', input))).rejects.toThrow(
            `Could not decode ${input}`
        );
        expect(closeMock).toHaveBeenCalled();
    });
});

describe('mp4ToMp3 (/tools/convert/mp4-to-mp3)', () => {
    it('uses 128 kbps when the bitrate param is "default"', async () => {
        await mp4ToMp3(makeFile('video-bytes', 'clip.mp4'), {
            bitrate: 'default',
        });
        expect(lameCalls.ctor[0]).toEqual([2, 44100, 128]);
    });

    it('honors an explicit bitrate selection', async () => {
        const result = await mp4ToMp3(makeFile('video-bytes', 'clip.mp4'), {
            bitrate: '320',
        });
        expect(result.filename).toBe('clip.mp3');
        expect(lameCalls.ctor[0]).toEqual([2, 44100, 320]);
    });

    it('encodes mono sources with a single channel', async () => {
        decodeMock.mockResolvedValue(makeAudioBuffer({ channels: 1 }));
        await mp4ToMp3(makeFile('video-bytes', 'clip.mp4'));
        expect(lameCalls.ctor[0]).toEqual([1, 44100, 128]);
        expect(lameCalls.encode[0]).toEqual([1152]);
    });
});

describe('mp3ToWav (/tools/convert/mp3-to-wav)', () => {
    it('writes a valid PCM16 RIFF header and interleaved samples', async () => {
        decodeMock.mockResolvedValue(
            makeAudioBuffer({ channels: 2, sampleRate: 48000, frames: 4 })
        );

        const result = await mp3ToWav(makeFile('mp3-bytes', 'song.mp3'));

        expect(result.filename).toBe('song.wav');
        expect(result.blob.type).toBe('audio/wav');

        const view = new DataView(await result.blob.arrayBuffer());
        const ascii = (offset, len) =>
            Array.from({ length: len }, (_, i) =>
                String.fromCharCode(view.getUint8(offset + i))
            ).join('');
        expect(ascii(0, 4)).toBe('RIFF');
        expect(ascii(8, 4)).toBe('WAVE');
        expect(view.getUint16(20, true)).toBe(1); // PCM
        expect(view.getUint16(22, true)).toBe(2); // stereo
        expect(view.getUint32(24, true)).toBe(48000);
        expect(view.getUint16(34, true)).toBe(16); // bits per sample
        expect(view.getUint32(40, true)).toBe(4 * 2 * 2); // data size
        // First frame: L = 0.5 → 16383, R = -0.25 → -8192.
        expect(view.getInt16(44, true)).toBe(16383);
        expect(view.getInt16(46, true)).toBe(-8192);
    });

    it('reports undecodable input by filename', async () => {
        decodeMock.mockRejectedValue(new Error('bad data'));
        await expect(
            mp3ToWav(makeFile('junk', 'broken.mp3'))
        ).rejects.toThrow('Could not decode broken.mp3');
    });
});
