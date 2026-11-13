<template>
    <div
        class="flex flex-col justify-center items-center px-6 py-12 text-center rounded-2xl border border-dashed border-gray-300/80 bg-grid-ink dark:border-gray-700"
    >
        <div
            class="flex justify-center items-center mb-4 w-12 h-12 text-gray-500 bg-white rounded-xl border border-gray-200 shadow-xs dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
        >
            <Icon :icon="icon" class="w-6 h-6" />
        </div>
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {{ title }}
        </h3>
        <p
            v-if="description"
            class="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400"
        >
            {{ description }}
        </p>
        <div v-if="$slots.action" class="mt-4">
            <slot name="action" />
        </div>
    </div>
</template>

<script setup>
import { Icon } from '@iconify/vue';

defineProps({
    icon: { type: String, default: 'mdi:tray' },
    title: { type: String, required: true },
    description: { type: String, default: null },
});
</script>
