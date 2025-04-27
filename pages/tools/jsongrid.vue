<template>
    <div class="h-[85vh] flex flex-col">
        <div class="flex items-center justify-between mb-4">
            <div>
                <h1 class="text-2xl font-bold">JSONGrid</h1>
                <p class="text-gray-600">
                    Visualize and edit JSON data in grid format
                </p>
            </div>
            <div class="flex gap-2">
                <button
                    @click="shareJson"
                    class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                    <Icon icon="tabler:share" class="inline-block mr-1" /> Share
                </button>
            </div>
        </div>

        <!-- Main Layout -->
        <div class="flex flex-col flex-1 gap-4 overflow-hidden lg:flex-row">
            <!-- Left side - JSON Editor -->
            <div
                class="flex flex-col h-full overflow-hidden bg-white rounded-lg shadow lg:w-1/2"
            >
                <div
                    class="flex items-center justify-between p-2 border-b bg-gray-50"
                >
                    <div class="flex gap-2">
                        <button
                            v-for="action in editorActions"
                            :key="action.id"
                            @click="handleEditorAction(action.id)"
                            class="px-3 py-1 text-sm rounded hover:bg-gray-100"
                            :title="action.name"
                        >
                            <Icon :icon="action.icon" class="inline-block" />
                        </button>
                    </div>
                    <div class="flex items-center">
                        <div v-if="isValidJson" class="mr-2 text-green-600">
                            <Icon
                                icon="heroicons:check-circle"
                                class="inline-block"
                            />
                            Valid JSON
                        </div>
                        <div
                            v-else-if="jsonText.trim().length > 0"
                            class="mr-2 text-red-600"
                        >
                            <Icon
                                icon="heroicons:exclamation-circle"
                                class="inline-block"
                            />
                            Invalid JSON
                        </div>
                    </div>
                </div>
                <!-- Update the editor container with proper overflow handling -->
                <div class="relative flex-1 overflow-hidden">
                    <div
                        ref="jsonEditorContainer"
                        class="absolute inset-0"
                    ></div>
                </div>
            </div>

            <!-- Right side - Grid View -->
            <div
                :key="renderKey"
                class="flex flex-col h-full overflow-hidden bg-white rounded-lg shadow lg:w-1/2"
            >
                <div
                    class="flex items-center justify-between p-2 border-b bg-gray-50"
                >
                    <div class="flex gap-2">
                        <input
                            v-model="searchQuery"
                            type="text"
                            placeholder="Search deeply..."
                            class="px-2 py-1 text-sm border rounded"
                            @keyup.enter="applySearch"
                        />
                        <button
                            @click="applySearch"
                            class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                            title="Deep search through all values"
                        >
                            <Icon icon="tabler:search" class="inline-block" />
                        </button>
                    </div>
                    <div class="flex gap-2">
                        <button
                            @click="expandAll"
                            class="px-3 py-1 text-sm rounded hover:bg-gray-100"
                            title="Expand All"
                        >
                            <Icon
                                icon="heroicons:arrows-pointing-out"
                                class="inline-block"
                            />
                        </button>
                        <button
                            @click="collapseAll"
                            class="px-3 py-1 text-sm rounded hover:bg-gray-100"
                            title="Collapse All"
                        >
                            <Icon
                                icon="heroicons:arrows-pointing-in"
                                class="inline-block"
                            />
                        </button>
                    </div>
                </div>

                <!-- Grid View -->
                <div
                    v-if="isValidJson && gridData.length > 0"
                    class="flex-1 overflow-auto"
                >
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="sticky top-0 bg-gray-50">
                            <tr>
                                <th
                                    v-for="header in gridHeaders"
                                    :key="header"
                                    class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                                >
                                    {{ header }}
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr
                                v-for="(row, rowIndex) in filteredGridData"
                                :key="rowIndex"
                            >
                                <td
                                    v-for="header in gridHeaders"
                                    :key="`${rowIndex}-${header}`"
                                    class="px-6 py-4 text-sm whitespace-nowrap"
                                    :class="{
                                        'pb-0':
                                            isExpanded(
                                                `${rowIndex}-${header}`
                                            ) && isNestedObject(row[header]),
                                    }"
                                >
                                    <!-- Nested Object or Array -->
                                    <template
                                        v-if="isNestedObject(row[header])"
                                    >
                                        <div class="flex items-center">
                                            <button
                                                @click="
                                                    toggleExpand(
                                                        `${rowIndex}-${header}`
                                                    )
                                                "
                                                class="p-1 mr-1 text-blue-600 rounded hover:bg-blue-100"
                                            >
                                                <Icon
                                                    :icon="
                                                        isExpanded(
                                                            `${rowIndex}-${header}`
                                                        )
                                                            ? 'tabler:circle-minus'
                                                            : 'tabler:circle-plus'
                                                    "
                                                    class="w-4 h-4"
                                                />
                                            </button>
                                            <span
                                                class="font-mono text-gray-500"
                                            >
                                                {{
                                                    isArray(row[header])
                                                        ? '[]'
                                                        : '{}'
                                                }}
                                            </span>
                                        </div>

                                        <!-- Expanded Nested Content -->
                                        <div
                                            v-if="
                                                isExpanded(
                                                    `${rowIndex}-${header}`
                                                )
                                            "
                                            class="pl-6 mt-2 border-l-2 border-blue-200"
                                        >
                                            <div
                                                v-if="isArray(row[header])"
                                                class="array-grid"
                                            >
                                                <table
                                                    class="w-full text-sm bg-white border-collapse"
                                                >
                                                    <tbody>
                                                        <tr
                                                            v-for="(
                                                                item, itemIndex
                                                            ) in row[header]"
                                                            :key="`${rowIndex}-${header}-${itemIndex}`"
                                                            class="border-t border-gray-100"
                                                        >
                                                            <td
                                                                class="w-8 px-2 py-1.5 text-gray-500 font-mono bg-gray-50 text-center"
                                                            >
                                                                {{
                                                                    itemIndex +
                                                                    1
                                                                }}
                                                            </td>
                                                            <td
                                                                class="px-3 py-1.5"
                                                            >
                                                                <!-- Handle nested objects in arrays -->
                                                                <template
                                                                    v-if="
                                                                        isNestedObject(
                                                                            item
                                                                        )
                                                                    "
                                                                >
                                                                    <JsongridNestedObjectView
                                                                        :value="
                                                                            item
                                                                        "
                                                                        :level="
                                                                            1
                                                                        "
                                                                        :editable="
                                                                            true
                                                                        "
                                                                        :path="`${rowIndex}.${header}[${itemIndex}]`"
                                                                        @update:value="
                                                                            updateNestedValue
                                                                        "
                                                                        @focus="
                                                                            highlightJsonPath
                                                                        "
                                                                    />
                                                                </template>
                                                                <!-- Make array items directly editable -->
                                                                <div
                                                                    v-else
                                                                    class="editable-cell"
                                                                    contenteditable="true"
                                                                    @blur="
                                                                        updateArrayItem(
                                                                            rowIndex,
                                                                            header,
                                                                            itemIndex,
                                                                            $event
                                                                        )
                                                                    "
                                                                    @click="
                                                                        highlightJsonPath(
                                                                            {
                                                                                path: `${rowIndex}.${header}[${itemIndex}]`,
                                                                                value: item,
                                                                            }
                                                                        )
                                                                    "
                                                                >
                                                                    {{ item }}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            <!-- Keep existing object display -->
                                            <div v-else class="mt-2">
                                                <JsongridNestedObjectView
                                                    :value="row[header]"
                                                    :level="1"
                                                    :editable="true"
                                                    :path="`${rowIndex}.${header}`"
                                                    @update:value="
                                                        updateNestedValue
                                                    "
                                                    @focus="highlightJsonPath"
                                                />
                                            </div>
                                        </div>
                                    </template>

                                    <!-- Regular Value -->
                                    <div
                                        v-else
                                        class="editable-cell"
                                        contenteditable
                                        @blur="
                                            updateCellValue(
                                                rowIndex,
                                                header,
                                                $event
                                            )
                                        "
                                        @click="
                                            highlightJsonPath({
                                                path: `${rowIndex}.${header}`,
                                                value: row[header],
                                            })
                                        "
                                    >
                                        {{ row[header] }}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div
                    v-else-if="!isValidJson && jsonText.trim().length > 0"
                    class="flex-1 p-4"
                >
                    <div class="p-4 text-red-800 rounded bg-red-50">
                        <p class="font-bold">Invalid JSON</p>
                        <p>{{ jsonError }}</p>
                    </div>
                </div>

                <div
                    v-else-if="jsonText.length === 0"
                    class="flex items-center justify-center flex-1 p-4"
                >
                    <div
                        class="flex flex-col items-center justify-center text-center text-gray-500"
                    >
                        <Icon icon="tabler:table" class="mb-2 text-4xl" />
                        <p>Enter valid JSON data to view in grid format</p>
                        <p class="mt-2 text-sm">
                            The JSON must be an array of objects with consistent
                            keys
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted, render } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { useToast } from '~/composables/useToast';
import { useShareLink } from '~/composables/useShareLink';
import { useJsonGrid } from '~/composables/useJsonGrid';
import { Icon } from '@iconify/vue';
import JSON5 from 'json5';
import ace from 'ace-builds';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/mode-json';
import { debounce, isObject, isArray, includes, toString } from 'lodash-es';

