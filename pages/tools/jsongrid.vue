<template>
    <ToolLayout size="full" class="flex flex-col p-4 h-full">
        <template #actions>
            <BaseButton icon="tabler:share" size="sm" @click="shareJson">
                Share
            </BaseButton>
        </template>

        <!-- Main Layout -->
        <div class="flex flex-col flex-1 gap-4 overflow-hidden lg:flex-row">
            <!-- Left side - JSON Editor -->
            <div
                class="flex flex-col h-full overflow-hidden bg-white rounded-lg shadow lg:w-1/2 dark:bg-gray-800 dark:text-gray-200"
            >
                <div
                    class="flex items-center justify-between p-2 border-b bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700"
                >
                    <div class="flex gap-2">
                        <BaseIconButton
                            v-for="action in editorActions"
                            :key="action.id"
                            :icon="action.icon"
                            :label="action.name"
                            @click="handleEditorAction(action.id)"
                        />
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
                class="flex flex-col h-full overflow-hidden bg-white rounded-lg shadow lg:w-1/2 dark:bg-gray-800 dark:text-gray-200"
            >
                <div
                    class="flex items-center justify-between p-2 border-b bg-gray-50 dark:bg-gray-900/50 dark:border-gray-700"
                >
                    <div class="flex gap-2">
                        <input
                            v-model="searchQuery"
                            type="text"
                            placeholder="Search deeply..."
                            class="px-2 py-1 text-sm bg-white rounded border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                            @keyup.enter="applySearch"
                        />
                        <BaseIconButton
                            icon="tabler:search"
                            label="Deep search through all values"
                            @click="applySearch"
                        />
                    </div>
                    <div class="flex items-center gap-2">
                        <BaseIconButton
                            icon="heroicons:arrows-pointing-out"
                            label="Expand All"
                            @click="expandAll"
                        />
                        <BaseIconButton
                            icon="heroicons:arrows-pointing-in"
                            label="Collapse All"
                            @click="collapseAll"
                        />
                        <!-- Export the current view (visible columns, filtered
                             + sorted rows) — copy or download in four formats. -->
                        <Menu
                            v-if="isValidJson && gridData.length > 0"
                            as="div"
                            class="relative"
                        >
                            <MenuButton
                                class="inline-flex items-center justify-center p-2 text-gray-600 rounded-full transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                title="Export current view"
                                aria-label="Export current view"
                            >
                                <Icon icon="tabler:download" class="w-5 h-5" />
                            </MenuButton>
                            <MenuItems
                                class="absolute right-0 z-20 mt-1 w-56 py-1 text-sm bg-white rounded-md shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-gray-800 dark:ring-white/10"
                            >
                                <div
                                    class="px-3 py-1 text-[11px] font-medium tracking-wider text-gray-400 uppercase"
                                >
                                    Copy view
                                </div>
                                <MenuItem
                                    v-for="f in exportFormats"
                                    :key="`copy-${f.id}`"
                                    v-slot="{ active }"
                                >
                                    <button
                                        type="button"
                                        class="flex items-center w-full gap-2 px-3 py-1.5 text-left"
                                        :class="
                                            active
                                                ? 'bg-gray-100 dark:bg-gray-700'
                                                : ''
                                        "
                                        @click="copyExport(f.id)"
                                    >
                                        <Icon
                                            icon="tabler:copy"
                                            class="w-4 h-4 text-gray-400"
                                        />
                                        {{ f.label }}
                                    </button>
                                </MenuItem>
                                <div
                                    class="my-1 border-t border-gray-100 dark:border-gray-700"
                                ></div>
                                <div
                                    class="px-3 py-1 text-[11px] font-medium tracking-wider text-gray-400 uppercase"
                                >
                                    Download
                                </div>
                                <MenuItem
                                    v-for="f in exportFormats"
                                    :key="`dl-${f.id}`"
                                    v-slot="{ active }"
                                >
                                    <button
                                        type="button"
                                        class="flex items-center w-full gap-2 px-3 py-1.5 text-left"
                                        :class="
                                            active
                                                ? 'bg-gray-100 dark:bg-gray-700'
                                                : ''
                                        "
                                        @click="downloadExport(f.id)"
                                    >
                                        <Icon
                                            icon="tabler:file-download"
                                            class="w-4 h-4 text-gray-400"
                                        />
                                        {{ f.label }}
                                    </button>
                                </MenuItem>
                            </MenuItems>
                        </Menu>
                    </div>
                </div>

                <!-- Root-path selector: pivot the grid onto an array buried
                     inside a nested document instead of showing one giant row. -->
                <div
                    v-if="isValidJson && rootCandidates.length"
                    class="flex flex-wrap items-center gap-2 px-2 py-1.5 text-xs border-b bg-white dark:bg-gray-800 dark:border-gray-700"
                >
                    <span class="text-gray-500 dark:text-gray-400"
                        >Table root</span
                    >
                    <Menu as="div" class="relative">
                        <MenuButton
                            class="inline-flex items-center gap-1 px-2 py-1 font-mono rounded border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                            <Icon
                                icon="tabler:binary-tree"
                                class="w-3.5 h-3.5"
                            />
                            <span class="max-w-[16rem] truncate">{{
                                rootLabel
                            }}</span>
                            <Icon
                                icon="tabler:chevron-down"
                                class="w-3.5 h-3.5"
                            />
                        </MenuButton>
                        <MenuItems
                            class="absolute left-0 z-20 mt-1 w-80 max-h-80 overflow-auto py-1 bg-white rounded-md shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-gray-800 dark:ring-white/10"
                        >
                            <MenuItem v-slot="{ active }">
                                <button
                                    type="button"
                                    class="flex items-center justify-between w-full px-3 py-1.5 text-left"
                                    :class="[
                                        active
                                            ? 'bg-gray-100 dark:bg-gray-700'
                                            : '',
                                        rootLabel === '(whole document)'
                                            ? 'text-primary-600 dark:text-primary-400 font-medium'
                                            : '',
                                    ]"
                                    @click="selectRoot([])"
                                >
                                    <span>Whole document</span>
                                </button>
                            </MenuItem>
                            <MenuItem
                                v-for="cand in rootCandidates"
                                :key="cand.label"
                                v-slot="{ active }"
                            >
                                <button
                                    type="button"
                                    class="flex items-center justify-between w-full gap-3 px-3 py-1.5 text-left"
                                    :class="[
                                        active
                                            ? 'bg-gray-100 dark:bg-gray-700'
                                            : '',
                                        rootLabel === cand.label
                                            ? 'text-primary-600 dark:text-primary-400 font-medium'
                                            : '',
                                    ]"
                                    @click="selectRoot(cand.path)"
                                >
                                    <span class="font-mono truncate">{{
                                        cand.label
                                    }}</span>
                                    <span class="text-gray-400 shrink-0">
                                        {{ cand.length }}
                                        {{
                                            cand.length === 1 ? 'item' : 'items'
                                        }}
                                    </span>
                                </button>
                            </MenuItem>
                        </MenuItems>
                    </Menu>
                    <span class="text-gray-400 dark:text-gray-500">
                        · {{ gridData.length }}
                        {{ gridData.length === 1 ? 'row' : 'rows' }} ×
                        {{ gridHeaders.length }} cols
                    </span>
                </div>

                <!-- Grid View -->
                <div
                    v-if="isValidJson && gridData.length > 0"
                    class="flex-1 overflow-auto"
                >
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead
                            class="sticky top-0 bg-gray-50 dark:bg-gray-900/50"
                        >
                            <tr>
                                <th
                                    v-for="col in columns"
                                    :key="col.id"
                                    class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300"
                                    :title="
                                        'Sort by ' +
                                        col.label +
                                        (sortModel.length
                                            ? ' · shift-click to add to sort'
                                            : '')
                                    "
                                    @click="toggleSort(col, $event.shiftKey)"
                                >
                                    <span
                                        class="inline-flex items-center gap-1"
                                    >
                                        {{ col.label }}
                                        <template v-if="sortStateFor(col.id)">
                                            <Icon
                                                :icon="
                                                    sortStateFor(col.id)
                                                        .direction === 'asc'
                                                        ? 'tabler:sort-ascending'
                                                        : 'tabler:sort-descending'
                                                "
                                                class="w-3.5 h-3.5 text-primary-500"
                                            />
                                            <span
                                                v-if="sortModel.length > 1"
                                                class="text-[10px] text-primary-500"
                                                >{{
                                                    sortStateFor(col.id).order
                                                }}</span
                                            >
                                        </template>
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody
                            class="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700"
                        >
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
                                                class="p-1 mr-1 text-primary-600 rounded hover:bg-primary-100 dark:text-primary-400 dark:hover:bg-primary-900/40"
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
                                            class="pl-6 mt-2 border-l-2 border-blue-200 dark:border-blue-900"
                                        >
                                            <div
                                                v-if="isArray(row[header])"
                                                class="array-grid"
                                            >
                                                <table
                                                    class="w-full text-sm bg-white border-collapse dark:bg-gray-800"
                                                >
                                                    <tbody>
                                                        <tr
                                                            v-for="(
                                                                item, itemIndex
                                                            ) in row[header]"
                                                            :key="`${rowIndex}-${header}-${itemIndex}`"
                                                            class="border-t border-gray-100 dark:border-gray-700"
                                                        >
                                                            <td
                                                                class="w-8 px-2 py-1.5 text-gray-500 font-mono bg-gray-50 text-center dark:bg-gray-900/50 dark:text-gray-400"
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
                    <div
                        class="p-4 text-red-800 rounded bg-red-50 dark:bg-red-900/30 dark:text-red-300"
                    >
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
    </ToolLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { useToast } from '@/composables/useToast';
