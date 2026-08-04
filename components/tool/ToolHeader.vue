<template>
    <!-- Stacks below sm: side-by-side, a long tool description and a full action
         row fight for the same ~390px and both lose. -->
    <div class="flex flex-col gap-3 mb-6 sm:flex-row sm:gap-4 sm:justify-between sm:items-start">
        <!-- min-w-0 lets the title column actually shrink; without it a long
             title pushes the action row off-screen on narrow viewports. -->
        <div class="flex gap-3 items-center min-w-0">
            <slot name="leading" />
            <div
                class="flex justify-center items-center w-10 h-10 text-white bg-gradient-to-br rounded-lg shrink-0 from-primary-500 to-accent-500"
            >
                <Icon :icon="tool?.icon || icon || 'mdi:tools'" class="w-5 h-5" />
            </div>
            <div class="min-w-0">
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
        <div v-if="$slots.actions" class="flex gap-2 items-center sm:shrink-0">
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
