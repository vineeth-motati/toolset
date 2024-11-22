<template>
    <div class="flex items-center p-2 space-x-2 bg-white border-y">
        <div class="flex items-center space-x-2 min-w-[100px]">
            <span class="text-sm font-medium">
                {{ getCellReference(activeCell) }}
            </span>
        </div>
        <div class="flex-1">
            <input
                :value="modelValue"
                @input="$emit('update:modelValue', $event.target.value)"
                @keydown.enter="$emit('formula-submit', $event.target.value)"
                class="px-2 py-1 w-full rounded border"
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