import { useShareLink } from '@/composables/useShareLink';
import {
    useJsonGrid,
    toRows,
    deriveColumns,
    deepMatch,
    getByPath,
    setByPath,
    pathToLabel,
    findRootCandidates,
    pickDefaultRoot,
    sortIndices,
    toCsv,
    toMarkdown,
    toNdjson,
    toJson,
} from '@/composables/useJsonGrid';
import { locatePath, parseCellPath } from '@/utils/jsonLocate';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue';
import { Icon } from '@iconify/vue';
import JSON5 from 'json5';
import ace from 'ace-builds';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/mode-json';
import { debounce, isArray } from 'lodash-es';

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

// Root path: which node inside the document the grid pivots onto. A nested
// envelope like { data: { tracks: [...] } } is a single unusable row at the
// document root, so we auto-detect the most meaningful array (pickDefaultRoot)
// and let the user re-point via the root selector. Empty path = whole document.
const rootPath = ref([]);
// Guards the auto-pick: once the user chooses a root we stop overriding it,
// until the document structure changes enough that the choice is invalid.
const rootPinnedByUser = ref(false);

// Arrays discoverable inside the current document, offered in the selector.
// The document root itself is offered separately as "Whole document", so drop
// the empty-path candidate a top-level array would otherwise contribute.
const rootCandidates = computed(() => {
    if (!parsedJson.value || typeof parsedJson.value !== 'object') return [];
    return findRootCandidates(parsedJson.value).filter(
        (c) => c.path.length > 0
    );
});

