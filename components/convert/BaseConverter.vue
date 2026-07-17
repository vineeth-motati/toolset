<template>
    <div class="bg-white rounded-lg shadow dark:bg-gray-800">
        <div class="p-6">
            <!-- Only show header when not embedded in sidebar layout -->
            <div
                v-if="showSidebar"
                class="flex items-center justify-between mb-4"
            >
                <div class="flex items-center">
                    <button
                        @click="goBack"
                        class="p-2 mr-3 text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                        title="Back to converters"
                    >
                        <Icon icon="tabler:arrow-left" class="text-xl" />
                    </button>
                    <div>
                        <h1 class="text-2xl font-bold">{{ title }}</h1>
                        <p class="text-gray-600 dark:text-gray-400">{{ description }}</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <BaseButton
                        v-if="showHelpButton"
                        variant="secondary"
                        icon="tabler:help"
                        @click="showHelp"
                    >
                        Help
                    </BaseButton>
                    <BaseButton
                        v-if="state.result"
                        icon="tabler:download"
                        @click="downloadResult"
                    >
                        Download
                    </BaseButton>
                </div>
            </div>

            <!-- API Key Modal -->
            <Modal
                :is-open="showApiKeyModal"
                title="API Key Required"
                confirm-text="Save"
                :show-confirm="!!tempApiKey"
                @close="closeApiKeyModal"
                @confirm="saveApiKey"
            >
                <p class="mb-4 text-gray-600 dark:text-gray-400">
                    To use the conversion tools, you need to provide an API key
                    from ConversionTools.io
                </p>
                <div class="mb-4">
                    <label class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        API Key
                    </label>
                    <input
                        v-model="tempApiKey"
                        type="text"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                        placeholder="Enter your API key"
                    />
                </div>

                <!-- API Key Information -->
                <div
                    class="p-3 mt-6 border border-blue-200 rounded-md bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
                >
                    <h3 class="mb-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                        How to get an API Key
                    </h3>
                    <ol
                        class="ml-5 space-y-1 text-xs text-gray-700 list-decimal dark:text-gray-300"
                    >
                        <li>
                            Visit
                            <a
                                href="https://conversiontools.io"
                                target="_blank"
                                class="text-blue-600 hover:underline"
                                >ConversionTools.io</a
                            >
                        </li>
                        <li>Create an account or log in</li>
                        <li>Go to your Profile page</li>
                        <li>Find your API key in the API Access section</li>
                        <li>Copy and paste it here</li>
                    </ol>
                    <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Note: The API key is stored locally in your browser and
                        not sent to our servers.
                    </p>
                </div>
            </Modal>

            <div>
                <div class="grid grid-cols-1 gap-6">
                    <!-- Source Section -->
                    <div class="p-4 border rounded-lg dark:border-gray-700">
                        <h2 class="mb-2 text-lg font-medium">
                            Source {{ sourceFormat }}
                        </h2>
                        <div class="mb-4">
                            <label
                                class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
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
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
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
                                    'border-blue-500 bg-blue-50 dark:bg-blue-900/20': dragOver,
                                    'border-gray-300 hover:border-blue-500 dark:border-gray-600':
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
                                    class="mb-1 text-green-600 dark:text-green-400"
                                >
                                    {{ sourceFile.name }}
                                </p>
                                <p v-else class="mb-1 text-gray-500 dark:text-gray-400">
                                    Drag and drop or click to upload
                                </p>
                                <p
                                    v-if="!sourceFile"
                                    class="text-xs text-gray-400 dark:text-gray-500"
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
                            <h3 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                Conversion Options
                            </h3>
                            <div class="space-y-2">
                                <!-- Slot for parameters from parent component -->
                                <slot name="options"></slot>
                            </div>
                        </div>
                    </div>

                    <!-- Target Section -->
                    <div class="p-4 border rounded-lg dark:border-gray-700">
                        <h2 class="mb-2 text-lg font-medium">Output</h2>

                        <!-- Conversion Status -->
                        <div
                            v-if="state.isConverting || state.progress"
                            class="mb-4"
                        >
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >Conversion Status</span
                                >
                                <span
                                    class="px-2 py-1 text-xs rounded"
                                    :class="{
                                        'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300':
                                            [
                                                'STARTING',
                                                'UPLOADING',
                                                'PREPARING',
                                                'PENDING',
                                                'RUNNING',
                                                'SUCCESS',
                                                'DOWNLOADING',
                                            ].includes(state.progress),
                                        'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300':
                                            state.progress === 'COMPLETE',
                                        'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300':
                                            state.progress === 'ERROR',
                                    }"
                                >
                                    {{ formatProgress(state.progress) }}
                                </span>
                            </div>
                            <div
                                class="w-full h-2 overflow-hidden bg-gray-200 rounded-full dark:bg-gray-700"
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
                            class="p-3 mb-4 text-sm text-red-700 border border-red-200 rounded-md bg-red-50 dark:text-red-300 dark:border-red-900 dark:bg-red-900/30"
                        >
                            {{ state.error }}
                        </div>

                        <!-- Output Display -->
                        <div class="mb-4">
                            <label
                                class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                {{ targetFormat }} Output
                            </label>
                            <div class="relative">
                                <!-- Preview for Images -->
                                <div
                                    v-if="isImageOutput && previewUrl"
                                    class="h-64 p-4 overflow-auto border border-gray-300 rounded-md bg-gray-50 dark:border-gray-600 dark:bg-gray-900/50"
                                >
                                    <img
                                        :src="previewUrl"
                                        alt="Converted image"
                                        class="h-auto max-w-full"
                                    />
                                </div>

                                <!-- Preview for Text -->
                                <div
                                    v-else-if="isTextOutput && outputText"
                                    class="h-64 p-4 overflow-auto font-mono text-sm border border-gray-300 rounded-md bg-gray-50 dark:border-gray-600 dark:bg-gray-900/50"
                                >
                                    {{ outputText }}
                                </div>

                                <!-- Generic output placeholder -->
                                <div
                                    v-else
                                    class="h-64 p-4 overflow-auto border border-gray-300 rounded-md bg-gray-50 dark:border-gray-600 dark:bg-gray-900/50"
                                >
                                    <p
                                        v-if="state.result"
                                        class="text-green-600 dark:text-green-400"
                                    >
                                        Conversion complete! Click the Download
                                        button to save the file.
                                    </p>
                                    <p v-else class="text-gray-500 dark:text-gray-400">
                                        Converted output will appear here
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="flex justify-between">
                            <div>
                                <BaseButton
                                    v-if="state.result"
                                    variant="secondary"
                                    icon="tabler:download"
                                    @click="downloadResult"
                                >
                                    Download Result
                                </BaseButton>
                            </div>
                            <button
                                @click="handleConvert"
                                class="px-4 py-2 text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-gray-400"
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
import { useLocalStorage } from '@vueuse/core';
import { useToast } from '@/composables/useToast';
import { useRouter, useRoute } from 'vue-router';
import { useConverter } from '@/composables/useConverter';
import { useShareLink } from '@/composables/useShareLink';
import { showShareModal } from '@/composables/useShareModal';
import { FILE_SIZE_LIMIT } from '@/utils/converterApi';
import {
    getLocalConverter,
    LOCAL_PERSIST_MAX_CHARS,
} from '@/utils/localConverters';
import Modal from '@/components/ui/Modal.vue';

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

