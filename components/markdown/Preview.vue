<template>
    <div
        class="overflow-y-auto p-4 max-w-none h-full prose"
        ref="markdownContainer"
    ></div>
</template>

<script setup>
import { onMounted, watch, ref } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

const props = defineProps({
    content: {
        type: String,
        required: true,
    },
});

// Configure `marked` for syntax highlighting
marked.setOptions({
    highlight: (code, lang) => {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    },
});

// Reference to the rendered Markdown container
const markdownContainer = ref(null);

// Function to render and sanitize the Markdown
const renderMarkdown = () => {
    if (markdownContainer.value) {
        // Parse and sanitize the content
        const rawHTML = marked(props.content || '');
        markdownContainer.value.innerHTML = DOMPurify.sanitize(rawHTML);

        // Apply syntax highlighting to code blocks
        markdownContainer.value
            .querySelectorAll('pre code')
            .forEach((block) => {
                hljs.highlightElement(block);
            });
    }
};

// Watch for content changes to re-render Markdown
watch(() => props.content, renderMarkdown);

// Render the Markdown initially
onMounted(renderMarkdown);
</script>
