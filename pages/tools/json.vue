<template>
    <div class="mx-auto max-w-7xl">
        <div class="flex justify-between items-center">
            <h1 class="mb-6 text-2xl font-bold">JSON Viewer</h1>
            <!-- Share JSON Button -->
            <button
                @click="shareJson"
                class="flex gap-2 items-center px-3 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
            >
                Share JSON
            </button>
        </div>

        <div class="bg-white rounded-lg shadow">
            <!-- Tabs -->
            <div class="border-b">
                <nav class="flex">
                    <button
                        v-for="tab in tabs"
                        :key="tab.id"
                        @click="activeTab = tab.id"
                        :class="[
                            'px-4 py-2 text-sm font-medium',
                            activeTab === tab.id
                                ? 'border-b-2 border-blue-500 text-blue-600 '
                                : 'text-gray-500 hover:text-gray-700 ',
                        ]"
                    >
                        {{ tab.name }}
                    </button>
                </nav>
            </div>

            <!-- Text Tab -->
            <div v-if="activeTab === 'text'" class="p-4">
                <div class="mb-4 border-b">
                    <div class="flex gap-2 pb-2">
                        <button
                            v-for="action in actions"
                            :key="action.id"
                            @click="handleAction(action.id)"
                            class="flex gap-1 items-center px-3 py-1 text-sm rounded hover:bg-gray-100"
                        >
                            <Icon
                                :icon="action.icon"
                                class="inline-block mr-1"
                            />
                            {{ action.name }}
                        </button>
                    </div>
                </div>

                <textarea
                    v-model="jsonText"
                    lines="20"
                    class="w-full h-[500px] px-3 py-2 font-mono text-sm border rounded-md"
                    placeholder="Paste your JSON here..."
                ></textarea>
            </div>

            <!-- Viewer Tab -->
            <div v-else class="grid grid-cols-2 gap-4 p-4">
                <!-- Tree View -->
                <div class="p-4 rounded-lg border">
                    <div class="flex gap-2 items-center mb-4">
                        <div class="relative flex-1">
                            <Icon
                                icon="mdi:magnify"
                                class="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2"
                            />
                            <input
                                v-model="searchQuery"
                                type="text"
                                class="py-2 pr-4 pl-10 w-full rounded-md border"
                                placeholder="Search..."
                                @keyup.enter="search"
                            />
                        </div>
                        <button
                            @click="searchPrev"
                            class="p-2 rounded hover:bg-gray-100"
                            :disabled="!hasSearchResults"
                        >
                            <Icon icon="mdi:chevron-up" />
                        </button>
                        <button
                            @click="searchNext"
                            class="p-2 rounded hover:bg-gray-100"
                            :disabled="!hasSearchResults"
                        >
                            <Icon icon="mdi:chevron-down" />
                        </button>
                    </div>

                    <div class="overflow-auto max-h-[500px]">
                        <div
                            v-for="(item, index) in parsedItems"
                            :key="index"
                            :class="{
                                'bg-blue-50 ': isSelected(item),
                            }"
                        >
                            <div
                                class="flex items-center py-1 cursor-pointer"
                                @click="toggleItem(item)"
                            >
                                <Icon
                                    :icon="
                                        item.expanded
                                            ? 'mdi:chevron-down'
                                            : 'mdi:chevron-right'
                                    "
                                    class="w-5 h-5"
                                />
                                <span class="font-mono">{{ item.key }}: </span>
                                <span
                                    v-if="!item.isObject"
                                    class="ml-2 text-gray-600"
                                >
                                    {{ item.value }}
                                </span>
                            </div>

                            <div
                                v-if="item.isObject && item.expanded"
                                class="ml-4"
                            >
                                <div
                                    v-for="child in item.children"
                                    :key="child.key"
                                    class="py-1"
                                >
                                    <span class="font-mono"
                                        >{{ child.key }}:
                                    </span>
                                    <span class="text-gray-600">
                                        {{ child.value }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Details View -->
                <div class="p-4 rounded-lg border">
                    <h3 class="mb-4 text-lg font-medium">Details</h3>
                    <table class="w-full">
                        <thead>
                            <tr class="border-b">
                                <th class="py-2 text-left">Name</th>
                                <th class="py-2 text-left">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="(value, key) in selectedItem.value || {}"
                                :key="key"
                            >
                                <td class="py-2 font-mono">{{ key }}</td>
                                <td class="py-2 text-gray-600">
                                    {{ value }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Load JSON Data Modal -->
        <UiModal
            :isOpen="isLoadJsonModalOpen"
            title="Load JSON Data"
            @close="closeLoadJsonModal"
            @confirm="confirmLoadJson"
        >
            <div class="flex flex-col gap-4">
                <!-- Load from File -->
                <div>
                    <h3 class="text-lg font-medium">Load from File</h3>
                    <p class="text-sm text-gray-600">
                        Upload a JSON file to load its content.
                    </p>
                    <input
                        type="file"
                        accept="application/json"
                        @change="handleFileUpload"
                        class="block px-3 py-2 mt-2 w-full rounded-md border"
                    />
                </div>

                <!-- Load from URL -->
                <div>
                    <h3 class="text-lg font-medium">Load from URL</h3>
                    <p class="text-sm text-gray-600">
                        Enter a URL to fetch and load JSON data.
                    </p>
                    <input
                        v-model="loadJsonUrl"
                        type="text"
                        placeholder="Enter JSON URL"
                        class="block px-3 py-2 mt-2 w-full rounded-md border"
                    />
                </div>
            </div>
        </UiModal>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { useLocalStorage } from '@vueuse/core';
import { useToast } from '~/composables/useToast';
import { useShareLink } from '~/composables/useShareLink';
import JSON5 from 'json5';

const toast = useToast();
const { generateShareLink, getSharedData } = useShareLink();

const isLoadJsonModalOpen = ref(false);
const loadJsonUrl = ref('');

const openLoadJsonModal = () => {
    isLoadJsonModalOpen.value = true;
};

const closeLoadJsonModal = () => {
    isLoadJsonModalOpen.value = false;
};

const confirmLoadJson = () => {
    if (loadJsonUrl.value) {
        loadJsonFromUrl(loadJsonUrl.value);
    }
    closeLoadJsonModal();
};

const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const parsed = JSON5.parse(e.target.result);
            jsonText.value = JSON.stringify(parsed, null, 2);
            toast.success('JSON loaded from file!');
        } catch (error) {
            toast.error('Invalid JSON file');
        }
    };
    reader.readAsText(file);
};

