<template>
    <div class="mx-auto max-w-7xl">
        <div class="flex flex-col gap-6">
            <!-- Header Section -->
            <div class="bg-white rounded-lg shadow p-6">
                <h1 class="text-2xl font-bold mb-2">PII Redactor</h1>
                <p class="text-gray-600">
                    Upload images or PDFs to automatically detect and redact
                    personally identifiable information (PII). Powered by
                    Microsoft Presidio.
                </p>
            </div>

            <!-- File Upload Section -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-semibold mb-4">Upload Files</h2>

                <div
                    @dragover.prevent="dragOver = true"
                    @dragleave.prevent="dragOver = false"
                    @drop.prevent="onFileDrop"
                    @click="$refs.fileInput.click()"
                    :class="[
                        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
                        dragOver
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-400',
                    ]"
                >
                    <div class="flex flex-col items-center">
                        <Icon
                            :icon="
                                uploadedFile
                                    ? 'mdi:file-check'
                                    : 'mdi:cloud-upload'
                            "
                            :class="
                                uploadedFile
                                    ? 'text-green-500 text-5xl mb-3'
                                    : 'text-gray-400 text-5xl mb-3'
                            "
                        />

                        <p
                            v-if="uploadedFile"
                            class="text-green-600 font-medium"
                        >
                            {{ uploadedFile.name }}
                        </p>
                        <p v-else class="text-gray-500">
                            Drag and drop or click to upload
                        </p>
                        <p
                            v-if="!uploadedFile"
                            class="text-gray-400 text-sm mt-2"
                        >
                            Supports: JPG, PNG, PDF files
                        </p>
                    </div>
                    <input
                        ref="fileInput"
                        type="file"
                        class="hidden"
                        @change="handleFileUpload"
                        accept=".jpg,.jpeg,.png,.pdf"
                    />
                </div>
            </div>

            <!-- Redaction Options -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-semibold mb-4">Redaction Options</h2>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h3 class="font-medium text-gray-700 mb-2">
                            PII Types to Detect
                        </h3>
                        <div class="space-y-2">
                            <label
                                v-for="(piiType, index) in piiTypes"
                                :key="index"
                                class="flex items-center space-x-2"
                            >
                                <input
                                    type="checkbox"
                                    v-model="piiType.selected"
                                    :value="piiType.value"
                                    class="rounded text-blue-600 focus:ring-blue-500"
                                />
                                <span>{{ piiType.label }}</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <h3 class="font-medium text-gray-700 mb-2">
                            Redaction Options
                        </h3>
                        <div class="space-y-4">
                            <div>
                                <label
                                    for="redactionMethod"
                                    class="block text-sm font-medium text-gray-700"
                                    >Redaction Method</label
                                >
                                <select
                                    id="redactionMethod"
                                    v-model="redactionMethod"
                                    class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                >
                                    <option value="fill">
                                        Fill (Black Box)
                                    </option>
                                    <option value="mask">
                                        Character Masking (****)
                                    </option>
                                    <option value="replace">
                                        Replace with fake data
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end">
                    <button
                        @click="processFile"
                        :disabled="!uploadedFile || isProcessing"
                        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                    >
                        <Icon
                            :icon="
                                isProcessing
                                    ? 'mdi:loading'
                                    : 'mdi:shield-check'
                            "
                            class="mr-2"
                            :class="{ 'animate-spin': isProcessing }"
                        />
                        {{ isProcessing ? 'Processing...' : 'Redact File' }}
                    </button>
                </div>
            </div>

            <!-- Results Section -->
            <div v-if="resultFile" class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-semibold mb-4">Redacted Result</h2>

                <div class="flex flex-col items-center">
                    <!-- Preview (for images) -->
                    <div
                        v-if="resultType === 'image'"
                        class="mb-4 max-w-full overflow-auto"
                    >
                        <img
                            :src="resultUrl"
                            alt="Redacted image"
                            class="shadow-lg max-h-96"
                        />
                    </div>

                    <!-- Icon for PDFs -->
                    <div
                        v-else-if="resultType === 'pdf'"
                        class="mb-4 text-center"
                    >
                        <Icon
                            icon="mdi:file-pdf-box"
                            class="text-7xl text-red-500"
                        />
                        <p class="mt-2">PDF file processed successfully</p>
                    </div>

                    <!-- Download button -->
                    <button
                        @click="downloadResult"
                        class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                    >
                        <Icon icon="mdi:download" class="mr-2" />
                        Download Redacted File
                    </button>
                </div>
            </div>

            <!-- Info Section -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-semibold mb-2">About PII Redaction</h2>
                <p class="text-gray-600 mb-4">
                    This tool automatically detects and redacts personally
                    identifiable information (PII) from your documents and
                    images using Microsoft's Presidio library.
                </p>

                <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h3 class="flex items-center text-blue-800 font-medium">
                        <Icon icon="mdi:information" class="mr-2" />
                        Privacy Information
                    </h3>
                    <p class="mt-2 text-sm text-blue-700">
                        Files are processed securely. Your uploaded content is
                        never stored permanently and is deleted immediately
                        after processing.
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import { useToast } from '@/composables/useToast';

