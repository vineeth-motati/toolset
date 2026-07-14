<template>
    <div :class="sizeClasses[size]">
        <ToolHeader
            :tool="tool"
            :title="title"
            :description="description"
            :icon="icon"
        >
            <template v-if="$slots.leading" #leading>
                <slot name="leading" />
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