// Local converters run entirely in the browser: no API key required, and
// their text-based input/output can be persisted and shared.
const isLocal = computed(() => !!getLocalConverter(route.path));
const { generateShareLink, getSharedData } = useShareLink();

// Keyed by converter path so each local converter restores its own last
// conversion after a reload. Text inputs/outputs are stored verbatim;
// small binary ones (images, xlsx, pdf) as base64 data URLs.
const emptyPersistedState = () => ({
    input: '',
    filename: '',
    filetype: '',
    inputEncoding: 'text',
    output: '',
    outputFilename: '',
    outputType: '',
    outputEncoding: 'text',
});
const persisted = useLocalStorage(
    `converter-state:${route.path}`,
    emptyPersistedState()
);

const TEXT_INPUT_PATTERN = /\.(json|xml|ya?ml|csv|srt|html?|txt)$/i;
const isTextFile = (file) =>
    file.type.startsWith('text/') ||
    TEXT_INPUT_PATTERN.test(file.name) ||
    ['application/json', 'application/xml', 'application/x-subrip'].includes(
        file.type
    );

const blobToDataUrl = (blob) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });

const dataUrlToBlob = async (dataUrl) => (await fetch(dataUrl)).blob();

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
    return [
        'Text',
        'JSON',
        'XML',
        'YAML',
        'CSV',
        'HTML',
        'SRT',
        'Formatted JSON',
        'Validation Result',
        'Fixed XML',
    ].includes(props.targetFormat);
});

// Check for API key on mount and get file size limit
onMounted(async () => {
    if (!isLocal.value && !hasApiKey()) {
        showApiKeyModal.value = true;
    }

    // Get the file size limit if API key is available
    if (hasApiKey()) {
        fileSizeLimit.value = getFileSizeLimit();
    }

    if (isLocal.value) {
        await restoreState();
    }
});