const loadJsonFromUrl = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch JSON');

        const data = await response.json();
        jsonText.value = JSON.stringify(data, null, 2);
        toast.success('JSON loaded from URL!');
    } catch (error) {
        toast.error('Failed to load JSON from URL');
    }
};

// Tabs and actions
const tabs = [
    { id: 'text', name: 'Text' },
    { id: 'viewer', name: 'Viewer' },
];
const actions = [
    { id: 'paste', name: 'Paste', icon: 'qlementine-icons:paste-16' },
    { id: 'copy', name: 'Copy', icon: 'solar:copy-outline' },
    { id: 'format', name: 'Format', icon: 'ic:sharp-format-align-left' },
    {
        id: 'minify',
        name: 'Remove white space',
        icon: 'gg:format-justify',
    },
    { id: 'clear', name: 'Clear', icon: 'mdi:delete-empty-outline' },
    { id: 'load', name: 'Load JSON data', icon: 'solar:upload-linear' },
];

// Active tab and JSON data
const activeTab = ref('text');
const jsonText = useLocalStorage('jsonText', ''); // Save JSON data to local storage

// Sharing functionality
const shareJson = async () => {
    const json = jsonText.value.trim();
    if (!json) {
        toast.error('No JSON data to share');
        return;
    }

    try {
        // Generate a shareable link
        const link = await generateShareLink('/tools/json-viewer', {
            json: json,
        });
        if (link) {
            navigator.clipboard.writeText(link);
            toast.success('Share link copied to clipboard!');
        } else {
            toast.error('Failed to generate share link');
        }
    } catch (error) {
        console.error('Error sharing JSON:', error.message);
        toast.error('An error occurred while generating the share link');
    }
};

