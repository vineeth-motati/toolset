/**
 * Video converters built on mediabunny (WebCodecs). Conversion is
 * remux-first: tracks whose codecs are already MP4-legal (H.264/H.265+AAC —
 * the overwhelming majority of real-world MOV/MKV) are stream-copied without
 * re-encoding, which is near-instant and works even where the browser can't
 * decode the codec. Everything else falls back to hardware-accelerated
 * WebCodecs transcoding. AVI stays on the API — its codecs (DivX/XviD/MJPEG)
 * pre-date WebCodecs and would need a full wasm decoder.
 */
import { replaceExtension } from './shared';

const toMp4 = async (file) => {
    const {
        Input,
        Output,
        Conversion,
        ALL_FORMATS,
        BlobSource,
        BufferTarget,
        Mp4OutputFormat,
        canEncodeAudio,
    } = await import('mediabunny');

    // Firefox and desktop-Linux browsers can't encode AAC natively; register
    // the wasm polyfill up front — it is only exercised if an audio track
    // actually needs transcoding (stream copies never touch an encoder).
    if (!(await canEncodeAudio('aac'))) {
        const { registerAacEncoder } = await import(
            '@mediabunny/aac-encoder'
        );
        registerAacEncoder();
    }

    const input = new Input({
        formats: ALL_FORMATS,
        source: new BlobSource(file),
    });
    const output = new Output({
        format: new Mp4OutputFormat(),
        target: new BufferTarget(),
    });

    const conversion = await Conversion.init({ input, output });
    if (!conversion.isValid) {
        const reasons = conversion.discardedTracks
            .map((t) => `${t.track.type}: ${t.reason}`)
            .join('; ');
        throw new Error(
            `Could not convert ${file.name} — no usable media tracks` +
                (reasons ? ` (${reasons})` : '') +
                '. Is it a valid video file?'
        );
    }
    await conversion.execute();

    return {
        blob: new Blob([output.target.buffer], { type: 'video/mp4' }),
        filename: replaceExtension(file.name, 'mp4'),
    };
};

export const movToMp4 = (file) => toMp4(file);
export const mkvToMp4 = (file) => toMp4(file);
