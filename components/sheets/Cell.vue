<template>
    <td
        :class="['border  min-w-[100px] relative', { 'bg-blue-50 ': isActive }]"
        @click="$emit('cell-click', { row, col })"
        @mousedown="$emit('selection-start', { row, col })"
        @mouseenter="$emit('selection-move', { row, col })"
    >
        <div
            :class="[
                'px-2 py-1 w-full h-full',
                getCellAlignment(format?.align),
                { 'font-bold': format?.bold },
                { italic: format?.italic },
                { underline: format?.underline },
            ]"
            :style="{
                fontSize: format?.fontSize ? `${format.fontSize}px` : '14px',
            }"
        >
            <div
                v-if="isEditing"
                ref="editor"
                contenteditable
                class="w-full h-full outline-none"
                @blur="handleBlur"
                @keydown="handleKeyDown"
                v-text="rawValue"
            ></div>
            <template v-else>
                {{ displayValue }}
            </template>
        </div>
    </td>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue';

const props = defineProps({
    value: {
        type: String,
        default: '',
    },
    formula: {
        type: String,
        default: '',
    },
    format: {
        type: Object,
        default: () => ({}),
    },
    row: {
        type: Number,
        required: true,
    },
    col: {
        type: Number,
        required: true,
    },
    isActive: Boolean,
    isEditing: Boolean,
});

const emit = defineEmits([
    'update:value',
    'cell-click',
    'selection-start',
    'selection-move',
]);

const editor = ref(null);
const rawValue = computed(() => props.formula || props.value);
const displayValue = computed(() => props.value);

const getCellAlignment = (align) => {
    switch (align) {
        case 'left':
            return 'text-left';
        case 'center':
            return 'text-center';
        case 'right':
            return 'text-right';
        default:
            return 'text-left';
    }
};

const handleBlur = () => {
    if (!editor.value) return;
    const newValue = editor.value.textContent;
    emit('update:value', newValue);
};

const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        editor.value?.blur();
    }
};

watch(
    () => props.isEditing,
    (isEditing) => {
        if (isEditing) {
            nextTick(() => {
                editor.value?.focus();
                // Set cursor at the end
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(editor.value);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            });
        }
    }
);
</script>
