<template>
    <div class="bg-white rounded-lg shadow">
        <div class="p-6">
            <!-- Only show header when not embedded in sidebar layout -->
            <div
                v-if="showSidebar"
                class="flex items-center justify-between mb-4"
            >
                <div class="flex items-center">
                    <button
                        @click="goBack"
                        class="p-2 mr-3 text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200"
                        title="Back to converters"
                    >
                        <Icon icon="tabler:arrow-left" class="text-xl" />
                    </button>
                    <div>
                        <h1 class="text-2xl font-bold">{{ title }}</h1>
                        <p class="text-gray-600">{{ description }}</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button
                        v-if="showHelpButton"
                        @click="showHelp"
                        class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                        <Icon icon="tabler:help" class="inline-block mr-1" />
                        Help
                    </button>
                    <button
                        v-if="state.result"
                        @click="downloadResult"
                        class="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
                    >
                        <Icon
                            icon="tabler:download"
                            class="inline-block mr-1"
                        />
                        Download
                    </button>
                </div>
            </div>

            <!-- API Key Modal -->
            <div
                v-if="showApiKeyModal"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            >
                <div class="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
                    <h2 class="mb-4 text-xl font-bold">API Key Required</h2>
                    <p class="mb-4 text-gray-600">
                        To use the conversion tools, you need to provide an API
                        key from ConversionTools.io
                    </p>
                    <div class="mb-4">
                        <label
                            class="block mb-1 text-sm font-medium text-gray-700"
                        >
                            API Key
                        </label>
                        <input
                            v-model="tempApiKey"
                            type="text"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Enter your API key"
                        />
                    </div>
                    <div class="flex justify-end space-x-2">
                        <button
                            @click="closeApiKeyModal"
                            class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            @click="saveApiKey"
                            class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                            :disabled="!tempApiKey"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>

            <div>
                <div class="grid grid-cols-1 gap-6">
                    <!-- Source Section -->
                    <div class="p-4 border rounded-lg">
                        <h2 class="mb-2 text-lg font-medium">
                            Source {{ sourceFormat }}
                        </h2>
                        <div class="mb-4">
                            <label
                                class="block mb-1 text-sm font-medium text-gray-700"
                            >
                                {{
                                    sourceFormat === 'URL'
                                        ? 'Enter URL'
                                        : `Upload ${sourceFormat} file`
                                }}
                            </label>

                            <!-- URL Input for website converters -->
                            <div v-if="sourceFormat === 'URL'" class="mb-4">
                                <input
                                    v-model="sourceUrl"
                                    type="url"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="https://example.com"
                                />
                            </div>

                            <!-- File Upload for other converters -->
                            <div
                                v-else
                                @dragover.prevent="dragOver = true"
                                @dragleave.prevent="dragOver = false"
                                @drop.prevent="onFileDrop"
                                @click="$refs.fileInput.click()"
                                class="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md cursor-pointer"
                                :class="{
                                    'border-blue-500 bg-blue-50': dragOver,
                                    'border-gray-300 hover:border-blue-500':
                                        !dragOver,
                                }"
                            >
                                <Icon
                                    :icon="
                                        sourceFile
                                            ? 'tabler:file-check'
                                            : sourceIcon
                                    "
                                    class="mb-2 text-4xl"
                                    :class="
                                        sourceFile
                                            ? 'text-green-500'
                                            : 'text-gray-400'
                                    "
                                />
                                <p
                                    v-if="sourceFile"
                                    class="mb-1 text-green-600"
                                >
                                    {{ sourceFile.name }}
                                </p>
                                <p v-else class="mb-1 text-gray-500">
                                    Drag and drop or click to upload
                                </p>
                                <p
                                    v-if="!sourceFile"
                                    class="text-xs text-gray-400"
                                >
                                    Max file size: {{ fileSizeLimit }}
                                </p>
                                <input
                                    ref="fileInput"
                                    type="file"
                                    class="hidden"
                                    :accept="sourceAccept"
                                    @change="handleFileUpload"
                                />
                            </div>
                        </div>

                        <!-- Additional options depending on converter type -->
                        <div v-if="showOptions && hasParams" class="mb-4">
                            <h3 class="mb-2 text-sm font-medium text-gray-700">
                                Conversion Options
                            </h3>
                            <div class="space-y-2">
                                <!-- Slot for parameters from parent component -->
                                <slot name="options"></slot>
                            </div>
                        </div>
                    </div>

                    <!-- Target Section -->
                    <div class="p-4 border rounded-lg">
                        <h2 class="mb-2 text-lg font-medium">Output</h2>

                        <!-- Conversion Status -->
                        <div
                            v-if="state.isConverting || state.progress"
                            class="mb-4"
                        >
                            <div class="mb-2 flex justify-between items-center">
                                <span class="text-sm font-medium text-gray-700"
                                    >Conversion Status</span
                                >
                                <span
                                    class="text-xs px-2 py-1 rounded"
                                    :class="{
                                        'bg-blue-100 text-blue-700': [
                                            'STARTING',
                                            'UPLOADING',
                                            'PREPARING',
                                            'PENDING',
                                            'RUNNING',
                                            'DOWNLOADING',
                                        ].includes(state.progress),
                                        'bg-green-100 text-green-700':
                                            state.progress === 'COMPLETE',
                                        'bg-red-100 text-red-700':
                                            state.progress === 'ERROR',
                                    }"
                                >
                                    {{ formatProgress(state.progress) }}
                                </span>
                            </div>
                            <div
                                class="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
                            >
                                <div
                                    class="h-full transition-all duration-500"
                                    :class="{
                                        'bg-blue-500':
                                            state.progress !== 'COMPLETE' &&
                                            state.progress !== 'ERROR',
                                        'bg-green-500':
                                            state.progress === 'COMPLETE',
                                        'bg-red-500':
                                            state.progress === 'ERROR',
                                    }"
                                    :style="{ width: getProgressWidth() }"
                                ></div>
                            </div>
                        </div>

                        <!-- Error Message -->
                        <div
                            v-if="state.error"
                            class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
                        >
                            {{ state.error }}
                        </div>

                        <!-- Output Display -->
                        <div class="mb-4">
                            <label
                                class="block mb-1 text-sm font-medium text-gray-700"
                            >
                                {{ targetFormat }} Output
                            </label>
                            <div class="relative">
                                <!-- Preview for Images -->
                                <div
                                    v-if="isImageOutput && previewUrl"
                                    class="h-64 p-4 overflow-auto border border-gray-300 rounded-md bg-gray-50"
                                >
                                    <img
                                        :src="previewUrl"
                                        alt="Converted image"
                                        class="max-w-full h-auto"
                                    />
                                </div>

                                <!-- Preview for Text -->
                                <div
                                    v-else-if="isTextOutput && outputText"
                                    class="h-64 p-4 overflow-auto border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                                >
                                    {{ outputText }}
                                </div>

                                <!-- Generic output placeholder -->
                                <div
                                    v-else
                                    class="h-64 p-4 overflow-auto border border-gray-300 rounded-md bg-gray-50"
                                >
                                    <p
                                        v-if="state.result"
                                        class="text-green-600"
                                    >
                                        Conversion complete! Click the Download
                                        button to save the file.
                                    </p>
                                    <p v-else class="text-gray-500">
                                        Converted output will appear here
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="flex justify-between">
                            <div>
                                <button
                                    v-if="state.result"
                                    @click="downloadResult"
                                    class="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
                                >
                                    <Icon
                                        icon="tabler:download"
                                        class="inline-block mr-1"
                                    />
                                    Download Result
                                </button>
                            </div>
                            <button
                                @click="handleConvert"
                                class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                                :disabled="!canConvert || state.isConverting"
                            >
                                <Icon
                                    :icon="
                                        state.isConverting
                                            ? 'tabler:loader'
                                            : 'tabler:exchange'
                                    "
                                    class="inline-block mr-1"
                                    :class="{
                                        'animate-spin': state.isConverting,
                                    }"
                                />
                                {{
                                    state.isConverting
                                        ? 'Converting...'
                                        : 'Convert'
                                }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount, inject } from 'vue';
