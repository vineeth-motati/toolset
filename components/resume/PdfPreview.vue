<template>
    <div class="flex flex-col h-full bg-gray-100 dark:bg-gray-950">
        <!-- Toolbar -->
        <div
            class="flex gap-2 justify-between items-center px-3 py-1.5 bg-white border-b border-gray-200 shrink-0 dark:bg-gray-900 dark:border-gray-800"
        >
            <div class="flex gap-2 items-center min-w-0">
                <span
                    class="inline-flex gap-1.5 items-center text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                    <Icon icon="mdi:file-document-outline" class="w-4 h-4 text-gray-400" />
                    <span class="hidden sm:inline">Preview</span>
                </span>
                <span
                    v-if="pageCount"
                    class="px-1.5 py-0.5 text-[11px] font-medium tabular-nums rounded text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400"
                >
                    {{ pageCount }} {{ pageCount === 1 ? 'page' : 'pages' }}
                </span>
                <Transition
                    enter-active-class="transition-opacity duration-150"
                    enter-from-class="opacity-0"
                    leave-active-class="transition-opacity duration-300"
                    leave-to-class="opacity-0"
                >
                    <span
                        v-if="rendering"
                        class="inline-flex gap-1 items-center text-[11px] text-gray-400"
                    >
                        <Icon icon="mdi:loading" class="w-3 h-3 animate-spin" />
                        <span class="hidden sm:inline">Updating</span>
                    </span>
                </Transition>
            </div>

            <div class="flex gap-0.5 items-center">
                <BaseIconButton
                    icon="mdi:minus"
                    label="Zoom out"
                    :disabled="zoomIndex <= 0"
                    @click="stepZoom(-1)"
                />
                <button
                    type="button"
                    class="px-1.5 py-1 min-w-[3.25rem] text-[11px] font-medium tabular-nums text-gray-600 rounded transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    :title="fitMode ? 'Fit to width — click for 100%' : 'Click to fit width'"
                    @click="toggleFit"
                >
                    {{ fitMode ? 'Fit' : `${Math.round(zoom * 100)}%` }}
                </button>
                <BaseIconButton
                    icon="mdi:plus"
                    label="Zoom in"
                    :disabled="zoomIndex >= ZOOM_STEPS.length - 1"
                    @click="stepZoom(1)"
                />
            </div>
        </div>

        <!-- Page canvas scroller -->
        <!-- overflow-y-scroll, not auto: a scrollbar that appears only after the
             first page renders would change the width the fit-scale was measured
             against, and the page would overflow horizontally. -->
        <div
            ref="scroller"
            class="overflow-x-auto overflow-y-scroll relative flex-1 px-4 py-4 overscroll-contain"
            :class="error ? 'opacity-40' : ''"
        >
            <div ref="pagesEl" class="flex flex-col gap-4 items-center w-full" />

            <!-- First-paint skeleton -->
            <div
                v-if="!pageCount && !error"
                class="flex flex-col gap-3 items-center pt-10 text-gray-400"
            >
                <Icon icon="mdi:loading" class="w-6 h-6 animate-spin" />
                <p class="text-xs">Rendering your resume…</p>
            </div>
        </div>

        <!-- Render failure -->
        <div
            v-if="error"
            class="px-4 py-3 text-xs border-t border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-900/40 dark:text-red-300"
        >
            <p class="flex gap-1.5 items-start">
                <Icon icon="mdi:alert-circle-outline" class="mt-px w-4 h-4 shrink-0" />
                <span>{{ error }}</span>
            </p>
        </div>
    </div>
</template>

<script setup>
/**
 * Paginated, zoomable preview. pdfmake still produces the single source of
 * truth (the same docDefinition the download uses), but instead of dropping the
 * blob into an <iframe> — which reloads the browser's PDF viewer on every
 * keystroke, losing scroll position and flashing white — we rasterise it with
 * pdf.js and swap the canvases in one shot.
 *
 * That buys three things an iframe cannot: a real page count (fed back to the
 * score panel), zoom that survives re-renders, and no flicker while typing.
 */
import { ref, shallowRef, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Icon } from '@iconify/vue';
import { useDebounceFn, useResizeObserver } from '@vueuse/core';
import { toBlob } from '~/utils/resume/export';

const props = defineProps({
    doc: { type: Object, required: true },
});
const emit = defineEmits(['pages', 'error']);

const ZOOM_STEPS = [0.5, 0.65, 0.8, 1, 1.25, 1.5, 2];
const PAGE_GAP = 16; // matches the gap-4 above, for scroll maths

const scroller = ref(null);
const pagesEl = ref(null);
const pageCount = ref(0);
const rendering = ref(false);
const error = ref('');
const zoomIndex = ref(3); // 100%
const zoom = ref(1);
const fitMode = ref(true);

let pdfjs = null;
let generation = 0; // discards stale async renders
let lastBytes = null; // re-zoom without re-running pdfmake
const loadingTask = shallowRef(null);