const rootData = computed(() => {
    if (!parsedJson.value) return null;
    if (rootPath.value.length === 0) return parsedJson.value;
    return getByPath(parsedJson.value, rootPath.value);
});

const rootLabel = computed(() => pathToLabel(rootPath.value));

function selectRoot(path) {
    rootPath.value = Array.isArray(path) ? path.slice() : [];
    rootPinnedByUser.value = true;
    expandedCells.value.clear();
    searchQuery.value = '';
    sortModel.value = []; // column identities change with the root
}

// Re-pick a default root whenever the parsed document changes shape. If the
// user pinned a root that no longer resolves to a value, fall back to auto.
watch(
    parsedJson,
    (parsed) => {
        if (!parsed) {
            rootPath.value = [];
            rootPinnedByUser.value = false;
            return;
        }
        const stillValid =
            rootPath.value.length === 0 ||
            getByPath(parsed, rootPath.value) !== undefined;
        if (!rootPinnedByUser.value || !stillValid) {
            rootPath.value = pickDefaultRoot(parsed);
            rootPinnedByUser.value = false;
        }
    },
    { immediate: true }
);

// Grid rows and columns come from the shared pure core (composables/
// useJsonGrid) — the same functions the specs exercise — instead of being
// re-derived inline. `columns` is the first-class model (types, paths, view
// state); `gridHeaders` is the label projection the table template renders.
const gridData = computed(() => toRows(rootData.value));

const rootIsArray = computed(() => Array.isArray(rootData.value));

const columns = computed(() => deriveColumns(gridData.value));

const gridHeaders = computed(() => columns.value.map((col) => col.label));

