/**
 * HEIC decoding via heic2any (bundles its own WASM decoder — no worker/CDN
 * setup needed, unlike the OCR/PDF converters).
 */
import { replaceExtension } from './shared';

const convertHeic = async (file, toType, extension, quality) => {
    const heic2any = (await import('heic2any')).default;
    let output;
    try {
        output = await heic2any({ blob: file, toType, quality });
    } catch {
        throw new Error(
            `Could not decode ${file.name} — is it a valid HEIC image?`
        );
    }
    // Multi-image HEIC containers (burst/live photos) resolve to an array
    // of blobs; only the first frame is converted here.
    const blob = Array.isArray(output) ? output[0] : output;
    return { blob, filename: replaceExtension(file.name, extension) };
};

export const heicToPng = (file) => convertHeic(file, 'image/png', 'png');
export const heicToJpg = (file) =>
    convertHeic(file, 'image/jpeg', 'jpg', 0.92);
