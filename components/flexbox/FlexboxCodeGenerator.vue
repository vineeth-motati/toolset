<template>
    <div class="flex flex-col h-full">
        <div
            class="flex overflow-hidden flex-col h-full bg-gray-900 rounded-xl border border-gray-800"
        >
            <div
                class="flex sticky top-0 z-10 justify-between items-center px-3 py-2 bg-gray-900 border-b border-gray-800"
            >
                <div
                    class="inline-flex gap-1 p-1 rounded-lg bg-gray-800/80"
                    role="tablist"
                >
                    <button
                        v-for="codeType in codeTypes"
                        :key="codeType"
                        type="button"
                        :class="[
                            'h-6 px-2.5 rounded-md font-mono text-xs font-medium transition',
                            activeCodeType === codeType
                                ? 'bg-gray-700 text-white'
                                : 'text-gray-400 hover:text-white',
                        ]"
                        @click="activeCodeType = codeType"
                    >
                        {{ codeType }}
                    </button>
                </div>
                <BaseIconButton
                    :icon="copied ? 'lucide:check' : 'lucide:copy'"
                    :label="copied ? 'Copied!' : 'Copy to clipboard'"
                    @click="copyCode"
                />
            </div>

            <div class="overflow-auto flex-1">
                <pre
                    class="p-4 font-mono text-[13px] leading-6 text-gray-100"
                ><code v-html="highlightedCode"></code></pre>
            </div>
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
    copyText(codeToShow.value);
    copied.value = true;
    setTimeout(() => {
        copied.value = false;
    }, 2000);
};
</script>
