<template>
  <div class="mx-auto max-w-2xl">
    <h1 class="mb-6 text-2xl font-bold">QR Code Generator</h1>
    <div class="p-6 bg-white rounded-lg shadow">
      <div class="mb-4">
        <label class="block mb-2 text-sm font-medium text-gray-700">
          Enter text or URL
        </label>
        <input
          v-model="text"
          type="text"
          class="px-3 py-2 w-full rounded-md border"
          placeholder="https://example.com"
        />
      </div>
      <div class="flex justify-center mb-4">
        <img :src="qrCodeDataUrl" v-if="qrCodeDataUrl" alt="QR Code" />
      </div>
      <div class="flex justify-center">
        <button
          v-if="qrCodeDataUrl"
          @click="downloadQRCode"
          class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Download QR Code
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import QRCode from 'qrcode';
import { ref, watch } from 'vue';

const text = ref('');
const qrCodeDataUrl = ref('');

watch(text, async (newText) => {
  if (newText) {
    qrCodeDataUrl.value = await QRCode.toDataURL(newText);
  } else {
    qrCodeDataUrl.value = '';
  }
});

const downloadQRCode = () => {
  const link = document.createElement('a');
  link.href = qrCodeDataUrl.value;
  link.download = 'qr-code.png';
  link.click();
};
</script>