// Load shared data (if any) on mount
onMounted(async () => {
    const shared = await getSharedData();
    if (shared?.json) {
        jsonText.value = shared.json;
        toast.success('Shared JSON loaded');
    }
});

// JSON parsing, search, and other methods remain the same
const searchQuery = ref('');
const searchResults = ref([]);
const currentSearchIndex = ref(-1);
const selectedItem = ref(null);

// Use JSON5 for parsing and handling JSON-like inputs
const parsedItems = computed(() => {
    try {
        const json = jsonText.value ? JSON5.parse(jsonText.value) : {};
        return parseObject(json);
    } catch (error) {
        console.error('Error parsing JSON-like input:', error.message);
        return [];
    }
});

const hasSearchResults = computed(() => searchResults.value.length > 0);

function parseObject(obj, prefix = '') {
    const items = [];

    for (const [key, value] of Object.entries(obj)) {
        const item = {
            key: prefix ? `${prefix}.${key}` : key,
            value: value,
            isObject: typeof value === 'object' && value !== null,
            expanded: false,
        };

        if (item.isObject) {
            item.children = Object.entries(value).map(([k, v]) => ({
                key: k,
                value: typeof v === 'object' ? JSON.stringify(v) : v,
            }));
        }

        items.push(item);
    }

    return items;
}

function toggleItem(item) {
    item.expanded = !item.expanded;
    selectedItem.value = item;
}

function isSelected(item) {
    return selectedItem.value === item;
}

function handleAction(action) {
    switch (action) {
        case 'paste':
            navigator.clipboard.readText().then((text) => {
                try {
                    // Directly parse with JSON5 to validate and normalize
                    const parsed = JSON5.parse(text);
                    jsonText.value = JSON.stringify(parsed, null, 2);
                } catch (error) {
                    toast.error('Invalid JSON-like input');
                    console.error(
                        'Error pasting JSON-like input:',
                        error.message
                    );
                }
            });
            break;

        case 'copy':
            navigator.clipboard.writeText(jsonText.value);
            toast.success('Copied to clipboard');
            break;

        case 'format':
            try {
                const parsed = JSON5.parse(jsonText.value);
                jsonText.value = JSON.stringify(parsed, null, 2);
                toast.success('JSON formatted');
            } catch (error) {
                toast.error('Invalid JSON-like input');
                console.error(
                    'Error formatting JSON-like input:',
                    error.message
                );
            }
            break;

        case 'minify':
            try {
                const parsed = JSON5.parse(jsonText.value);
                jsonText.value = JSON.stringify(parsed);
                toast.success('White space removed');
            } catch (error) {
                toast.error('Invalid JSON-like input');
                console.error(
                    'Error minifying JSON-like input:',
                    error.message
                );
            }
            break;

        case 'clear':
            jsonText.value = '';
            toast.success('Content cleared');
            break;

        case 'load':
            openLoadJsonModal();
            break;
    }
}

function search() {
    if (!searchQuery.value) return;

    searchResults.value = parsedItems.value.filter(
        (item) =>
            item.key.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            String(item.value)
                .toLowerCase()
                .includes(searchQuery.value.toLowerCase())
    );

    currentSearchIndex.value = 0;
    if (searchResults.value.length > 0) {
        selectedItem.value = searchResults.value[0];
    }
}

function searchNext() {
    if (currentSearchIndex.value < searchResults.value.length - 1) {
        currentSearchIndex.value++;
        selectedItem.value = searchResults.value[currentSearchIndex.value];
    }
}

function searchPrev() {
    if (currentSearchIndex.value > 0) {
        currentSearchIndex.value--;
        selectedItem.value = searchResults.value[currentSearchIndex.value];
    }
}
</script>
