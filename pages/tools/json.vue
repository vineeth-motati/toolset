<template>
    <ToolLayout>
        <template #actions>
            <BaseButton icon="mdi:share-variant" size="sm" @click="shareJson">
                Share JSON
            </BaseButton>
        </template>

        <div class="mx-auto max-w-7xl">
            <BaseCard padding="none">
                <!-- Tabs -->
                <div class="border-b dark:border-gray-700">
                    <nav class="flex">
                        <button
                            v-for="tab in tabs"
                            :key="tab.id"
                            @click="activeTab = tab.id"
                            :class="[
                                'px-4 py-2 text-sm font-medium',
                                activeTab === tab.id
                                    ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                            ]"
                        >
                            {{ tab.name }}
                        </button>
                    </nav>
                </div>

                <!-- Text Tab -->
                <div v-if="activeTab === 'text'" class="p-4">
                    <div class="mb-4 border-b dark:border-gray-700">
                        <div class="flex flex-wrap gap-2 pb-2">
                            <BaseButton
                                v-for="action in actions"
                                :key="action.id"
                                variant="ghost"
                                size="sm"
                                :icon="action.icon"
                                @click="handleAction(action.id)"
                            >
                                {{ action.name }}
                            </BaseButton>
                        </div>
                    </div>

                    <textarea
                        v-model="jsonText"
                        rows="20"
                        class="w-full h-[500px] px-3 py-2 font-mono text-sm text-gray-900 bg-white rounded-md border focus:outline-none focus:ring-1 focus:ring-primary-400 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                        placeholder="Paste your JSON here..."
                    ></textarea>
                </div>

                <!-- Viewer Tab -->
                <div v-else class="grid grid-cols-2 gap-4 p-4">
                    <!-- Tree View -->
                    <div class="p-4 rounded-lg border dark:border-gray-700">
                        <div class="flex gap-2 items-center mb-4">
                            <BaseInput
                                v-model="searchQuery"
                                icon="mdi:magnify"
                                placeholder="Search..."
                                class="flex-1"
                                @keyup.enter="search"
                            />
                            <BaseIconButton
                                icon="mdi:chevron-up"
                                label="Previous result"
                                :disabled="!hasSearchResults"
                                @click="searchPrev"
                            />
                            <BaseIconButton
                                icon="mdi:chevron-down"
                                label="Next result"
                                :disabled="!hasSearchResults"
                                @click="searchNext"
                            />
                        </div>

                        <div class="overflow-auto max-h-[500px]">
                            <div
                                v-for="(item, index) in parsedItems"
                                :key="index"
                                :class="{
                                    'bg-primary-50 dark:bg-primary-900/20': isSelected(item),
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
                                        class="w-5 h-5 text-gray-500 dark:text-gray-400"
                                    />
                                    <span class="font-mono text-gray-900 dark:text-gray-100">{{ item.key }}: </span>
                                    <span
                                        v-if="!item.isObject"
                                        class="ml-2 text-gray-600 dark:text-gray-400"
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
                                        <span class="font-mono text-gray-900 dark:text-gray-100"
                                            >{{ child.key }}:
                                        </span>
                                        <span class="text-gray-600 dark:text-gray-400">
                                            {{ child.value }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Details View -->
                    <div class="p-4 rounded-lg border dark:border-gray-700" v-if="selectedItem">
                        <h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">Details</h3>
                        <table class="w-full">
                            <thead>
                                <tr class="border-b dark:border-gray-700">
                                    <th class="py-2 text-left text-gray-900 dark:text-gray-100">Name</th>
                                    <th class="py-2 text-left text-gray-900 dark:text-gray-100">Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="(value, key) in selectedItem.value || {}"
                                    :key="key"
                                >
                                    <td class="py-2 font-mono text-gray-900 dark:text-gray-100">{{ key }}</td>
                                    <td class="py-2 text-gray-600 dark:text-gray-400">
                                        {{ value }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </BaseCard>
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
    </ToolLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { useLocalStorage } from '@vueuse/core';
import { useToast } from '@/composables/useToast';
import { useShareLink } from '@/composables/useShareLink';
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
        const link = await generateShareLink('/tools/json', {
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
