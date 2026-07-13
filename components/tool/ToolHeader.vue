<template>
    <div class="flex gap-4 justify-between items-start mb-6">
        <div class="flex gap-3 items-center">
            <slot name="leading" />
            <div
                class="flex justify-center items-center w-10 h-10 text-white bg-gradient-to-br rounded-lg shrink-0 from-primary-500 to-accent-500"
            >
                <Icon :icon="tool?.icon || icon || 'mdi:tools'" class="w-5 h-5" />
            </div>
            <div>
                <h1
                    class="text-2xl font-bold text-gray-900 dark:text-gray-100"
                >
                    {{ tool?.name || title }}
                </h1>
                <p
                    v-if="tool?.description || description"
                    class="text-sm text-gray-500 dark:text-gray-400"
                >
                    {{ tool?.description || description }}
                </p>
            </div>
        </div>
        <div v-if="$slots.actions" class="flex gap-2 items-center shrink-0">
            <slot name="actions" />
        </div>
    </div>
</template>

<script setup>
import { Icon } from '@iconify/vue';

defineProps({
    tool: { type: Object, default: null },
    title: { type: String, default: null },
    description: { type: String, default: null },
    icon: { type: String, default: null },
});
</script>
