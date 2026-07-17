/**
 * Image converters using the native Canvas API — the browser decodes and
 * re-encodes, no library needed. jsPDF (already a dependency) handles
 * image → PDF and is imported lazily.
 */
import { replaceExtension } from './shared';

const drawToCanvas = async (file, { background } = {}) => {
    let bitmap;
    try {
        bitmap = await createImageBitmap(file);
    } catch {
        throw new Error(
            `Could not decode ${file.name} — is it a valid image?`
        );
    }
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (background) {
        // JPG has no alpha channel — transparent pixels turn black unless
        // composited onto a background first.
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    return canvas;
};

export const canvasToBlob = (canvas, mime, quality) =>
    new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) =>
                blob
                    ? resolve(blob)
                    : reject(new Error('Image encoding failed')),
            mime,
            quality
        );
    });

const imageConverter =
    (mime, extension, { background, quality } = {}) =>
    async (file) => {
        const canvas = await drawToCanvas(file, { background });
        const blob = await canvasToBlob(canvas, mime, quality);
        return { blob, filename: replaceExtension(file.name, extension) };
    };

export const pngToWebp = imageConverter('image/webp', 'webp', {
    quality: 0.9,
});
export const jpgToWebp = imageConverter('image/webp', 'webp', {
    quality: 0.9,
});
export const webpToPng = imageConverter('image/png', 'png');
export const jpgToPng = imageConverter('image/png', 'png');
export const webpToJpg = imageConverter('image/jpeg', 'jpg', {
    background: '#ffffff',
    quality: 0.92,
});
export const pngToJpg = imageConverter('image/jpeg', 'jpg', {
    background: '#ffffff',
    quality: 0.92,
});

// Image → single-page PDF sized to the image (no letterboxing).
export const imageToPdf = async (file) => {
    const { jsPDF } = await import('jspdf');
    const canvas = await drawToCanvas(file, { background: '#ffffff' });
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    const orientation = canvas.width >= canvas.height ? 'l' : 'p';
    const doc = new jsPDF({
        orientation,
        unit: 'px',
        format: [canvas.width, canvas.height],
    });
    doc.addImage(dataUrl, 'JPEG', 0, 0, canvas.width, canvas.height);

    return {
        blob: doc.output('blob'),
        filename: replaceExtension(file.name, 'pdf'),
    };
};
