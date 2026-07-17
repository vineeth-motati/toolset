<template>
    <ToolLayout>
        <div class="mx-auto max-w-6xl">
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <!-- Controls -->
                <BaseCard class="lg:col-span-1 h-fit">
                    <BaseFormField label="Upload Image">
                        <input
                            type="file"
                            @change="handleImageUpload"
                            accept="image/*"
                            class="block w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100 dark:text-gray-300 dark:file:bg-primary-900/40 dark:file:text-primary-300"
                        />
                    </BaseFormField>

                    <div class="mt-4 space-y-4">
                        <BaseSelect
                            v-model="settings.format"
                            :options="formatOptions"
                            label="Output format"
                        />

                        <BaseFormField
                            v-if="isLossyOutput"
                            :label="`Quality — ${settings.quality}%`"
                        >
                            <input
                                v-model.number="settings.quality"
                                type="range"
                                min="10"
                                max="100"
                                step="1"
                                class="w-full accent-primary-600"
                                aria-label="Output quality"
                            />
                        </BaseFormField>

                        <BaseSelect
                            v-model="settings.resizeMode"
                            :options="resizeOptions"
                            label="Resize"
                        />

                        <div
                            v-if="settings.resizeMode === 'dimensions'"
                            class="flex items-end gap-2"
                        >
                            <BaseInput
                                :model-value="settings.width"
                                @update:model-value="onWidthInput"
                                type="number"
                                label="Width (px)"
                            />
                            <BaseIconButton
                                :icon="
                                    settings.lockAspect
                                        ? 'mdi:link-variant'
                                        : 'mdi:link-variant-off'
                                "
                                :label="
                                    settings.lockAspect
                                        ? 'Unlock aspect ratio'
                                        : 'Lock aspect ratio'
                                "
                                class="mb-0.5"
                                @click="settings.lockAspect = !settings.lockAspect"
                            />
                            <BaseInput
                                :model-value="settings.height"
                                @update:model-value="onHeightInput"
                                type="number"
                                label="Height (px)"
                            />
                        </div>

                        <BaseInput
                            v-if="settings.resizeMode === 'percent'"
                            v-model.number="settings.percent"
                            type="number"
                            label="Scale (%)"
                            hint="100 keeps the original size"
                        />

                        <BaseFormField label="Rotate & flip">
                            <div class="flex gap-2">
                                <BaseIconButton
                                    icon="mdi:rotate-left"
                                    label="Rotate 90° left"
                                    @click="rotate(-90)"
                                />
                                <BaseIconButton
                                    icon="mdi:rotate-right"
                                    label="Rotate 90° right"
                                    @click="rotate(90)"
                                />
                                <BaseIconButton
                                    icon="mdi:flip-horizontal"
                                    label="Flip horizontally"
                                    :class="flipH ? activeToggleClass : ''"
                                    @click="flipH = !flipH"
                                />
                                <BaseIconButton
                                    icon="mdi:flip-vertical"
                                    label="Flip vertically"
                                    :class="flipV ? activeToggleClass : ''"
                                    @click="flipV = !flipV"
                                />
                            </div>
                        </BaseFormField>

                        <BaseButton
                            v-if="sourceFile"
                            variant="secondary"
                            icon="mdi:restore"
                            @click="resetSettings"
                        >
                            Reset
                        </BaseButton>
                    </div>
                </BaseCard>

                <!-- Preview -->
                <BaseCard class="lg:col-span-2">
                    <div
                        v-if="originalUrl"
                        class="grid grid-cols-1 gap-4 sm:grid-cols-2"
                    >
                        <div>
                            <h3
                                class="mb-2 font-medium text-gray-900 dark:text-gray-100"
                            >
                                Original
                            </h3>
                            <img
                                :src="originalUrl"
                                alt="Original image"
                                class="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                            />
                            <p
                                class="mt-2 text-sm text-gray-600 dark:text-gray-400"
                            >
                                {{ sourceInfo }}
                            </p>
                        </div>
                        <div>
                            <h3
                                class="mb-2 font-medium text-gray-900 dark:text-gray-100"
                            >
                                Result
                            </h3>
                            <div
                                v-if="processing"
                                class="flex h-40 items-center justify-center text-sm text-gray-500 dark:text-gray-400"
                            >
                                Processing…
                            </div>
                            <template v-else-if="resultUrl">
                                <img
                                    :src="resultUrl"
                                    alt="Processed image"
                                    class="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                                />
                                <p
                                    class="mt-2 text-sm text-gray-600 dark:text-gray-400"
                                >
                                    {{ resultInfo }}
                                    <span :class="sizeDeltaClass">
                                        ({{ sizeDelta }})
                                    </span>
                                </p>
                            </template>
                        </div>
                    </div>
                    <BaseEmptyState
                        v-else
                        icon="mdi:image"
                        title="No image yet"
                        description="Upload an image to resize, convert, rotate, or compress it."
                    />

                    <div v-if="resultUrl && !processing" class="mt-6">
                        <BaseButton icon="mdi:download" @click="downloadImage">
                            Download {{ downloadName }}
                        </BaseButton>
                    </div>
                </BaseCard>
            </div>
        </div>
    </ToolLayout>