const toast = useToast();
const { generateShareLink, getSharedData } = useShareLink();
const { validateJson } = useJsonGrid();

// Store JSON text in local storage
const jsonText = useLocalStorage('jsongrid-text', '');
const jsonEditorContainer = ref(null);
const jsonEditor = ref(null);
const jsonError = ref('');
const searchQuery = ref('');
const expandedCells = ref(new Set());
const renderKey = ref(0); // Key to force re-render of the grid

// Editor actions
const editorActions = [
    { id: 'format', name: 'Format JSON', icon: 'mingcute:align-left-fill' },
    { id: 'minify', name: 'Minify JSON', icon: 'garden:align-justify-fill-12' },
    { id: 'clear', name: 'Clear', icon: 'tabler:eraser' },
    { id: 'copy', name: 'Copy', icon: 'tabler:copy' },
    { id: 'paste', name: 'Paste', icon: 'tabler:clipboard' },
    { id: 'sample', name: 'Load Sample Data', icon: 'tabler:database-import' },
];

// Computed properties for JSON validation and grid data
const isValidJson = computed(() => {
    try {
        if (!jsonText.value.trim()) return false;
        JSON.parse(jsonText.value);
        return true;
    } catch (e) {
        jsonError.value = e.message;
        return false;
    }
});