const toast = useToast();
const fileInput = ref(null);
const uploadedFile = ref(null);
const dragOver = ref(false);
const isProcessing = ref(false);
const resultFile = ref(null);
const resultUrl = ref(null);
const resultType = ref(null);

const piiTypes = ref([
    { label: 'Names', value: 'PERSON', selected: true },
    { label: 'Email addresses', value: 'EMAIL_ADDRESS', selected: true },
    { label: 'Phone numbers', value: 'PHONE_NUMBER', selected: true },
    { label: 'Credit card numbers', value: 'CREDIT_CARD', selected: true },
    { label: 'Addresses', value: 'ADDRESS', selected: true },
    { label: 'US SSN', value: 'US_SSN', selected: true },
    { label: 'IP addresses', value: 'IP_ADDRESS', selected: true },
    { label: 'Dates', value: 'DATE_TIME', selected: false },
    { label: 'URLs', value: 'URL', selected: false },
    { label: 'Location', value: 'LOCATION', selected: true },
]);

const redactionMethod = ref('fill');

// Handle file upload from input
const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
        validateAndSetFile(file);
    }
};

// Handle file drop
const onFileDrop = (event) => {
    dragOver.value = false;
    const file = event.dataTransfer.files[0];
    if (file) {
        validateAndSetFile(file);
    }
};

// Validate file and set it
const validateAndSetFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        toast.error(
            'File type not supported. Please upload a JPG, PNG or PDF file.'
        );
        return;
    }

    uploadedFile.value = file;
    // Clear previous results
    resultFile.value = null;
    resultUrl.value = null;
    resultType.value = null;

    toast.success(`File "${file.name}" selected successfully.`);
};

// Process the file with Presidio
const processFile = async () => {
    if (!uploadedFile.value) {
        toast.error('Please upload a file first.');
        return;
    }

    try {
        isProcessing.value = true;

        // Get selected PII types
        const selectedPiiTypes = piiTypes.value
            .filter((type) => type.selected)
            .map((type) => type.value);

        // Create form data
        const formData = new FormData();
        formData.append('file', uploadedFile.value);
        formData.append('piiTypes', JSON.stringify(selectedPiiTypes));
        formData.append('redactionMethod', redactionMethod.value);

        // Send to our API
        const { $axios } = useNuxtApp();
        const response = await $axios.post('/api/redactor', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            responseType: 'blob',
        });

        // Handle the response
        const blob = new Blob([response.data], {
            type: uploadedFile.value.type,
        });

        resultFile.value = blob;
        resultUrl.value = URL.createObjectURL(blob);
        resultType.value = uploadedFile.value.type.includes('image')
            ? 'image'
            : 'pdf';

        toast.success('File processed successfully!');
    } catch (error) {
        console.error('Error processing file:', error);
        toast.error('Error processing file. Please try again.');
    } finally {
        isProcessing.value = false;
    }
};

// Download the redacted file
const downloadResult = () => {
    if (!resultFile.value) return;

    const a = document.createElement('a');
    a.href = resultUrl.value;

    // Create a name for the downloaded file
    const originalName = uploadedFile.value.name;
    const fileExt = originalName.split('.').pop();
    const fileName = `${originalName.replace(`.${fileExt}`, '')}_redacted.${fileExt}`;

    a.download = fileName;
    a.click();
};

// Clean up object URLs when component is unmounted
onBeforeUnmount(() => {
    if (resultUrl.value) {
        URL.revokeObjectURL(resultUrl.value);
    }
});
</script>