</template>

<script setup>
import { useLocalStorage, watchDebounced } from '@vueuse/core';
import { canvasToBlob } from '@/utils/converters/imageConverters';

const toast = useToast();

const formatOptions = [
    { value: 'original', label: 'Same as source' },
    { value: 'image/png', label: 'PNG' },
    { value: 'image/jpeg', label: 'JPEG' },
    { value: 'image/webp', label: 'WebP' },
];

const resizeOptions = [
    { value: 'original', label: 'Original size' },
    { value: 'dimensions', label: 'Custom dimensions' },
    { value: 'percent', label: 'Percentage' },
];

const MIME_EXTENSIONS = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};

// Canvas can only encode png/jpeg/webp — other sources fall back to PNG.
const ENCODABLE = Object.keys(MIME_EXTENSIONS);

const activeToggleClass =
    'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300';

// Settings persist; rotation/flip are per-image and reset on upload.
const settings = useLocalStorage('image-tools-settings', {
    format: 'original',
    quality: 85,
    resizeMode: 'original',
    width: null,
    height: null,
    percent: 100,
    lockAspect: true,
});

const sourceFile = shallowRef(null);
let sourceBitmap = null; // ImageBitmap — deliberately non-reactive

const rotation = ref(0);
const flipH = ref(false);
const flipV = ref(false);

const originalUrl = ref('');
const resultUrl = ref('');
const resultBlob = shallowRef(null);
const processing = ref(false);
const resultDims = ref(null);

const formatSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.min(
        Math.floor(Math.log(bytes) / Math.log(k)),
        sizes.length - 1
    );
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const targetMime = computed(() => {
    if (settings.value.format !== 'original') return settings.value.format;
    const sourceType = sourceFile.value?.type;
    return ENCODABLE.includes(sourceType) ? sourceType : 'image/png';
});

const isLossyOutput = computed(
    () =>
        targetMime.value === 'image/jpeg' || targetMime.value === 'image/webp'
);

// Source dimensions after rotation (90/270 swap width and height).
const orientedDims = () => {
    if (!sourceBitmap) return null;
    const swap = rotation.value === 90 || rotation.value === 270;
    return {
        width: swap ? sourceBitmap.height : sourceBitmap.width,
        height: swap ? sourceBitmap.width : sourceBitmap.height,
    };
};

const sourceInfo = computed(() => {
    if (!sourceFile.value) return '';
    const dims = sourceBitmap
        ? `${sourceBitmap.width}×${sourceBitmap.height} · `
        : '';
    return `${dims}${formatSize(sourceFile.value.size)}`;
});

const resultInfo = computed(() => {
    if (!resultBlob.value) return '';
    const dims = resultDims.value
        ? `${resultDims.value.width}×${resultDims.value.height} · `
        : '';
    return `${dims}${formatSize(resultBlob.value.size)}`;
});

const sizeDelta = computed(() => {
    if (!resultBlob.value || !sourceFile.value) return '';
    const change =
        ((resultBlob.value.size - sourceFile.value.size) /
            sourceFile.value.size) *
        100;
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
});

const sizeDeltaClass = computed(() =>
    resultBlob.value && resultBlob.value.size <= (sourceFile.value?.size || 0)
        ? 'text-green-600 dark:text-green-400'
        : 'text-amber-600 dark:text-amber-500'
);

const downloadName = computed(() => {
    if (!sourceFile.value || !resultBlob.value) return '';
    const base = (sourceFile.value.name || 'image').replace(/\.[^.]+$/, '');
    const extension = MIME_EXTENSIONS[resultBlob.value.type] || 'png';
    return `${base}-edited.${extension}`;
});