const parsedJson = computed(() => {
    if (!isValidJson.value) return null;
    try {
        return JSON.parse(jsonText.value);
    } catch (e) {
        return null;
    }
});

const gridData = computed(() => {
    if (!parsedJson.value) return [];
    if (Array.isArray(parsedJson.value)) {
        return parsedJson.value.map((item) =>
            typeof item === 'object' ? item : { value: item }
        );
    }
    if (typeof parsedJson.value === 'object') {
        return [parsedJson.value];
    }
    return [];
});

const gridHeaders = computed(() => {
    if (gridData.value.length === 0) return [];
    const headers = new Set();
    gridData.value.forEach((row) => {
        if (typeof row === 'object' && row !== null) {
            Object.keys(row).forEach((key) => headers.add(key));
        }
    });
    return [...headers];
});

// Improved filteredGridData computed property with deep search
const filteredGridData = computed(() => {
    if (!searchQuery.value.trim()) return gridData.value;

    const query = searchQuery.value.toLowerCase();
    return gridData.value.filter((row) => {
        if (!row) return false;
        return deepSearch(row, query);
    });
});

// Add new helper function for deep searching
function deepSearch(obj, query) {
    // Base case: null or undefined
    if (obj === null || obj === undefined) {
        return false;
    }

    // For primitive types (string, number, boolean)
    if (!isObject(obj)) {
        const strValue = toString(obj).toLowerCase();
        return includes(strValue, query);
    }

    // For arrays: check if any element matches
    if (isArray(obj)) {
        return obj.some((item) => deepSearch(item, query));
    }

    // For objects: check keys and values
    for (const key in obj) {
        // Check if the key matches
        if (includes(key.toLowerCase(), query)) {
            return true;
        }

        // Check if the value matches (recursively)
        if (deepSearch(obj[key], query)) {
            return true;
        }
    }

    return false;
}

// Enhanced search function with feedback on matched items
function applySearch() {
    if (!searchQuery.value.trim()) {
        // Reset to show all data
        return;
    }

    const matchCount = filteredGridData.value.length;
    const total = gridData.value.length;

    if (matchCount === 0) {
        toast.info(`No items found matching "${searchQuery.value}"`);
    } else if (matchCount < total) {
        toast.success(
            `Found ${matchCount} of ${total} items matching "${searchQuery.value}"`
        );
    } else {
        toast.success(`All items contain "${searchQuery.value}"`);
    }
}

// Helper methods for handling nested objects
function isNestedObject(value) {
    return typeof value === 'object' && value !== null;
}

function isExpanded(cellId) {
    return expandedCells.value.has(cellId);
}

function toggleExpand(cellId) {
    if (expandedCells.value.has(cellId)) {
        expandedCells.value.delete(cellId);
    } else {
        expandedCells.value.add(cellId);
    }
}

