<template>
    <div
        class="flex flex-wrap items-center gap-1.5 px-3 py-2 border-b border-gray-200/80 bg-gray-50/60 dark:border-gray-700/70 dark:bg-gray-900/30"
    >
        <BaseIconButton
            v-for="action in actions"
            :key="action.label"
            :icon="action.icon"
            :label="action.label"
            @click="emitAction(action)"
        />
    </div>
</template>

<script setup>
import { Icon } from '@iconify/vue';

const emit = defineEmits(['action']);

const actions = [
    {
        label: 'Bold',
        icon: 'lucide:bold',
        markdown: { prefix: '**', suffix: '**' },
    },
    {
        label: 'Italic',
        icon: 'lucide:italic',
        markdown: { prefix: '_', suffix: '_' },
    },
    {
        label: 'Heading',
        icon: 'mdi:format-header-pound',
        markdown: { prefix: '## ', suffix: '' },
    },
    {
        label: 'Link',
        icon: 'lucide:link',
        markdown: { prefix: '[', suffix: '](url)' },
    },
    {
        label: 'Code',
        icon: 'lucide:code',
        markdown: { prefix: '```\n', suffix: '\n```' },
    },
    {
        label: 'List',
        icon: 'lucide:list',
        markdown: { prefix: '- ', suffix: '' },
    },
];

// Emit the markdown action to parent
function emitAction(action) {
    emit('action', action.markdown.prefix, action.markdown.suffix);
}
</script>
