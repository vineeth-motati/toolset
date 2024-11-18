<template>
    <div class="flex gap-2 p-2 bg-white border-b">
        <button
            v-for="action in actions"
            :key="action.label"
            @click="emitAction(action)"
            class="p-2 rounded-lg transition-colors hover:bg-gray-100"
            :title="action.label"
        >
            <Icon :icon="action.icon" class="w-5 h-5" />
        </button>
    </div>
</template>

<script setup>
import { Icon } from '@iconify/vue';

const emit = defineEmits(['action']);

const actions = [
    {
        label: 'Bold',
        icon: 'mdi:format-bold',
        markdown: { prefix: '**', suffix: '**' },
    },
    {
        label: 'Italic',
        icon: 'mdi:format-italic',
        markdown: { prefix: '_', suffix: '_' },
    },
    {
        label: 'Heading',
        icon: 'mdi:format-header-pound',
        markdown: { prefix: '## ', suffix: '' },
    },
    {
        label: 'Link',
        icon: 'mdi:link',
        markdown: { prefix: '[', suffix: '](url)' },
    },
    {
        label: 'Code',
        icon: 'mdi:code-tags',
        markdown: { prefix: '```\n', suffix: '\n```' },
    },
    {
        label: 'List',
        icon: 'mdi:format-list-bulleted',
        markdown: { prefix: '- ', suffix: '' },
    },
];

// Emit the markdown action to parent
function emitAction(action) {
    emit('action', action.markdown.prefix, action.markdown.suffix);
}
</script>
