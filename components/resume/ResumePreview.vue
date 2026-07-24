<template>
    <div class="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
        <div
            class="flex justify-between items-center px-4 py-2 text-xs text-gray-500 border-b dark:border-gray-700 dark:text-gray-400"
        >
            <span class="inline-flex gap-1.5 items-center">
                <Icon icon="mdi:file-pdf-box" class="w-4 h-4" />
                Live PDF preview
            </span>
            <span v-if="rendering" class="inline-flex gap-1 items-center">
                <Icon icon="mdi:loading" class="w-3.5 h-3.5 animate-spin" />
                Rendering…
            </span>
        </div>

        <div class="overflow-hidden relative flex-1">
            <iframe
                v-if="src"
                :src="src"
                title="Resume preview"
                class="w-full h-full border-0"
            />
            <div
                v-if="error"
                class="flex absolute inset-0 justify-center items-center p-6 text-sm text-center text-red-600 dark:text-red-400"
            >
                {{ error }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { Icon } from '@iconify/vue';
import { useDebounceFn } from '@vueuse/core';
import { toBlob } from '~/utils/resume/export';

const props = defineProps({
    doc: { type: Object, required: true },
});

const src = ref('');
const rendering = ref(false);
const error = ref('');
let currentUrl = '';

async function render() {
    rendering.value = true;
    error.value = '';
    try {
        const blob = await toBlob(props.doc);
        const next = URL.createObjectURL(blob);
        if (currentUrl) URL.revokeObjectURL(currentUrl);
        currentUrl = next;
        // #toolbar=0 hides the native PDF chrome for a cleaner preview.
        src.value = `${next}#toolbar=0`;
    } catch (err) {
        error.value = `Could not render preview: ${err?.message || err}`;
    } finally {
        rendering.value = false;
    }
}

const debouncedRender = useDebounceFn(render, 350);

onMounted(render);
watch(() => props.doc, debouncedRender, { deep: true });
onBeforeUnmount(() => {
    if (currentUrl) URL.revokeObjectURL(currentUrl);
});

defineExpose({ render });
</script>