function expandAll() {
    // Find all cells with nested objects and expand them
    gridData.value.forEach((row, rowIndex) => {
        if (!row) return;
        Object.entries(row).forEach(([key, value]) => {
            if (isNestedObject(value)) {
                expandedCells.value.add(`${rowIndex}-${key}`);
            }
        });
    });
    toast.success('All nested objects expanded');
}

function collapseAll() {
    expandedCells.value.clear();
    toast.success('All nested objects collapsed');
}

// Methods for handling JSON editor actions
function handleEditorAction(action) {
    switch (action) {
        case 'format':
            formatJson();
            break;
        case 'minify':
            minifyJson();
            break;
        case 'clear':
            clearJson();
            break;
        case 'copy':
            copyJson();
            break;
        case 'paste':
            pasteJson();
            break;
        case 'sample':
            loadSampleData();
            break;
    }
}

// Set up Ace Editor with improved configuration
const setupJsonEditor = () => {
    if (!jsonEditorContainer.value) return;

    jsonEditor.value = ace.edit(jsonEditorContainer.value, {
        mode: 'ace/mode/json',
        theme: 'ace/theme/monokai',
        value: jsonText.value,
        fontSize: 16,
        showPrintMargin: false,
        wrap: true,
        highlightActiveLine: true,
        minLines: 10,
        maxLines: Infinity,
        scrollPastEnd: 0.5, // Allow scrolling past the end of document
        newLineMode: 'unix',
        navigateWithinSoftTabs: true,
    });

    // Fix editor sizing issues
    jsonEditor.value.renderer.setScrollMargin(10, 10, 0, 0);

    // Manually update editor layout on container resize
    const resizeObserver = new ResizeObserver(() => {
        jsonEditor.value.resize(true);
    });
    resizeObserver.observe(jsonEditorContainer.value);

    const updateJson = debounce((value) => {
        jsonText.value = value;
        processJsonInput();
    }, 300);

    jsonEditor.value.on('change', () => {
        updateJson(jsonEditor.value.getValue());
    });

    // Ensure editor is focused when clicked
    jsonEditorContainer.value.addEventListener('click', () => {
        if (jsonEditor.value) {
            jsonEditor.value.focus();
        }
    });
};

// Watch for external changes to jsonText
watch(jsonText, (newValue) => {
    if (jsonEditor.value && jsonEditor.value.getValue() !== newValue) {
        jsonEditor.value.setValue(newValue, -1); // -1 moves cursor to start
    }
});

function processJsonInput() {
    // This allows the JSON to be validated as the user types
    try {
        if (jsonText.value.trim()) {
            JSON.parse(jsonText.value);
            jsonError.value = '';
        }
    } catch (e) {
        jsonError.value = e.message;
    }
}

function formatJson() {
    try {
        if (!jsonText.value.trim()) return;
        const parsed = JSON.parse(jsonText.value);
        jsonText.value = JSON.stringify(parsed, null, 2);
        toast.success('JSON formatted');
    } catch (e) {
        toast.error('Invalid JSON');
    }
}

function minifyJson() {
    try {
        if (!jsonText.value.trim()) return;
        const parsed = JSON.parse(jsonText.value);
        jsonText.value = JSON.stringify(parsed);
        toast.success('JSON minified');
    } catch (e) {
        toast.error('Invalid JSON');
    }
}

function clearJson() {
    jsonText.value = '';
    toast.success('Content cleared');
}

function copyJson() {
    if (!jsonText.value.trim()) {
        toast.error('No content to copy');
        return;
    }

    navigator.clipboard.writeText(jsonText.value);
    toast.success('Copied to clipboard');
}

function pasteJson() {
    navigator.clipboard
        .readText()
        .then((text) => {
            try {
                // Validate the pasted JSON
                const parsed = JSON5.parse(text);
                jsonText.value = JSON.stringify(parsed, null, 2);
                toast.success('JSON pasted and formatted');
            } catch (e) {
                toast.error('Invalid JSON in clipboard');
            }
        })
        .catch(() => {
            toast.error('Failed to read from clipboard');
        });
}

