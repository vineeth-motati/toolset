<template>
    <div :class="sizeClasses[size]">
        <ToolHeader
            :tool="tool"
            :title="title"
            :description="description"
            :icon="icon"
        >
            <template #leading>
                <!-- Pages may override (e.g. convert sub-pages); default is a
                     way back home from every tool -->
                <slot name="leading">
                    <NuxtLink
                        to="/"
                        aria-label="Back to all tools"
                        title="All tools"
                        class="inline-flex justify-center items-center p-2 text-gray-500 rounded-full transition-colors duration-150 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                    >
                        <Icon icon="mdi:arrow-left" class="w-5 h-5" />
                    </NuxtLink>
                </slot>
            </template>
            <template v-if="$slots.actions" #actions>
                <ToolActions>
                    <slot name="actions" />
                </ToolActions>
            </template>
        </ToolHeader>
        <slot />
        <!-- Fullscreen canvas tools have no scroll room for a footer strip -->
        <RelatedTools v-if="tool && tool.layout === 'default'" :tool="tool" />
    </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import RelatedTools from '@/components/tool/RelatedTools.vue';
import { useTools } from '@/composables/useTools';
import { useToolUsage } from '@/composables/useToolUsage';

const props = defineProps({
    // Manual overrides — normally the tool is resolved from the current
    // route via tools.json, these exist for pages outside that list.
    title: { type: String, default: null },
    description: { type: String, default: null },
    icon: { type: String, default: null },
    // narrow: single-input tools · wide: most tools · full: canvas tools
    size: { type: String, default: 'wide' },
});

const sizeClasses = {
    narrow: 'max-w-3xl mx-auto',
    wide: 'max-w-6xl mx-auto',
    full: '',
};

const { currentTool } = useTools();
const tool = currentTool();

useToolMeta(tool);

const { recordUsage } = useToolUsage();
onMounted(() => {
    if (tool) recordUsage(tool.path);
});
</script>