// Indices into gridData for the rows that pass the current search filter.
// Grid rows render from filteredGridData, but edits must write to the
// original array position — never the filtered position.
const filteredIndices = computed(() => {
    if (!searchQuery.value.trim()) return gridData.value.map((_, i) => i);

    const query = searchQuery.value.toLowerCase();
    const indices = [];
    gridData.value.forEach((row, i) => {
        if (row && deepMatch(row, query)) indices.push(i);
    });
    return indices;
});

// Multi-column sort model: [{ id, path, direction }]. Applied on top of the
// filter, so `visibleIndices` is the single source of truth for view→source
// mapping. Edits and highlights map back through it, never through the raw
// view position.
const sortModel = ref([]);

const visibleIndices = computed(() =>
    sortIndices(filteredIndices.value, gridData.value, sortModel.value)
);

const filteredGridData = computed(() =>
    visibleIndices.value.map((i) => gridData.value[i])
);

function sourceIndexFor(rowIndex) {
    return visibleIndices.value[rowIndex] ?? rowIndex;
}

// Cycle a column's sort: none → asc → desc → none. Plain click sorts by that
// column alone; shift-click appends/toggles it within a multi-column sort.
function toggleSort(column, additive = false) {
    const existing = sortModel.value.find((s) => s.id === column.id);
    let next;
    if (!existing) {
        next = { id: column.id, path: column.path, direction: 'asc' };
    } else if (existing.direction === 'asc') {
        next = { ...existing, direction: 'desc' };
    } else {
        next = null; // third click clears this column
    }

    if (additive) {
        const rest = sortModel.value.filter((s) => s.id !== column.id);
        sortModel.value = next ? [...rest, next] : rest;
    } else {
        sortModel.value = next ? [next] : [];
    }
}

function sortStateFor(columnId) {
    const index = sortModel.value.findIndex((s) => s.id === columnId);
    if (index === -1) return null;
    return { direction: sortModel.value[index].direction, order: index + 1 };
}

// WYSIWYG export: everything reflects the *current view* — the visible columns
// in their order, and the filtered + sorted rows. All four serializers are the
// shared, unit-tested pure functions.
const exportFormats = [
    { id: 'csv', label: 'CSV', mime: 'text/csv', ext: 'csv' },
    {
        id: 'markdown',
        label: 'Markdown table',
        mime: 'text/markdown',
        ext: 'md',
    },
    {
        id: 'ndjson',
        label: 'NDJSON',
        mime: 'application/x-ndjson',
        ext: 'ndjson',
    },
    { id: 'json', label: 'JSON', mime: 'application/json', ext: 'json' },
];

function serializeView(format) {
    const cols = columns.value;
    const rows = filteredGridData.value;
    switch (format) {
        case 'csv':
            return toCsv(cols, rows);
        case 'markdown':
            return toMarkdown(cols, rows);
        case 'ndjson':
            return toNdjson(cols, rows);
        default:
            return toJson(cols, rows);
    }
}

async function copyExport(format) {
    const rows = filteredGridData.value.length;
    await copyText(serializeView(format));
    toast.success(
        `Copied ${rows} ${rows === 1 ? 'row' : 'rows'} as ${format.toUpperCase()}`
    );
}