function loadSampleData() {
    const sampleData = [
        {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            isActive: true,
            tags: ['developer', 'frontend'],
            metadata: {
                lastLogin: '2023-04-10T08:30:00Z',
                settings: {
                    theme: 'dark',
                    notifications: true,
                },
            },
        },
        {
            id: 2,
            name: 'Jane Smith',
            email: 'jane@example.com',
            isActive: false,
            tags: ['designer', 'ui/ux'],
            metadata: {
                lastLogin: '2023-03-28T14:15:00Z',
                settings: {
                    theme: 'light',
                    notifications: false,
                },
            },
        },
        {
            id: 3,
            name: 'Bob Johnson',
            email: 'bob@example.com',
            isActive: true,
            tags: ['developer', 'backend'],
            metadata: {
                lastLogin: '2023-04-12T11:45:00Z',
                settings: {
                    theme: 'system',
                    notifications: true,
                },
            },
        },
    ];

    jsonText.value = JSON.stringify(sampleData, null, 2);
    toast.success('Sample data loaded');
}

// Update the JSON when a cell is edited in the grid
function updateCellValue(rowIndex, header, event) {
    const newValue = event.target.innerText;

    try {
        // Try to parse the value if it looks like a number, boolean, or null
        let parsedValue = newValue;

        if (newValue.toLowerCase() === 'true') parsedValue = true;
        else if (newValue.toLowerCase() === 'false') parsedValue = false;
        else if (newValue.toLowerCase() === 'null') parsedValue = null;
        else if (!isNaN(Number(newValue))) parsedValue = Number(newValue);

        // Update the grid data
        const updatedJson = JSON.parse(jsonText.value);
        if (Array.isArray(updatedJson)) {
            updatedJson[rowIndex][header] = parsedValue;
        } else {
            updatedJson[header] = parsedValue;
        }

        // Update the JSON text
        jsonText.value = JSON.stringify(updatedJson, null, 2);
    } catch (e) {
        toast.error('Error updating JSON');
        // Reset to original value
        event.target.innerText = gridData.value[rowIndex][header];
    }
}

// Add this new function to handle direct array item updates
function updateArrayItem(rowIndex, arrayField, itemIndex, event) {
    const newValue = event.target.innerText;
    try {
        // Parse the value appropriately
        let parsedValue = newValue;

        if (newValue.toLowerCase() === 'true') parsedValue = true;
        else if (newValue.toLowerCase() === 'false') parsedValue = false;
        else if (newValue.toLowerCase() === 'null') parsedValue = null;
        else if (!isNaN(Number(newValue))) parsedValue = Number(newValue);

        // Update the grid data
        const updatedJson = JSON.parse(jsonText.value);

        // Make sure we're dealing with an array
        if (
            Array.isArray(updatedJson) &&
            Array.isArray(updatedJson[rowIndex][arrayField])
        ) {
            // Update the specific array item
            updatedJson[rowIndex][arrayField][itemIndex] = parsedValue;

            // Update the JSON text
            jsonText.value = JSON.stringify(updatedJson, null, 2);

            // Provide feedback
            toast.success(`Updated array item in "${arrayField}"`);
        }
    } catch (e) {
        console.error('Error updating array item:', e);
        toast.error('Failed to update array item');

        // Reset to original value on error
        const originalItem = gridData.value[rowIndex][arrayField][itemIndex];
        event.target.innerText = originalItem;
    }
}

// Add this new function to handle nested value updates
function updateNestedValue(update) {
    try {
        // Parse the path to navigate the JSON structure
        const parts = update.path.split('.');
        const rootIndex = parseInt(parts[0]);

        // Start with the parsed JSON
        const updatedJson = JSON.parse(jsonText.value);

        // Navigate to the correct object
        let current = updatedJson[rootIndex];
        let lastPart = parts[parts.length - 1];
        let pathSoFar = '';

        // Handle array access in the path
        for (let i = 1; i < parts.length - 1; i++) {
            const part = parts[i];

            if (part.includes('[')) {
                // Handle array notation like "items[0]"
                const match = part.match(/(\w+)\[(\d+)\]/);
                if (match) {
                    const arrayName = match[1];
                    const arrayIndex = parseInt(match[2]);
                    current = current[arrayName][arrayIndex];
                    pathSoFar += `.${arrayName}[${arrayIndex}]`;
                }
            } else {
                current = current[part];
                pathSoFar += `.${part}`;
            }
        }

        // Handle the last part which might be an array index
        if (lastPart.includes('[')) {
            const match = lastPart.match(/(\w+)\[(\d+)\]/);
            if (match) {
                const arrayName = match[1];
                const arrayIndex = parseInt(match[2]);
                current[arrayName][arrayIndex] = update.value;
            }
        } else {
            current[lastPart] = update.value;
        }

        // Update the JSON text
        jsonText.value = JSON.stringify(updatedJson, null, 2);
        toast.success('Value updated');
    } catch (e) {
        console.error('Error updating nested value:', e);
        toast.error('Failed to update value');
    }
}

