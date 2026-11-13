<template>
    <div class="flex items-center gap-2 px-3 py-2 border-y border-gray-200/80 bg-gray-50/60 dark:border-gray-700/70 dark:bg-gray-900/30">
        <div class="flex items-center min-w-[64px]">
            <span class="text-[13px] font-medium text-gray-700 dark:text-gray-300">
                {{ getCellReference(activeCell) }}
            </span>
        </div>
        <span class="px-1.5 py-0.5 font-mono text-xs italic font-semibold text-gray-500 bg-white rounded-md border border-gray-200/80 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700/70">fx</span>
        <div class="flex-1">
            <input
                :value="modelValue"
                @input="$emit('update:modelValue', $event.target.value)"
                @keydown.enter="$emit('formula-submit', $event.target.value)"
                class="w-full field !py-1 font-mono text-[13px]"
                placeholder="Enter value or formula (start with =)"
            />
        </div>
    </div>
</template>

<script setup>
defineProps({
    modelValue: String,
    activeCell: {
        type: Object,
        required: true,
    },
});

defineEmits(['update:modelValue', 'formula-submit']);

const getCellReference = ({ row, col }) => {
    const colLabel = String.fromCharCode(65 + col);
    return `${colLabel}${row + 1}`;
};
</script>
