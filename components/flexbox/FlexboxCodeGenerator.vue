<template>
    <div class="flex flex-col h-full">
        <div
            class="sticky top-0 z-10 flex items-center justify-between mb-2 bg-white"
        >
            <div class="flex justify-between w-full gap-2 py-1">
                <div class="flex overflow-hidden rounded">
                    <button
                        v-for="codeType in codeTypes"
                        :key="codeType"
                        :class="[
                            'px-3 py-1 text-sm',
                            activeCodeType === codeType
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-200 hover:bg-gray-300',
                        ]"
                        @click="activeCodeType = codeType"
                    >
                        {{ codeType }}
                    </button>
                </div>
                <button
                    @click="copyCode"
                    :class="[
                        'px-3 py-1 text-sm rounded',
                        copied
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300',
                    ]"
                    :title="copied ? 'Copied!' : 'Copy to clipboard'"
                >
                    <Icon
                        :icon="copied ? 'mdi:check' : 'mdi:content-copy'"
                        class="w-4 h-4"
                    />
                </button>
            </div>
        </div>

        <div class="flex-1 overflow-auto">
            <pre
                class="h-full p-3 text-sm text-gray-100 bg-gray-900 rounded-md"
            ><code v-html="highlightedCode"></code></pre>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Icon } from '@iconify/vue';
import hljs from 'highlight.js/lib/core';
import htmlLang from 'highlight.js/lib/languages/xml';
import cssLang from 'highlight.js/lib/languages/css';
import 'highlight.js/styles/atom-one-dark.css';

// Register highlight.js languages
hljs.registerLanguage('html', htmlLang);
hljs.registerLanguage('css', cssLang);

const props = defineProps({
    containerStyles: {
        type: Object,
        required: true,
    },
    flexItems: {
        type: Array,
        required: true,
    },
});

const codeTypes = ['HTML', 'CSS', 'Both'];
const activeCodeType = ref('Both');
const copied = ref(false);

// Generate HTML code
const htmlCode = computed(() => {
    const containerClasses = 'flex-container';

    let code = `<div class="${containerClasses}">\n`;
    props.flexItems.forEach((item, index) => {
        code += `  <div class="flex-item item-${index + 1}">${item.content}</div>\n`;
    });
    code += '</div>';

    return code;
});

// Generate CSS code
const cssCode = computed(() => {
    let code = `.flex-container {\n`;

    // Add container styles
    Object.entries(props.containerStyles).forEach(([property, value]) => {
        if (value !== undefined && value !== '') {
            code += `  ${property}: ${value};\n`;
        }
    });
    code += `}\n\n`;

    code += `.flex-item {\n`;
    code += `  padding: 20px;\n`;
    code += `  text-align: center;\n`;
    code += `  border-radius: 4px;\n`;
    code += `}\n\n`;

    // Add individual item styles
    props.flexItems.forEach((item, index) => {
        code += `.item-${index + 1} {\n`;
        if (item.styles.flexGrow !== undefined) {
            code += `  flex-grow: ${item.styles.flexGrow};\n`;
        }
        if (item.styles.flexShrink !== undefined) {
            code += `  flex-shrink: ${item.styles.flexShrink};\n`;
        }
        if (item.styles.flexBasis !== undefined) {
            code += `  flex-basis: ${item.styles.flexBasis};\n`;
        }
        if (item.styles.alignSelf !== 'auto') {
            code += `  align-self: ${item.styles.alignSelf};\n`;
        }
        if (item.styles.order !== 0) {
            code += `  order: ${item.styles.order};\n`;
        }
        if (item.styles.backgroundColor) {
            code += `  background-color: ${item.styles.backgroundColor};\n`;
        }
        if (item.styles.width) {
            code += `  width: ${item.styles.width};\n`;
        }
        if (item.styles.height) {
            code += `  height: ${item.styles.height};\n`;
        }
        code += `}\n\n`;
    });

    return code.trim();
});

// Combined code
const combinedCode = computed(() => {
    return `<!-- HTML -->\n${htmlCode.value}\n\n/* CSS */\n${cssCode.value}`;
});

// Determine which code to show based on active tab
const codeToShow = computed(() => {
    if (activeCodeType.value === 'HTML') return htmlCode.value;
    if (activeCodeType.value === 'CSS') return cssCode.value;
    return combinedCode.value;
});

// Highlighted code
const highlightedCode = computed(() => {
    if (activeCodeType.value === 'HTML') {
        return hljs.highlight(codeToShow.value, { language: 'html' }).value;
    } else if (activeCodeType.value === 'CSS') {
        return hljs.highlight(codeToShow.value, { language: 'css' }).value;
    } else {
        // For combined code, we need to handle HTML and CSS separately
        const htmlHighlighted = hljs.highlight(
            '<!-- HTML -->\n' + htmlCode.value,
            { language: 'html' }
        ).value;
        const cssHighlighted = hljs.highlight(
            '\n\n/* CSS */\n' + cssCode.value,
            { language: 'css' }
        ).value;
        return htmlHighlighted + cssHighlighted;
    }
});

// Methods
const copyCode = () => {
    navigator.clipboard.writeText(codeToShow.value);
    copied.value = true;
    setTimeout(() => {
        copied.value = false;
    }, 2000);
};
</script>