function downloadExport(format) {
    const meta = exportFormats.find((f) => f.id === format);
    const blob = new Blob([serializeView(format)], { type: meta.mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jsongrid-export.${meta.ext}`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${meta.ext.toUpperCase()}`);
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
        // No `maxLines: Infinity`. That mode makes Ace grow to fit the whole
        // document and render every line into the DOM — a 2.5k-line file
        // produced ~2,600 line nodes and ~45k total DOM nodes, which is the
        // real source of "heaviness" on large inputs. Leaving maxLines unset
        // lets Ace virtualize to the (fixed-height) container: only the ~35
        // visible lines render, cutting DOM nodes ~70×.
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

    copyText(jsonText.value);
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

// Build the absolute source path for an edit originating at a grid view row.
// When the root is an array, the row is one of its elements (prefix its source
// index); when the root is a single object, that row *is* the root object. The
// whole thing is anchored under the current root path.
function sourcePathFor(viewIndex, rest = []) {
    const withinRoot = rootIsArray.value
        ? [sourceIndexFor(viewIndex), ...rest]
        : rest;
    return [...rootPath.value, ...withinRoot];
}

// Update the JSON when a cell is edited in the grid
function updateCellValue(rowIndex, header, event) {
    const newValue = event.target.innerText;
    const srcIndex = sourceIndexFor(rowIndex);

    try {
        const parsedValue = parseCellInput(newValue);
        const updatedJson = JSON.parse(jsonText.value);
        jsonText.value = JSON.stringify(
            setByPath(
                updatedJson,
                sourcePathFor(rowIndex, [header]),
                parsedValue
            ),
            null,
            2
        );
    } catch (e) {
        toast.error('Error updating JSON');
        // Reset to original value
        event.target.innerText = gridData.value[srcIndex][header];
    }
}

// Shared coercion for contenteditable input. Blank/whitespace stays a
// string — Number('') is 0, which silently corrupted cleared cells.
function parseCellInput(newValue) {
    if (newValue.toLowerCase() === 'true') return true;
    if (newValue.toLowerCase() === 'false') return false;
    if (newValue.toLowerCase() === 'null') return null;
    if (newValue.trim() !== '' && !isNaN(Number(newValue)))
        return Number(newValue);
    return newValue;
}

// Handle direct edits to a primitive array item rendered inside a cell.
function updateArrayItem(rowIndex, arrayField, itemIndex, event) {
    const newValue = event.target.innerText;
    const srcIndex = sourceIndexFor(rowIndex);
    try {
        const parsedValue = parseCellInput(newValue);
        const updatedJson = JSON.parse(jsonText.value);
        const path = sourcePathFor(rowIndex, [arrayField, itemIndex]);

        // Only write if the target really is an array element.
        if (Array.isArray(getByPath(updatedJson, path.slice(0, -1)))) {
            jsonText.value = JSON.stringify(
                setByPath(updatedJson, path, parsedValue),
                null,
                2
            );
            toast.success(`Updated array item in "${arrayField}"`);
        }
    } catch (e) {
        toast.error('Failed to update array item');
        // Reset to original value on error
        const originalItem = gridData.value[srcIndex][arrayField][itemIndex];
        event.target.innerText = originalItem;
    }
}

// Handle edits emitted by the recursive NestedObjectView. The update path is a
// cell path string ("2.metadata.settings[1]"); parse it structurally and anchor
// it under the grid root — no more hand-rolled bracket walking.
function updateNestedValue(update) {
    try {
        const segments = parseCellPath(update.path);
        if (segments.length === 0) return;

        const viewIndex = Number(segments[0]);
        const rest = segments.slice(1);
        const updatedJson = JSON.parse(jsonText.value);

        jsonText.value = JSON.stringify(
            setByPath(
                updatedJson,
                sourcePathFor(viewIndex, rest),
                update.value
            ),
            null,
            2
        );
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
            showShareModal(link);
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

// Highlight the editor line that produced a clicked grid cell. The path is
// resolved structurally via a source locator (utils/jsonLocate) instead of by
// string-matching lines, so it stays correct with duplicate values, repeated
// keys or minified JSON. The path's leading segment is the *view* row index —
// map it back to the source position before locating.
function highlightJsonPath(info) {
    if (!jsonEditor.value || !jsonText.value.trim()) return;

    try {
        const segments = parseCellPath(info.path);
        if (segments.length === 0) return;

        const srcIndex = sourceIndexFor(Number(segments[0]));
        const rest = segments.slice(1);
        // Path within the grid root, then anchored under the root path so it
        // addresses the real source location even when the grid is pivoted
        // onto a nested array.
        const withinRoot = rootIsArray.value ? [srcIndex, ...rest] : rest;
        const sourceSegments = [...rootPath.value, ...withinRoot];

        const loc = locatePath(jsonText.value, sourceSegments);
        if (loc) highlightEditorLine(loc.line);
    } catch (e) {
        console.error('Error highlighting JSON path:', e);
    }
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
    // getFirstVisibleRow lives on the editor, not the session — calling it on
    // the session threw and aborted the highlight. The old string-matching
    // locator usually returned null and never reached here, so the bug stayed
    // hidden until the locator started resolving lines reliably.
    const firstVisibleRow = jsonEditor.value.getFirstVisibleRow();
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
    font-family:
        'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro',
        monospace;
}

/* Do NOT force overflow on .ace_scroller. Ace renders its own virtual
   scrollbar (.ace_scrollbar-v); making the scroller natively scrollable stacks
   a second vertical scrollbar on top of it. Let Ace manage its own scrolling. */

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
