<template>
    <div :class="fluid ? '' : 'max-w-3xl mx-auto'">
        <ToolHeader :tool="tool" :title="title" :description="description">
            <template v-if="$slots.actions" #actions>
                <ToolActions>
                    <slot name="actions" />
                </ToolActions>
            </template>
        </ToolHeader>
        <slot />
    </div>
</template>

<script setup>
import { useTools } from '@/composables/useTools';

const props = defineProps({
    // Manual overrides — normally the tool is resolved from the current
    // route via tools.json, these exist for pages outside that list.
    title: { type: String, default: null },
    description: { type: String, default: null },
    fluid: { type: Boolean, default: false },
});

const { currentTool } = useTools();
const tool = currentTool();
</script>