// Share functionality
async function shareJson() {
    if (!jsonText.value.trim()) {
        toast.error('No JSON data to share');
        return;
    }

    try {
        if (!isValidJson.value) {
            toast.error('Cannot share invalid JSON');
            return;
        }

        const link = await generateShareLink('/tools/jsongrid', {
            jsonData: jsonText.value,
        });

        if (link) {
            navigator.clipboard.writeText(link);
            toast.success('Share link copied to clipboard!');
        } else {
            toast.error('Failed to generate share link');
        }
    } catch (error) {
        console.error('Error sharing JSON:', error);
        toast.error('An error occurred while sharing');
    }
}

// Load shared data when component mounts
onMounted(async () => {
    const shared = await getSharedData();
    if (shared?.jsonData) {
        jsonText.value = shared.jsonData;
        toast.success('Shared JSON data loaded');
    }

    setupJsonEditor();
    // Add slight delay to ensure proper initialization
    setTimeout(() => {
        if (jsonEditor.value) {
            jsonEditor.value.resize(true);
            jsonEditor.value.renderer.updateFull();
            renderKey.value++; // Trigger re-render
        }
    }, 100);
});

// Clean up editor and observers on component unmount
onUnmounted(() => {
    if (jsonEditor.value) {
        jsonEditor.value.destroy();
    }
});

// Replace the entire highlightJsonPath function with this improved version
function highlightJsonPath(info) {
    if (!jsonEditor.value) return;

    try {
        const jsonContent = jsonText.value;
        if (!jsonContent.trim()) return;

        // Parse the path to find where in the JSON structure this element is
        const parts = info.path.split('.');
        if (parts[0] === 'root') parts.shift();

        // Convert path to a format that can be used with JSON pointer
        const pathSegments = [];

        for (const part of parts) {
            if (part.includes('[')) {
                // Handle array notation like "items[0]"
                const match = part.match(/(\w+)\[(\d+)\]/);
                if (match) {
                    pathSegments.push(match[1]); // Array name
                    pathSegments.push(match[2]); // Array index
                }
            } else {
                pathSegments.push(part);
            }
        }

        // Use Ace editor's document to get accurate positions
        const session = jsonEditor.value.getSession();
        const jsonDoc = session.getDocument();

        // Find the exact line using AST analysis
        const lineNumber = findLineForJsonPath(
            jsonDoc.getAllLines(),
            pathSegments,
            info.value
        );

        if (lineNumber !== null) {
            highlightEditorLine(lineNumber);
        }
    } catch (e) {
        console.error('Error highlighting JSON path:', e);
    }
}
// This is a new function that uses a more reliable path-based approach
function findLineForJsonPath(lines, pathSegments, targetValue) {
    try {
        // Special case for array items like tags[0] = "frontend"
        const lastSegment = pathSegments[pathSegments.length - 1];
        if (!isNaN(parseInt(lastSegment)) && pathSegments.length >= 2) {
            // This is likely an array index
            const arrayName = pathSegments[pathSegments.length - 2];
            const arrayIndex = parseInt(lastSegment);

            // First find the array field
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                // Look for the array name
                if (line.includes(`"${arrayName}"`) && line.includes('[')) {
                    // Found the array start line, now find the specific item
                    return findArrayItemLine(lines, i, arrayIndex, targetValue);
                }
            }
        }

        // Rest of the existing code for other cases
        if (pathSegments.length <= 2 && !isNaN(parseInt(pathSegments[0]))) {
            const rootIndex = parseInt(pathSegments[0]);

            // Find the opening of the object at the specified index
            let objectCount = -1; // Start at -1 to account for the root array
            let inArray = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                // Start of array
                if (line === '[' || line.startsWith('[')) {
                    inArray = true;
                    continue;
                }

                // Object opening
                if (inArray && line === '{') {
                    objectCount++;

                    if (objectCount === rootIndex) {
                        // Found the starting position of our target object
                        if (pathSegments.length === 1) {
                            // We're looking for the whole object
                            return i;
                        }
                        // Otherwise, we need to find the specific field
                        const fieldName = pathSegments[1];
                        const fieldLine = findFieldInObjectLines(
                            lines,
                            i,
                            fieldName,
                            targetValue
                        );
                        return fieldLine !== null ? fieldLine : i;
                    }
                }
            }
        }

        // More complex path or we couldn't find a simple match
        return findLineByValueSearch(lines, pathSegments, targetValue);
    } catch (error) {
        console.error('Error in findLineForJsonPath:', error);
        return null;
    }
}

