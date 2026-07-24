<template>
    <div class="space-y-1.5">
        <label
            v-if="label"
            class="block text-xs font-medium text-gray-600 dark:text-gray-400"
        >
            {{ label }}
        </label>
        <div
            v-for="(_, i) in model"
            :key="i"
            class="flex gap-1.5 items-start"
        >
            <textarea
                v-model="model[i]"
                :rows="1"
                :placeholder="placeholder"
                class="flex-1 px-3 py-1.5 text-sm text-gray-900 bg-white rounded-lg border border-gray-300 resize-y focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                @input="emitTouch"
            />
            <BaseIconButton
                icon="mdi:close"
                label="Remove"
                variant="danger"
                @click="removeAt(i)"
            />
        </div>
        <button
            type="button"
            class="inline-flex gap-1 items-center text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            @click="add"
        >
            <Icon icon="mdi:plus" class="w-4 h-4" />
            {{ addLabel }}
        </button>
    </div>
</template>

<script setup>
import { Icon } from '@iconify/vue';

const props = defineProps({
    label: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    addLabel: { type: String, default: 'Add item' },
});

const model = defineModel({ type: Array, default: () => [] });
const emit = defineEmits(['touch']);

const emitTouch = () => emit('touch');

function add() {
    model.value.push('');
    emitTouch();
}
function removeAt(i) {
    model.value.splice(i, 1);
    emitTouch();
}
</script>
