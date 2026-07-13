<template>
    <ToolLayout>
        <template #actions>
            <BaseButton icon="mdi:play" size="sm" @click="runCode">
                Run
            </BaseButton>
            <BaseButton
                variant="secondary"
                icon="mdi:share-variant"
                size="sm"
                @click="shareCode"
            >
                Share Code
            </BaseButton>
        </template>

        <div class="h-[80vh] flex">
            <!-- Left Panel: Code Editors -->
            <div class="flex flex-col pr-4 w-1/2 border-r dark:border-gray-700">
                <!-- Editors -->
                <div class="flex flex-col flex-1 gap-4">
                    <div class="overflow-hidden relative flex-1 rounded-md border dark:border-gray-700">
                        <div
                            class="z-10 px-4 py-2 text-sm font-medium bg-gray-100 border-b border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                        >
                            HTML
                        </div>
                        <div
                            class="absolute inset-x-0 bottom-0 top-[40px] overflow-y-auto"
                        >
                            <div ref="htmlEditorContainer" class="h-full"></div>
                        </div>
                    </div>

                    <div class="overflow-hidden relative flex-1 rounded-md border dark:border-gray-700">
                        <div
                            class="z-10 px-4 py-2 text-sm font-medium bg-gray-100 border-b border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                        >
                            CSS
                        </div>
                        <div
                            class="absolute inset-x-0 bottom-0 top-[40px] overflow-y-auto"
                        >
                            <div ref="cssEditorContainer" class="h-full"></div>
                        </div>
                    </div>

                    <div class="overflow-hidden relative flex-1 rounded-md border dark:border-gray-700">
                        <div
                            class="z-10 px-4 py-2 text-sm font-medium bg-gray-100 border-b border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                        >
                            JavaScript
                        </div>
                        <div
                            class="absolute inset-x-0 bottom-0 top-[40px] overflow-y-auto"
                        >
                            <div ref="jsEditorContainer" class="h-full"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Panel: Preview -->
            <div class="flex flex-col pl-4 w-1/2 h-[80vh]">
                <div class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Preview
                </div>
                <iframe
                    ref="previewFrame"
                    class="w-full h-full bg-white rounded-md border dark:border-gray-700"
                    sandbox="allow-scripts allow-same-origin"
                ></iframe>
            </div>
        </div>
    </ToolLayout>
</template>

<script setup>
import ace from 'ace-builds';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/mode-css';
import { useLocalStorage } from '@vueuse/core';
import { debounce } from 'lodash-es';

const { generateShareLink, getSharedData } = useShareLink();
const toast = useToast();

const htmlEditorContainer = ref(null);
const cssEditorContainer = ref(null);
const jsEditorContainer = ref(null);
const previewFrame = ref(null);
const editors = ref({});
const code = useLocalStorage('code', {
    html: '<div class="container">\n  <h1>Hello World</h1>\n  <p>Start coding here!</p>\n</div>',
    css: '.container {\n  padding: 20px;\n}\n\nh1 {\n  color: #2563eb;\n}',
    javascript: 'console.log("Hello from JavaScript!");',
});

// Set up Ace Editor
const setupEditors = () => {
    const createEditor = (container, language, initialValue) => {
        if (!container) return null;

        const editor = ace.edit(container, {
            mode: `ace/mode/${language}`,
            theme: 'ace/theme/monokai',
            value: initialValue,
            fontSize: 16,
            showPrintMargin: false,
            wrap: true,
            highlightActiveLine: true,
            minLines: 10,
            maxLines: 40,
        });

        const updateCode = debounce((value) => {
            code.value[language] = value;
        }, 300);

        editor.on('change', () => {
            updateCode(editor.getValue());
        });

        return editor;
    };

    editors.value.html = createEditor(
        htmlEditorContainer.value,
        'html',
        code.value.html
    );
    editors.value.css = createEditor(
        cssEditorContainer.value,
        'css',
        code.value.css
    );
    editors.value.javascript = createEditor(
        jsEditorContainer.value,
        'javascript',
        code.value.javascript
    );
};

const runCode = () => {
    const iframe = previewFrame.value;
    if (!iframe) return;

    const scriptContent = `
    ${code.value.javascript}
  `;

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>${code.value.css}</style>
      </head>
      <body>
        ${code.value.html}
        <script>${scriptContent}<\/script>
      </body>
    </html>
  `;

    if (iframe.srcdoc !== html) {
        iframe.srcdoc = html;
    }
};

onMounted(async () => {
    const shared = await getSharedData();
    if (shared?.code) {
        code.value = shared.code;
    }

    setupEditors();
    runCode();
});

const shareCode = async () => {
    const link = await generateShareLink('/tools/code', { code: code.value });
    if (link) {
        navigator.clipboard.writeText(link);
        toast.success('Share link copied to clipboard!');
    } else {
        console.error('Failed to generate share link.');
        toast.error('Failed to generate share link.');
    }
};

onUnmounted(() => {
    Object.values(editors.value).forEach((editor) => editor?.destroy());
});
</script>

<style scoped></style>
