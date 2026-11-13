<template>
    <div
        class="flex flex-wrap justify-between items-center gap-2 px-3 py-2 border-b border-gray-200/80 bg-gray-50/60 dark:border-gray-700/70 dark:bg-gray-900/30"
    >
        <div class="flex flex-wrap items-center gap-2">
            <!-- Sheet Management -->
            <div class="flex items-center space-x-1">
                <button
                    v-for="sheet in sheets"
                    :key="sheet.id"
                    @click="$emit('switch-sheet', sheet.id)"
                    :class="[
                        'px-3 py-1.5 rounded-lg text-sm font-medium',
                        activeSheet?.id === sheet.id
                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/40',
                    ]"
                >
                    {{ sheet.name }}
                </button>
                <BaseIconButton
                    icon="lucide:plus"
                    label="Add sheet"
                    @click="$emit('add-sheet')"
                />
            </div>

            <div class="w-px h-5 bg-gray-200 dark:bg-gray-700"></div>
            <!-- Formatting Tools -->
            <div class="flex items-center space-x-2">
                <select
                    v-model="fontSize"
                    class="field !w-auto !py-1.5 text-sm"
                    @change="updateFormat({ fontSize })"
                    aria-label="Font size"
                >
                    <option v-for="size in fontSizes" :key="size" :value="size">
                        {{ size }}px
                    </option>
                </select>

                <div
                    class="flex gap-0.5 items-center"
                >
                    <button
                        v-for="align in alignments"
                        :key="align.value"
                        @click="updateFormat({ align: align.value })"
                        :class="[
                            'p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/40',
                            {
                                '!bg-primary-50 !text-primary-700 dark:!bg-primary-500/10 dark:!text-primary-300':
                                    currentFormat?.align === align.value,
                            },
                        ]"
                        :title="align.label"
                    >
                        <Icon :icon="align.icon" class="w-4 h-4" />
                    </button>
                </div>

                <div
                    class="flex gap-0.5 items-center"
                >
                    <button
                        v-for="style in styles"
                        :key="style.value"
                        @click="toggleStyle(style.value)"
                        :class="[
                            'p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/40',
                            {
                                '!bg-primary-50 !text-primary-700 dark:!bg-primary-500/10 dark:!text-primary-300':
                                    currentFormat?.[style.value],
                            },
                        ]"
                        :title="style.label"
                    >
                        <Icon :icon="style.icon" class="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div class="w-px h-5 bg-gray-200 dark:bg-gray-700"></div>
            <!-- Import/Export -->
            <div class="flex items-center space-x-2">
                <input
                    type="file"
                    ref="fileInput"
                    class="hidden"
                    accept=".csv,.xlsx,.xls"
                    @change="handleFileImport"
                />
                <BaseButton
                    variant="ghost"
                    size="sm"
                    icon="lucide:upload"
                    @click="$refs.fileInput.click()"
                >
                    Import
                </BaseButton>
                <Menu as="div" class="relative">
                    <MenuButton
                        class="inline-flex gap-1.5 items-center px-3 py-1.5 text-xs font-medium text-gray-700 rounded-lg transition-colors duration-150 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/40"
                    >
                        <Icon icon="lucide:download" class="w-4 h-4" />
                        Export
                    </MenuButton>
                    <MenuItems
                        class="absolute right-0 z-50 p-1 mt-1 w-40 bg-white rounded-xl border shadow-pop border-gray-200/80 dark:bg-gray-800 dark:border-gray-700/70"
                    >
                        <MenuItem v-slot="{ active }">
                            <button
                                @click="$emit('export-file', 'csv')"
                                :class="[
                                    'w-full text-left px-3 py-1.5 rounded-lg text-sm text-gray-700 dark:text-gray-200',
                                    active
                                        ? 'bg-gray-100 dark:bg-gray-700/60'
                                        : '',
                                ]"
                            >
                                Export as CSV
                            </button>
                        </MenuItem>
                        <MenuItem v-slot="{ active }">
                            <button
                                @click="$emit('export-file', 'xlsx')"
                                :class="[
                                    'w-full text-left px-3 py-1.5 rounded-lg text-sm text-gray-700 dark:text-gray-200',
                                    active
                                        ? 'bg-gray-100 dark:bg-gray-700/60'
                                        : '',
                                ]"
                            >
                                Export as Excel
                            </button>
                        </MenuItem>
                    </MenuItems>
                </Menu>
            </div>
        </div>
        <div>
            <BaseButton
                icon="lucide:share-2"
                size="sm"
                @click="$emit('share-sheet')"
            >
                Share Sheet
            </BaseButton>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue';
import { Icon } from '@iconify/vue';

const props = defineProps({
    activeSheet: Object,
    sheets: Array,
    currentFormat: Object,
});

const emit = defineEmits([
    'add-sheet',
    'switch-sheet',
    'import-file',
    'export-file',
    'update-format',
    'share-sheet',
]);

const fileInput = ref(null);
const fontSize = ref('14');

const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32];

const alignments = [
    { value: 'left', label: 'Align Left', icon: 'mdi:format-align-left' },
    { value: 'center', label: 'Align Center', icon: 'mdi:format-align-center' },
    { value: 'right', label: 'Align Right', icon: 'mdi:format-align-right' },
];

const styles = [
    { value: 'bold', label: 'Bold', icon: 'mdi:format-bold' },
    { value: 'italic', label: 'Italic', icon: 'mdi:format-italic' },
    { value: 'underline', label: 'Underline', icon: 'mdi:format-underline' },
];

const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (file) {
        emit('import-file', file);
    }
    event.target.value = null;
};

const updateFormat = (format) => {
    emit('update-format', format);
};

const toggleStyle = (style) => {
    emit('update-format', {
        [style]: !props.currentFormat?.[style],
    });
};

// Initialize fontSize from currentFormat
watch(
    () => props.currentFormat?.fontSize,
    (newSize) => {
        if (newSize) {
            fontSize.value = newSize.toString();
        }
    },
    { immediate: true }
);
</script>