// New helper function to find a specific item in an array
function findArrayItemLine(lines, arrayStartLine, targetIndex, targetValue) {
    let currentIndex = -1;
    let bracketDepth = 0;
    let inArray = false;

    // First look for the actual opening bracket
    for (let i = arrayStartLine; i < lines.length; i++) {
        const line = lines[i];

        if (line.includes('[')) {
            inArray = true;
            bracketDepth++;
        }

        if (!inArray) continue;

        // Count brackets to keep track of nesting
        bracketDepth += (line.match(/\[/g) || []).length - 1; // -1 because we already counted the first one
        bracketDepth -= (line.match(/\]/g) || []).length;

        // Count items by looking for commas at the array level
        if (bracketDepth === 1) {
            // Look for values on this line
            const lineValues = line.split(',').map((v) => v.trim());

            for (const val of lineValues) {
                // Skip empty parts and brackets
                if (!val || val === '[' || val === ']') continue;

                currentIndex++;

                // Check if this is our target index
                if (currentIndex === targetIndex) {
                    // This line has our target value - now double check for exact match
                    const valueStr = formatValueForComparison(targetValue);

                    // Direct match on this line
                    if (
                        val.includes(valueStr) ||
                        valueStr.includes(val.replace(/"/g, ''))
                    ) {
                        return i;
                    }

                    // If we can't find exact match but indexes match, use this line
                    return i;
                }
            }
        }

        // If we've exited the array, stop searching
        if (bracketDepth === 0) break;
    }

    // Fallback - lookup by value
    if (typeof targetValue === 'string') {
        const valueStr = `"${targetValue}"`;
        for (let i = arrayStartLine; i < arrayStartLine + 20; i++) {
            if (i >= lines.length) break;
            if (lines[i].includes(valueStr)) {
                return i;
            }
        }
    }

    return arrayStartLine; // Return array start as fallback
}

// Helper function to find a specific field within an object
function findFieldInObjectLines(lines, startLine, fieldName, targetValue) {
    let bracketDepth = 1; // Starting inside an object

    for (let i = startLine + 1; i < lines.length && bracketDepth > 0; i++) {
        const line = lines[i];

        // Track bracket depth
        bracketDepth += (line.match(/{/g) || []).length;
        bracketDepth -= (line.match(/}/g) || []).length;

        // Check if this line contains our field
        if (line.includes(`"${fieldName}"`)) {
            // For primitive values, check if the target value is on this line
            const valueStr = formatValueForComparison(targetValue);
            if (
                line.includes(`:`) &&
                (valueStr === null || line.includes(valueStr))
            ) {
                return i;
            }

            // For objects and arrays
            if (line.includes(`{`) || line.includes(`[`)) {
                return i;
            }

            // For multiline values, return this line
            return i;
        }
    }

    return null;
}

// Improve value comparison to handle string array items better
function formatValueForComparison(value) {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';

    switch (typeof value) {
        case 'string':
            // Handle string specifically to match JSON format
            return `"${value}"`;
        case 'boolean':
        case 'number':
            return String(value);
        case 'object':
            return null; // Complex objects will be handled differently
        default:
            return String(value);
    }
}

// Fallback method: enhanced to better handle array values
function findLineByValueSearch(lines, pathSegments, targetValue) {
    const lastSegment = pathSegments[pathSegments.length - 1];
    const isNumericIndex = !isNaN(parseInt(lastSegment));

    // Special case for array items
    if (isNumericIndex && pathSegments.length >= 2) {
        const arrayName = pathSegments[pathSegments.length - 2];
        const arrayIndex = parseInt(lastSegment);

        // Search for array by name first
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(`"${arrayName}"`) && lines[i].includes('[')) {
                // Found the array, now look for the value
                if (typeof targetValue === 'string') {
                    const valueStr = `"${targetValue}"`;

                    // Look ahead a reasonable number of lines for this value
                    for (let j = i; j < i + 15 && j < lines.length; j++) {
                        if (lines[j].includes(valueStr)) {
                            return j;
                        }
                    }
                }
                return i; // Return the array line if we can't find the exact item
            }
        }
    }

    // Regular field handling (existing code)
    let fieldName = isNumericIndex
        ? pathSegments[pathSegments.length - 2]
        : lastSegment;

    // Format the target value for comparison
    const valueStr = formatValueForComparison(targetValue);
    if (!fieldName || !valueStr) return null;

    // Look for the combination of field name and value
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for exact field + value match
        if (line.includes(`"${fieldName}"`) && line.includes(valueStr)) {
            return i;
        }
    }

    // If we couldn't find an exact match, try to find just the field
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(`"${fieldName}"`)) {
            return i;
        }
    }

    // Last resort: look directly for the value
    if (typeof targetValue === 'string' && targetValue.length > 0) {
        const valueStr = `"${targetValue}"`;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(valueStr)) {
                return i;
            }
        }
    }

    return null;
}

