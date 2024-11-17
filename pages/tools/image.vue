<template>
  <div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">Image Optimizer</h1>
    <div class="bg-white rounded-lg shadow p-6">
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Upload Image
        </label>
        <input
          type="file"
          @change="handleImageUpload"
          accept="image/*"
          class="w-full"
        />
      </div>

      <div
        v-if="originalImage || compressedImage"
        class="grid grid-cols-2 gap-4"
      >
        <div>
          <h3 class="font-medium mb-2">Original</h3>
          <img :src="originalImage" class="max-w-full h-auto" />
          <p class="text-sm text-gray-600 mt-2">Size: {{ originalSize }}</p>
        </div>
        <div>
          <h3 class="font-medium mb-2">Compressed</h3>
          <img :src="compressedImage" class="max-w-full h-auto" />
          <p class="text-sm text-gray-600 mt-2">Size: {{ compressedSize }}</p>
        </div>
      </div>

      <div v-if="compressedImage" class="mt-4">
        <button
          @click="downloadImage"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Download Compressed Image
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import imageCompression from 'browser-image-compression';

const originalImage = ref('');
const compressedImage = ref('');
const originalSize = ref('');
const compressedSize = ref('');

const formatSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  originalSize.value = formatSize(file.size);
  originalImage.value = URL.createObjectURL(file);

  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    compressedSize.value = formatSize(compressedFile.size);
    compressedImage.value = URL.createObjectURL(compressedFile);
  } catch (error) {
    console.error('Error compressing image:', error);
  }
};

const downloadImage = () => {
  const link = document.createElement('a');
  link.href = compressedImage.value;
  link.download = 'compressed-image.jpg';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>
