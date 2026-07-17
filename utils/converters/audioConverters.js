/**
 * Audio converters — the browser's own decoder (Web Audio API) reads
 * WAV/FLAC/MP3/MP4 input, lamejs encodes MP3, and WAV output is a plain
 * PCM16 RIFF writer. No ffmpeg-style wasm payload needed; real video
 * transcoding (MOV/MKV/AVI → MP4) stays on the API.
 */
import { replaceExtension } from './shared';

const DEFAULT_MP3_KBPS = 128;

const decodeAudio = async (file) => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    try {
        return await ctx.decodeAudioData(await file.arrayBuffer());
    } catch {
        throw new Error(
            `Could not decode ${file.name} — is it a valid audio file?`
        );
    } finally {
        await ctx.close();
    }
};

// Float32 samples in [-1, 1] → clamped Int16, as lamejs and WAV expect.
const toInt16 = (channel) => {
    const out = new Int16Array(channel.length);
    for (let i = 0; i < channel.length; i++) {
        const sample = Math.max(-1, Math.min(1, channel[i]));
        out[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    return out;
};

const MP3_BLOCK = 1152; // samples per MPEG frame — lamejs's chunk unit

const audioBufferToMp3Blob = async (audioBuffer, kbps) => {
    const { Mp3Encoder } = await import('@breezystack/lamejs');
    const channels = Math.min(2, audioBuffer.numberOfChannels);
    const encoder = new Mp3Encoder(channels, audioBuffer.sampleRate, kbps);
    const left = toInt16(audioBuffer.getChannelData(0));
    const right =
        channels === 2 ? toInt16(audioBuffer.getChannelData(1)) : null;

    const chunks = [];
    for (let i = 0; i < left.length; i += MP3_BLOCK) {
        const encoded = right
            ? encoder.encodeBuffer(
                  left.subarray(i, i + MP3_BLOCK),
                  right.subarray(i, i + MP3_BLOCK)
              )
            : encoder.encodeBuffer(left.subarray(i, i + MP3_BLOCK));
        if (encoded.length) chunks.push(encoded);
    }
    const flushed = encoder.flush();
    if (flushed.length) chunks.push(flushed);
    return new Blob(chunks, { type: 'audio/mpeg' });
};

const audioBufferToWavBlob = (audioBuffer) => {
    const channels = Math.min(2, audioBuffer.numberOfChannels);
    const { sampleRate, length: frames } = audioBuffer;
    const dataSize = frames * channels * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeAscii = (offset, text) => {
        for (let i = 0; i < text.length; i++) {
            view.setUint8(offset + i, text.charCodeAt(i));
        }
    };
    writeAscii(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeAscii(8, 'WAVE');
    writeAscii(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * 2, true); // byte rate
    view.setUint16(32, channels * 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeAscii(36, 'data');
    view.setUint32(40, dataSize, true);

    const channelData = [];
    for (let c = 0; c < channels; c++) {
        channelData.push(audioBuffer.getChannelData(c));
    }
    let offset = 44;
    for (let i = 0; i < frames; i++) {
        for (let c = 0; c < channels; c++) {
            const sample = Math.max(-1, Math.min(1, channelData[c][i]));
            view.setInt16(
                offset,
                sample < 0 ? sample * 0x8000 : sample * 0x7fff,
                true
            );
            offset += 2;
        }
    }
    return new Blob([buffer], { type: 'audio/wav' });
};

const toMp3 = async (file, kbps) => {
    const audioBuffer = await decodeAudio(file);
    const blob = await audioBufferToMp3Blob(audioBuffer, kbps);
    return { blob, filename: replaceExtension(file.name, 'mp3') };
};

export const wavToMp3 = (file) => toMp3(file, DEFAULT_MP3_KBPS);
export const flacToMp3 = (file) => toMp3(file, DEFAULT_MP3_KBPS);

// The mp4-to-mp3 page exposes a bitrate select ('default' | '96'...'320').
export const mp4ToMp3 = (file, options = {}) => {
    const kbps =
        options.bitrate && options.bitrate !== 'default'
            ? parseInt(options.bitrate, 10)
            : DEFAULT_MP3_KBPS;
    return toMp3(file, kbps);
};

export const mp3ToWav = async (file) => {
    const audioBuffer = await decodeAudio(file);
    return {
        blob: audioBufferToWavBlob(audioBuffer),
        filename: replaceExtension(file.name, 'wav'),
    };
};
