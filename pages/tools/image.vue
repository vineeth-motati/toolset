<template>
    <ToolLayout>
        <div class="mx-auto max-w-4xl">
            <BaseCard>
                <BaseFormField label="Upload Image">
                    <input
                        type="file"
                        @change="handleImageUpload"
                        accept="image/*"
                        class="block w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100 dark:text-gray-300 dark:file:bg-primary-900/40 dark:file:text-primary-300"
                    />
                </BaseFormField>

                <div
                    v-if="originalImage || compressedImage"
                    key="images"
                    class="grid grid-cols-1 gap-4 mt-6 sm:grid-cols-2"
                >
                    <div>
                        <h3
                            class="mb-2 font-medium text-gray-900 dark:text-gray-100"
                        >
                            Original
                        </h3>
                        <img
                            :src="originalImage"
                            class="w-full h-auto rounded-lg"
                        />
                        <p
                            class="mt-2 text-sm text-gray-600 dark:text-gray-400"
                        >
                            Size: {{ originalSize }}
                        </p>
                    </div>
                    <div>
                        <h3
                            class="mb-2 font-medium text-gray-900 dark:text-gray-100"
                        >
                            Compressed
                        </h3>
                        <img
                            :src="compressedImage"
                            class="w-full h-auto rounded-lg"
                        />
                        <p
                            class="mt-2 text-sm text-gray-600 dark:text-gray-400"
                        >
                            Size: {{ compressedSize }}
                        </p>
                    </div>
                </div>
                <BaseEmptyState
                    v-else
                    key="empty"
                    icon="mdi:image"
                    title="No image yet"
                    description="Upload an image above to compress it."
                />

                <div v-if="compressedImage" class="mt-6">
                    <BaseButton icon="mdi:download" @click="downloadImage">
                        Download Compressed Image
                    </BaseButton>
                </div>
            </BaseCard>
        </div>
    </ToolLayout>
</template>

<script setup>
import imageCompression from 'browser-image-compression';

const toast = useToast();

const originalImage = ref('');
const compressedImage = ref('');
const originalSize = ref('');
const compressedSize = ref('');
const compressedFileName = ref('');

const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(
        Math.floor(Math.log(bytes) / Math.log(k)),
        sizes.length - 1
    );
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const MIME_EXTENSIONS = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'image/bmp': 'bmp',
};

const revokeUrls = () => {
    if (originalImage.value) URL.revokeObjectURL(originalImage.value);
    if (compressedImage.value) URL.revokeObjectURL(compressedImage.value);
};

const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
    }

    revokeUrls();
    compressedImage.value = '';
    compressedSize.value = '';

    originalSize.value = formatSize(file.size);
    originalImage.value = URL.createObjectURL(file);

    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
    };

    try {
        let result = await imageCompression(file, options);
        // Re-encoding can inflate already-optimized images; keep the smaller.
        if (result.size >= file.size) {
            result = file;
            toast.info('Image is already optimized — keeping the original');
        }
        const extension = MIME_EXTENSIONS[result.type] || 'jpg';
        const baseName = (file.name || 'image').replace(/\.[^.]+$/, '');
        compressedFileName.value = `${baseName}-compressed.${extension}`;
        compressedSize.value = formatSize(result.size);
        compressedImage.value = URL.createObjectURL(result);
    } catch (error) {
        toast.error(`Failed to compress image: ${error.message || error}`);
    }
};

const downloadImage = () => {
    const link = document.createElement('a');
    link.href = compressedImage.value;
    link.download = compressedFileName.value || 'compressed-image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

onBeforeUnmount(revokeUrls);
</script>
