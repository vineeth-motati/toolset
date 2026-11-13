<template>
    <ToolLayout>
        <template #actions>
            <BaseButton icon="mdi:share-variant" size="sm" @click="shareJson">
                Share JSON
            </BaseButton>
        </template>

        <div class="mx-auto max-w-7xl">
            <BaseCard padding="none" class="overflow-hidden">
                <div class="flex flex-wrap items-center gap-1.5 px-3 py-2 border-b border-gray-200/80 bg-gray-50/60 dark:border-gray-700/70 dark:bg-gray-900/30">
                    <nav class="inline-flex gap-1 p-1 bg-gray-100 rounded-xl dark:bg-gray-800/80">
                        <button
                            v-for="tab in tabs"
                            :key="tab.id"
                            @click="activeTab = tab.id"
                            :class="[
                                'h-8 px-3.5 rounded-lg text-sm font-medium transition',
                                activeTab === tab.id
                                    ? 'bg-white text-gray-900 shadow-xs ring-1 ring-gray-200/80 dark:bg-gray-700 dark:text-white dark:ring-gray-600/60'
                                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white',
                            ]"
                        >
                            {{ tab.name }}
                        </button>
                    </nav>
                    <template v-if="activeTab === 'text'">
                        <span class="hidden mx-1.5 w-px h-5 bg-gray-200 sm:block dark:bg-gray-700"></span>
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
                    </template>
                </div>

                <!-- Text Tab -->
                <div v-if="activeTab === 'text'" class="p-3 sm:p-4">
                    <textarea
                        v-model="jsonText"
                        rows="20"
                        class="field w-full min-h-[320px] h-[500px] font-mono text-[13px] leading-6"
                        placeholder="Paste your JSON here..."
                    ></textarea>
                </div>

                <!-- Viewer Tab -->
                <div v-else class="grid grid-cols-1 gap-4 p-3 md:grid-cols-2 sm:p-4">
                    <!-- Tree View -->
                    <div class="p-4 surface-muted">
                        <div class="flex gap-2 items-center mb-4">
                            <div class="flex-1 min-w-0">
                                <BaseInput
                                    v-model="searchQuery"
                                    icon="mdi:magnify"
                                    placeholder="Search..."
                                    @keyup.enter="search"
                                />
                            </div>
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
                                class="rounded-lg"
                                :class="
                                    isSelected(item)
                                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300'
                                        : ''
                                "
                            >
                                <div
                                    class="flex items-center px-1.5 py-1 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/40"
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
                                    <span class="font-mono text-[13px] text-gray-900 dark:text-gray-100">{{ item.key }}: </span>
                                    <span
                                        v-if="!item.isObject"
                                        class="ml-2 text-[13px] text-gray-500 dark:text-gray-400"
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
                                        class="px-1.5 py-1 text-[13px]"
                                    >
                                        <span class="font-mono text-gray-900 dark:text-gray-100"
                                            >{{ child.key }}:
                                        </span>
                                        <span class="text-gray-500 dark:text-gray-400">
                                            {{ child.value }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Details View -->
                    <div class="p-4 surface-muted" v-if="selectedItem">
                        <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Details</h3>
                        <table class="w-full text-[13px]">
                            <thead>
                                <tr class="border-b border-gray-200/80 dark:border-gray-700/70">
                                    <th class="py-2 text-left text-gray-900 dark:text-white">Name</th>
                                    <th class="py-2 text-left text-gray-900 dark:text-white">Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="(value, key) in selectedItem.value || {}"
                                    :key="key"
                                >
                                    <td class="py-2 font-mono text-gray-900 dark:text-gray-100">{{ key }}</td>
                                    <td class="py-2 text-gray-500 dark:text-gray-400">
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
                        class="block mt-2 w-full field"
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
                        class="block mt-2 w-full field"
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
            showShareModal(link);
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
            copyText(jsonText.value);
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
