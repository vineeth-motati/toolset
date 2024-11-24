<template>
    <div
        class="flex justify-between items-center p-2 space-x-4 bg-white border-b"
    >
        <div class="flex items-center space-x-4">
            <!-- Sheet Management -->
            <div class="flex items-center space-x-1">
                <button
                    v-for="sheet in sheets"
                    :key="sheet.id"
                    @click="$emit('switch-sheet', sheet.id)"
                    :class="[
                        'px-4 py-2  rounded text-sm',
                        activeSheet?.id === sheet.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-gray-100',
                    ]"
                >
                    {{ sheet.name }}
                </button>
                <button
                    @click="$emit('add-sheet')"
                    class="p-2 rounded hover:bg-gray-100"
                >
                    <Icon icon="mdi:plus" class="w-5 h-5" />
                </button>
            </div>

            <!-- Formatting Tools -->
            <div class="flex items-center space-x-2">
                <select
                    v-model="fontSize"
                    class="px-4 py-2 text-sm rounded border"
                    @change="updateFormat({ fontSize })"
                >
                    <option v-for="size in fontSizes" :key="size" :value="size">
                        {{ size }}px
                    </option>
                </select>

                <div class="flex rounded border">
                    <button
                        v-for="align in alignments"
                        :key="align.value"
                        @click="updateFormat({ align: align.value })"
                        :class="[
                            'p-2 hover:bg-gray-100',
                            {
                                'bg-blue-50 ':
                                    currentFormat?.align === align.value,
                            },
                        ]"
                        :title="align.label"
                    >
                        <Icon :icon="align.icon" class="w-4 h-4" />
                    </button>
                </div>

                <div class="flex rounded border">
                    <button
                        v-for="style in styles"
                        :key="style.value"
                        @click="toggleStyle(style.value)"
                        :class="[
                            'p-2 hover:bg-gray-100',
                            {
                                'bg-blue-50 ': currentFormat?.[style.value],
                            },
                        ]"
                        :title="style.label"
                    >
                        <Icon :icon="style.icon" class="w-4 h-4" />
                    </button>
                </div>
            </div>

            <!-- Import/Export -->
            <div class="flex items-center space-x-2">
                <input
                    type="file"
                    ref="fileInput"
                    class="hidden"
                    accept=".csv,.xlsx,.xls"
                    @change="handleFileImport"
                />
                <button
                    @click="$refs.fileInput.click()"
                    class="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700"
                >
                    Import
                </button>
                <Menu as="div" class="relative">
                    <MenuButton
                        class="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                        Export
                    </MenuButton>
                    <MenuItems
                        class="absolute right-0 z-50 mt-1 w-40 bg-white rounded border shadow-lg"
                    >
                        <MenuItem v-slot="{ active }">
                            <button
                                @click="$emit('export-file', 'csv')"
                                :class="[
                                    'w-full text-left px-4 py-2 text-sm',
                                    active ? 'bg-gray-100 ' : '',
                                ]"
                            >
                                Export as CSV
                            </button>
                        </MenuItem>
                        <MenuItem v-slot="{ active }">
                            <button
                                @click="$emit('export-file', 'xlsx')"
                                :class="[
                                    'w-full text-left px-4 py-2 text-sm',
                                    active ? 'bg-gray-100 ' : '',
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
            <button
                @click="$emit('share-sheet')"
                class="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700"
            >
                Share Sheet
            </button>
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