import { Icon } from '@iconify/vue';
import { useToast } from '@/composables/useToast';
import { useRouter, useRoute } from 'vue-router';
import { useConverter } from '@/composables/useConverter';

const props = defineProps({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    sourceFormat: {
        type: String,
        required: true,
    },
    targetFormat: {
        type: String,
        required: true,
    },
    sourceIcon: {
        type: String,
        default: 'tabler:file',
    },
    sourceAccept: {
        type: String,
        default: '*/*',
    },
    showOptions: {
        type: Boolean,
        default: true,
    },
    showHelpButton: {
        type: Boolean,
        default: false,
    },
    showSidebar: {
        type: Boolean,
        default: true,
    },
    params: {
        type: Array,
        default: () => [],
    },
});

const router = useRouter();
const route = useRoute();
const toast = useToast();
const {
    hasApiKey,
    saveApiKey: saveApiKeyToStorage,
    apiKey,
    convertFile,
    convertUrl,
    downloadResult,
    getFileSizeLimit,
    state,
} = useConverter();

const fileInput = ref(null);
const sourceFile = ref(null);
const sourceUrl = ref('');
const dragOver = ref(false);
const showApiKeyModal = ref(false);
const tempApiKey = ref('');
const previewUrl = ref('');
const outputText = ref('');
const fileSizeLimit = ref('100MB'); // Default value