async function getPdfjs() {
    if (!pdfjs) {
        const lib = await import('pdfjs-dist');
        const workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
        lib.GlobalWorkerOptions.workerSrc = workerSrc;
        pdfjs = lib;
    }
    return pdfjs;
}

/**
 * Scale that makes a page fill the available width. Measured from the inner
 * full-width track rather than the scroller, so padding and the scrollbar
 * gutter are already excluded.
 */
function fitScale(unscaledWidth) {
    const available = pagesEl.value?.clientWidth || (scroller.value?.clientWidth ?? 640) - 32;
    return Math.max(0.2, Math.min(3, available / unscaledWidth));
}

/**
 * Rasterise `bytes` and replace the visible canvases atomically. Pages are
 * built into a fragment first so the user never sees a half-empty document.
 */
async function paint(bytes) {
    const lib = await getPdfjs();
    const mine = ++generation;

    // pdf.js transfers the buffer to its worker, so hand it a copy.
    const task = lib.getDocument({ data: bytes.slice(0) });
    let pdf;
    try {
        pdf = await task.promise;
    } catch (err) {
        await task.destroy();
        throw err;
    }
    if (mine !== generation) {
        await task.destroy();
        return;
    }

    try {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const fragment = document.createDocumentFragment();

        for (let n = 1; n <= pdf.numPages; n++) {
            const page = await pdf.getPage(n);
            if (mine !== generation) return;

            const base = page.getViewport({ scale: 1 });
            if (fitMode.value && n === 1) zoom.value = fitScale(base.width);
            const viewport = page.getViewport({ scale: zoom.value });

            const canvas = document.createElement('canvas');
            canvas.width = Math.floor(viewport.width * dpr);
            canvas.height = Math.floor(viewport.height * dpr);
            canvas.style.width = `${Math.floor(viewport.width)}px`;
            canvas.style.height = `${Math.floor(viewport.height)}px`;
            canvas.className =
                'bg-white shadow-md ring-1 ring-black/5 dark:ring-white/10 rounded-sm';
            canvas.setAttribute('role', 'img');
            canvas.setAttribute('aria-label', `Resume page ${n} of ${pdf.numPages}`);

            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
            await page.render({ canvasContext: ctx, viewport }).promise;
            if (mine !== generation) return;

            fragment.appendChild(canvas);
            page.cleanup();
        }

        if (mine !== generation || !pagesEl.value) return;

        // Keep the reading position across re-renders.
        const el = scroller.value;
        const ratio = el && el.scrollHeight > 0 ? el.scrollTop / el.scrollHeight : 0;

        pagesEl.value.replaceChildren(fragment);

        if (pdf.numPages !== pageCount.value) {
            pageCount.value = pdf.numPages;
            emit('pages', pdf.numPages);
        }
        await nextTick();
        if (el) el.scrollTop = ratio * el.scrollHeight;
    } finally {
        if (mine === generation) {
            // pdf.js documents hold worker-side resources that aren't GC'd —
            // release the one this render replaces.
            const previous = loadingTask.value;
            loadingTask.value = task;
            if (previous && previous !== task) await previous.destroy();
        } else {
            await task.destroy();
        }
    }
}

/** Full pass: pdfmake -> bytes -> canvases. */
async function render() {
    rendering.value = true;
    try {
        const blob = await toBlob(props.doc);
        lastBytes = new Uint8Array(await blob.arrayBuffer());
        await paint(lastBytes);
        error.value = '';
    } catch (err) {
        error.value = `Could not render the preview: ${err?.message || err}`;
        emit('error', error.value);
    } finally {
        rendering.value = false;
    }
}

/** Cheap pass: re-rasterise the bytes we already have (zoom, resize). */
async function repaint() {
    if (!lastBytes) return;
    rendering.value = true;
    try {
        await paint(lastBytes);
    } catch {
        /* a stale repaint is not worth surfacing */
    } finally {
        rendering.value = false;
    }
}

const debouncedRender = useDebounceFn(render, 400);
const debouncedRepaint = useDebounceFn(repaint, 120);

function stepZoom(delta) {
    const next = Math.max(0, Math.min(ZOOM_STEPS.length - 1, zoomIndex.value + delta));
    if (next === zoomIndex.value && !fitMode.value) return;
    zoomIndex.value = next;
    zoom.value = ZOOM_STEPS[next];
    fitMode.value = false;
    repaint();
}

function toggleFit() {
    fitMode.value = !fitMode.value;
    if (!fitMode.value) {
        zoomIndex.value = 3;
        zoom.value = 1;
    }
    repaint();
}

useResizeObserver(scroller, () => {
    if (fitMode.value) debouncedRepaint();
});

onMounted(render);
watch(() => props.doc, debouncedRender, { deep: true });
onBeforeUnmount(() => {
    generation++;
    loadingTask.value?.destroy();
});

defineExpose({ render, pageCount });
</script>