// Enhanced version of highlightEditorLine with better visual feedback
function highlightEditorLine(lineNumber) {
    if (!jsonEditor.value || lineNumber === null) return;

    const session = jsonEditor.value.getSession();

    // Clear any existing highlights
    if (session.highlightLines) {
        session.removeMarker(session.highlightLines);
    }

    // Scroll to the line with some context
    jsonEditor.value.scrollToLine(lineNumber, true, true, () => {});

    // Move cursor to the line
    jsonEditor.value.gotoLine(lineNumber + 1, 0, true);

    // Highlight the line
    const Range = ace.require('ace/range').Range;
    session.highlightLines = session.addMarker(
        new Range(lineNumber, 0, lineNumber, Infinity),
        'ace_active-line',
        'fullLine'
    );

    // Enhance visual feedback with a more noticeable flash
    const editorLines = jsonEditorContainer.value.querySelectorAll('.ace_line');
    const offset = getVisualLineOffset(lineNumber);

    if (editorLines[offset]) {
        // Remove any existing highlights first
        document.querySelectorAll('.flash-highlight').forEach((el) => {
            el.classList.remove('flash-highlight');
        });

        // Apply the new highlight with stronger effect
        editorLines[offset].classList.add('flash-highlight');
        setTimeout(() => {
            if (editorLines[offset]) {
                editorLines[offset].classList.remove('flash-highlight');
            }
        }, 1500);
    }
}

// Helper function to get the visual line offset (Ace editor might render lines differently)
function getVisualLineOffset(documentLine) {
    // Simple offset calculation - may need adjustment depending on editor configuration
    const session = jsonEditor.value.getSession();
    const firstVisibleRow = session.getFirstVisibleRow();
    return documentLine - firstVisibleRow;
}
</script>

<style scoped>
/* Add a specific style for array item cells to make them more distinguishable */
.editable-cell {
    min-height: 1.5rem;
    padding: 0.25rem;
    border-radius: 0.25rem;
    outline: none;
}

.editable-cell:hover {
    background-color: rgba(59, 130, 246, 0.1);
    cursor: text;
}

.editable-cell:focus {
    background-color: rgba(59, 130, 246, 0.2);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4);
}

/* Add a specific indicator for when an array item is being edited */
.editable-cell:focus-within::before {
    content: '';
    position: absolute;
    margin-left: -1.5rem;
    margin-top: -0.25rem;
    font-size: 0.75rem;
}

/* Improve editor styles to fix scrolling and focus issues */
:deep(.ace_editor) {
    height: 100% !important;
    width: 100% !important;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro',
        monospace;
}

:deep(.ace_scroller) {
    overflow: auto !important;
}

/* Add these styles for better nested tables display */
:deep(.nested-view table) {
    margin-bottom: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

:deep(.nested-view th) {
    background-color: #f9fafb;
    font-weight: 500;
}

/* Styling for array grids */
.array-grid {
    border: 1px solid #edf2f7;
    border-radius: 4px;
    overflow: hidden;
    margin-top: 0.5rem;
}

.array-grid tr:nth-child(odd) {
    background-color: rgba(249, 250, 251, 0.5);
}

.array-grid tr:hover {
    background-color: rgba(236, 242, 255, 0.6);
}

/* Add styling for matched search terms */
:deep(.search-highlight) {
    background-color: rgba(255, 255, 0, 0.3);
    border-radius: 2px;
    padding: 0 2px;
}

/* Enhance the flash highlight animation for better visibility */
:deep(.flash-highlight) {
    animation: flash-highlight 1.5s ease-out;
    position: relative;
}

@keyframes flash-highlight {
    0%,
    30% {
        background-color: rgba(66, 153, 225, 0.7);
    }
    100% {
        background-color: transparent;
    }
}

/* Add a subtle left border for highlighted lines */
:deep(.ace_active-line) {
    background-color: rgba(66, 153, 225, 0.15) !important;
    border-left: 3px solid rgba(66, 153, 225, 0.7) !important;
}
</style>
