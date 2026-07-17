<template>
    <div
        class="overflow-y-auto p-4 max-w-none h-full prose"
        ref="markdownContainer"
    ></div>
</template>

<script setup>
import { onMounted, watch, ref } from 'vue';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import DOMPurify from 'isomorphic-dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

const props = defineProps({
    content: {
        type: String,
        required: true,
    },
});

// Own Marked instance with working highlighting (the global `highlight`
// option was removed in marked v5).
const markedRenderer = new Marked(
    markedHighlight({
        langPrefix: 'hljs language-',
        highlight(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        },
    })
);

// Reference to the rendered Markdown container
const markdownContainer = ref(null);

// Function to render and sanitize the Markdown
const renderMarkdown = () => {
    if (markdownContainer.value) {
        // Parse and sanitize the content (highlighting happens in-parse)
        const rawHTML = markedRenderer.parse(props.content || '');
        markdownContainer.value.innerHTML = DOMPurify.sanitize(rawHTML);
    }
};

// Watch for content changes to re-render Markdown
watch(() => props.content, renderMarkdown);

// Render the Markdown initially
onMounted(renderMarkdown);
</script>