// Rebuild UI state from a saved conversion (shared link or localStorage)
const applyState = async (data) => {
    if (data.input) {
        const contents =
            data.inputEncoding === 'base64'
                ? await dataUrlToBlob(data.input)
                : data.input;
        sourceFile.value = new File(
            [contents],
            data.filename || 'input.txt',
            { type: data.filetype || 'text/plain' }
        );
    }
    if (data.output) {
        if (data.outputEncoding === 'base64') {
            state.result = {
                blob: await dataUrlToBlob(data.output),
                filename: data.outputFilename || 'output',
            };
            // Same guard as the live-conversion path: image converters
            // can persist non-image outputs (multi-page PDF → zip).
            if (isImageOutput.value && data.output.startsWith('data:image/')) {
                previewUrl.value = data.output;
            }
        } else {
            outputText.value = data.output;
            state.result = {
                blob: new Blob([data.output], {
                    type: data.outputType || 'text/plain',
                }),
                filename: data.outputFilename || 'output.txt',
            };
        }
    }
};

const restoreState = async () => {
    const shared = await getSharedData();
    if (shared?.input || shared?.output) {
        await applyState(shared);
        toast.success('Shared conversion loaded');
        return;
    }
    if (persisted.value.input || persisted.value.output) {
        await applyState(persisted.value);
    }
};

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

const selectFile = (file) => {
    if (!file) return;
    if (file.size > FILE_SIZE_LIMIT) {
        toast.error(
            `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max size: ${fileSizeLimit.value}`
        );
        return;
    }
    sourceFile.value = file;
    toast.success(`${file.name} selected`);
    if (isLocal.value) {
        persistInput(file);
    }
};

// Save small inputs so the conversion survives a reload — text verbatim,
// binary (images, xlsx) as a base64 data URL. Oversized files still convert
// fine; they just don't persist or share.
const persistInput = async (file) => {
    if (file.size > LOCAL_PERSIST_MAX_CHARS) {
        persisted.value = emptyPersistedState();
        return;
    }
    const isText = isTextFile(file);
    persisted.value = {
        ...emptyPersistedState(),
        input: isText ? await file.text() : await blobToDataUrl(file),
        filename: file.name,
        filetype: file.type,
        inputEncoding: isText ? 'text' : 'base64',
    };
};

const handleFileUpload = (event) => {
    selectFile(event.target.files[0]);
};

const onFileDrop = (event) => {
    dragOver.value = false;
    selectFile(event.dataTransfer.files[0]);
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
        SUCCESS: 'Converted',
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
        'SUCCESS',
        'DOWNLOADING',
        'COMPLETE',
    ];

    if (!state.progress || state.progress === 'ERROR') return '100%';

    const currentIndex = progressSteps.indexOf(state.progress);
    if (currentIndex === -1) return '0%';

    return `${Math.round(((currentIndex + 1) / progressSteps.length) * 100)}%`;
};

const handleConvert = async () => {
    if (!isLocal.value && !hasApiKey()) {
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

        // Handle result preview. Image converters can produce non-image
        // blobs (multi-page PDF → zip of images), so only preview blobs
        // that are images — an untyped blob is trusted to match the
        // target format (API downloads may lack a Content-Type). Stale
        // previews from a prior conversion are cleared either way.
        if (result && result.blob) {
            if (previewUrl.value.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl.value);
            }
            previewUrl.value = '';
            outputText.value = '';
            const blobIsImage =
                !result.blob.type || result.blob.type.startsWith('image/');
            if (isImageOutput.value && blobIsImage) {
                previewUrl.value = URL.createObjectURL(result.blob);
            } else if (isTextOutput.value) {
                const text = await result.blob.text();
                outputText.value = text;
            }
            if (isLocal.value) {
                if (
                    result.text &&
                    result.text.length <= LOCAL_PERSIST_MAX_CHARS
                ) {
                    persisted.value = {
                        ...persisted.value,
                        output: result.text,
                        outputFilename: result.filename,
                        outputType: result.blob.type,
                        outputEncoding: 'text',
                    };
                } else if (
                    !result.text &&
                    result.blob.size <= LOCAL_PERSIST_MAX_CHARS
                ) {
                    persisted.value = {
                        ...persisted.value,
                        output: await blobToDataUrl(result.blob),
                        outputFilename: result.filename,
                        outputType: result.blob.type,
                        outputEncoding: 'base64',
                    };
                }
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

// Share the current conversion (input + output) via a short link
const share = async () => {
    if (!persisted.value.input && !persisted.value.output) {
        toast.error(
            'Nothing to share yet — select a file under the size limit first'
        );
        return;
    }

    const link = await generateShareLink(route.path, { ...persisted.value });
    if (link) {
        showShareModal(link);
    } else {
        toast.error('Failed to generate share link');
    }
};

defineExpose({ share });

// Clean up resources on unmount
onBeforeUnmount(() => {
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value);
    }
});
</script>
