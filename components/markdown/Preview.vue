<template>
    <div
        class="overflow-y-auto p-4 max-w-none h-full prose"
        v-html="sanitizedContent"
    ></div>
</template>

<script setup>
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

const props = defineProps({
    content: {
        type: String,
        required: true,
    },
});

// Sanitize and parse markdown content
const sanitizedContent = computed(() => {
    const rawHTML = marked.parse(props.content || '');
    return DOMPurify.sanitize(rawHTML);
});
</script>