// Aspect-locked width/height inputs derive their counterpart from the
// oriented source ratio.
const onWidthInput = (value) => {
    const width = parseInt(value, 10);
    settings.value.width = Number.isFinite(width) ? width : null;
    const dims = orientedDims();
    if (settings.value.lockAspect && dims && width > 0) {
        settings.value.height = Math.max(
            1,
            Math.round((width * dims.height) / dims.width)
        );
    }
};

const onHeightInput = (value) => {
    const height = parseInt(value, 10);
    settings.value.height = Number.isFinite(height) ? height : null;
    const dims = orientedDims();
    if (settings.value.lockAspect && dims && height > 0) {
        settings.value.width = Math.max(
            1,
            Math.round((height * dims.width) / dims.height)
        );
    }
};

const rotate = (degrees) => {
    rotation.value = (rotation.value + degrees + 360) % 360;
    // Rotation swaps the aspect ratio — refresh locked dimension inputs.
    if (settings.value.resizeMode === 'dimensions' && settings.value.width) {
        onWidthInput(settings.value.width);
    }
};

const resetSettings = () => {
    rotation.value = 0;
    flipH.value = false;
    flipV.value = false;
    settings.value.resizeMode = 'original';
    settings.value.percent = 100;
    const dims = orientedDims();
    settings.value.width = dims?.width ?? null;
    settings.value.height = dims?.height ?? null;
};

const revokeResult = () => {
    if (resultUrl.value) URL.revokeObjectURL(resultUrl.value);
    resultUrl.value = '';
};

const process = async () => {
    if (!sourceBitmap) return;
    processing.value = true;
    try {
        const oriented = orientedDims();
        let width = oriented.width;
        let height = oriented.height;
        if (settings.value.resizeMode === 'dimensions') {
            width = Math.max(1, parseInt(settings.value.width, 10) || width);
            height = Math.max(
                1,
                parseInt(settings.value.height, 10) || height
            );
        } else if (settings.value.resizeMode === 'percent') {
            const percent = Math.max(1, Number(settings.value.percent) || 100);
            width = Math.max(1, Math.round((width * percent) / 100));
            height = Math.max(1, Math.round((height * percent) / 100));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const mime = targetMime.value;
        if (mime === 'image/jpeg') {
            // JPEG has no alpha — composite transparency onto white.
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
        }
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate((rotation.value * Math.PI) / 180);
        ctx.scale(flipH.value ? -1 : 1, flipV.value ? -1 : 1);
        // Draw at pre-rotation dimensions: a 90°-rotated canvas of W×H
        // receives the source scaled to H×W.
        const swap = rotation.value === 90 || rotation.value === 270;
        const drawW = swap ? height : width;
        const drawH = swap ? width : height;
        ctx.drawImage(sourceBitmap, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        const quality = isLossyOutput.value
            ? settings.value.quality / 100
            : undefined;
        const blob = await canvasToBlob(canvas, mime, quality);

        revokeResult();
        resultBlob.value = blob;
        resultDims.value = { width, height };
        resultUrl.value = URL.createObjectURL(blob);
    } catch (error) {
        toast.error(`Failed to process image: ${error.message || error}`);
    } finally {
        processing.value = false;
    }
};

const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
    }

    let bitmap;
    try {
        bitmap = await createImageBitmap(file);
    } catch {
        toast.error(`Could not decode ${file.name} — is it a valid image?`);
        return;
    }

    sourceBitmap?.close();
    sourceBitmap = bitmap;
    sourceFile.value = file;
    if (originalUrl.value) URL.revokeObjectURL(originalUrl.value);
    originalUrl.value = URL.createObjectURL(file);

    // Orientation is per-image; dimension inputs must reflect the new
    // image. Format/quality/resize-mode are preferences and persist.
    rotation.value = 0;
    flipH.value = false;
    flipV.value = false;
    settings.value.width = bitmap.width;
    settings.value.height = bitmap.height;
    await process();
};

const downloadImage = () => {
    const link = document.createElement('a');
    link.href = resultUrl.value;
    link.download = downloadName.value;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

watchDebounced(
    [settings, rotation, flipH, flipV],
    () => process(),
    { debounce: 300, deep: true }
);

onBeforeUnmount(() => {
    if (originalUrl.value) URL.revokeObjectURL(originalUrl.value);
    revokeResult();
    sourceBitmap?.close();
});
</script>
