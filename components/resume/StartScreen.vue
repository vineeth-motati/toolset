<template>
    <div class="flex overflow-y-auto justify-center items-center p-6 h-full bg-gray-50/60 dark:bg-gray-900/30">
        <div class="w-full max-w-2xl">
            <div class="mb-6 text-center">
                <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                    Build a resume that gets read
                </h1>
                <p class="mx-auto mt-1.5 max-w-md text-sm text-gray-500 dark:text-gray-400">
                    Live preview, ATS scoring and PDF export — all running in this tab.
                    No account, no upload, no watermark, no export limit.
                </p>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
                <button
                    v-for="option in options"
                    :key="option.id"
                    type="button"
                    class="surface flex flex-col items-start p-5 h-full text-left transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:hover:border-primary-500/60"
                    @click="option.run"
                >
                    <span
                        class="flex justify-center items-center mb-3 w-10 h-10 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300"
                    >
                        <Icon :icon="option.icon" class="w-5 h-5" />
                    </span>
                    <span class="text-sm font-semibold text-gray-900 dark:text-white">
                        {{ option.title }}
                    </span>
                    <span class="mt-1 text-[13px] leading-snug text-gray-500 dark:text-gray-400">
                        {{ option.description }}
                    </span>
                </button>
            </div>

            <ul class="flex flex-wrap gap-x-5 gap-y-1.5 justify-center mt-6 text-xs text-gray-500 dark:text-gray-400">
                <li v-for="p in promises" :key="p" class="inline-flex gap-1 items-center">
                    <Icon icon="lucide:check" class="w-3.5 h-3.5 text-emerald-500" />
                    {{ p }}
                </li>
            </ul>

            <input
                ref="fileInput"
                type="file"
                accept="application/json,.json"
                class="hidden"
                @change="$emit('import', $event)"
            />
        </div>
    </div>
</template>

<script setup>
/**
 * First-run screen. Every paid builder opens with "upload, import, or start
 * fresh" — that choice is what stops a blank form from being the first thing a
 * visitor sees. The example route matters most: it shows the output quality
 * before asking for a single keystroke.
 */
import { ref } from 'vue';
import { Icon } from '@iconify/vue';

const emit = defineEmits(['scratch', 'sample', 'import']);

const fileInput = ref(null);

const options = [
    {
        id: 'scratch',
        icon: 'lucide:square-pen',
        title: 'Start from scratch',
        description: 'A blank resume with the standard sections ready to fill.',
        run: () => emit('scratch'),
    },
    {
        id: 'sample',
        icon: 'lucide:sparkles',
        title: 'Open the example',
        description: 'A finished resume you can edit into your own.',
        run: () => emit('sample'),
    },
    {
        id: 'import',
        icon: 'lucide:file-up',
        title: 'Import JSON Resume',
        description: 'Bring in a jsonresume.org file you already have.',
        run: () => fileInput.value?.click(),
    },
];

const promises = [
    'Never leaves your browser',
    'Unlimited PDF exports',
    'No sign-up',
    'ATS-safe templates',
    'Open JSON Resume format',
];
</script>