// Get parameters from parent component via provide/inject
const paramValues = inject('paramValues', {});

// Computed properties
const hasParams = computed(() => props.params && props.params.length > 0);

const canConvert = computed(() => {
    if (props.sourceFormat === 'URL') {
        return sourceUrl.value && isValidUrl(sourceUrl.value);
    }
    return !!sourceFile.value;
});

const isImageOutput = computed(() => {
    return ['JPG', 'PNG', 'WebP', 'HEIC', 'AVIF', 'GIF', 'TIFF'].includes(
        props.targetFormat
    );
});

const isTextOutput = computed(() => {
    return ['Text', 'JSON', 'XML', 'YAML', 'CSV', 'HTML'].includes(
        props.targetFormat
    );
});

// Check for API key on mount and get file size limit
onMounted(() => {
    if (!hasApiKey()) {
        showApiKeyModal.value = true;
    }

    // Get the file size limit if API key is available
    if (hasApiKey()) {
        fileSizeLimit.value = getFileSizeLimit();
    }
});

// Update file size limit when API key changes
watch(
    () => apiKey.value,
    () => {
        if (hasApiKey()) {
            fileSizeLimit.value = getFileSizeLimit();
        }
    }
);

// Functions
const goBack = () => {
    router.push('/tools/convert/');
};

const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
        sourceFile.value = file;
        toast.success(`${file.name} selected`);
    }
};

const onFileDrop = (event) => {
    dragOver.value = false;
    const file = event.dataTransfer.files[0];
    if (file) {
        sourceFile.value = file;
        toast.success(`${file.name} selected`);
    }
};

const closeApiKeyModal = () => {
    if (hasApiKey()) {
        showApiKeyModal.value = false;
    } else {
        goBack(); // If no API key, return to the converter list
    }
};

const saveApiKey = () => {
    if (tempApiKey.value) {
        saveApiKeyToStorage(tempApiKey.value);
        showApiKeyModal.value = false;
        toast.success('API key saved');
    }
};

const formatProgress = (progress) => {
    if (!progress) return '';

    const progressMap = {
        STARTING: 'Starting',
        UPLOADING: 'Uploading File',
        PREPARING: 'Preparing',
        PENDING: 'In Queue',
        RUNNING: 'Converting',
        DOWNLOADING: 'Downloading',
        COMPLETE: 'Completed',
        ERROR: 'Error',
    };

    return progressMap[progress] || progress;
};

const getProgressWidth = () => {
    const progressSteps = [
        'STARTING',
        'UPLOADING',
        'PREPARING',
        'PENDING',
        'RUNNING',
        'DOWNLOADING',
        'COMPLETE',
    ];

    if (!state.progress || state.progress === 'ERROR') return '100%';

    const currentIndex = progressSteps.indexOf(state.progress);
    if (currentIndex === -1) return '0%';

    return `${Math.round(((currentIndex + 1) / progressSteps.length) * 100)}%`;
};

const handleConvert = async () => {
    if (!hasApiKey()) {
        showApiKeyModal.value = true;
        return;
    }

    try {
        let result;
        const options = { ...paramValues }; // Get parameter values from parent

        if (props.sourceFormat === 'URL') {
            if (!isValidUrl(sourceUrl.value)) {
                toast.error('Please enter a valid URL');
                return;
            }
            options.url = sourceUrl.value;
            result = await convertUrl(route.path, sourceUrl.value, options);
        } else {
            if (!sourceFile.value) {
                toast.error('Please select a file first');
                return;
            }
            result = await convertFile(route.path, sourceFile.value, options);
        }

        // Handle result preview
        if (result && result.blob) {
            if (isImageOutput.value) {
                previewUrl.value = URL.createObjectURL(result.blob);
            } else if (isTextOutput.value) {
                const text = await result.blob.text();
                outputText.value = text;
            }
            toast.success('Conversion successful!');
        }
    } catch (error) {
        console.error('Conversion error:', error);
        toast.error(`Conversion failed: ${error.message || 'Unknown error'}`);
    }
};

const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

const showHelp = () => {
    toast.info('Help documentation will be available soon!');
};

// Clean up resources on unmount
onBeforeUnmount(() => {
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value);
    }
});
</script>
