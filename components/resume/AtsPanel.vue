<template>
    <div class="p-4 space-y-4">
        <BaseCard padding="sm">
            <h3 class="flex gap-2 items-center mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                <Icon icon="mdi:target" class="w-4 h-4" /> ATS keyword check
            </h3>
            <p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Paste a job description. Everything is compared in your browser — nothing is uploaded.
            </p>
            <BaseTextarea v-model="jobDescription" :rows="5" placeholder="Paste the job description here…" />

            <div v-if="jobDescription.trim()" class="mt-3 space-y-3">
                <div class="flex gap-3 items-center">
                    <div class="text-2xl font-bold" :class="scoreColor">{{ report.score }}%</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                        keyword coverage · {{ report.matched.length }} matched, {{ report.missing.length }} missing
                    </div>
                </div>

                <div v-if="report.missing.length">
                    <p class="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">Missing keywords</p>
                    <div class="flex flex-wrap gap-1">
                        <span v-for="kw in report.missing" :key="kw" class="px-2 py-0.5 text-xs text-amber-700 bg-amber-100 rounded dark:bg-amber-900/40 dark:text-amber-300">{{ kw }}</span>
                    </div>
                </div>

                <div v-if="report.matched.length">
                    <p class="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">Matched</p>
                    <div class="flex flex-wrap gap-1">
                        <span v-for="kw in report.matched" :key="kw" class="px-2 py-0.5 text-xs text-green-700 bg-green-100 rounded dark:bg-green-900/40 dark:text-green-300">{{ kw }}</span>
                    </div>
                </div>

                <ul v-if="report.warnings.length" class="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <li v-for="w in report.warnings" :key="w" class="flex gap-1.5 items-start">
                        <Icon icon="mdi:alert-outline" class="mt-0.5 w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{{ w }}</span>
                    </li>
                </ul>
            </div>
        </BaseCard>

        <BaseCard padding="sm">
            <h3 class="flex gap-2 items-center mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                <Icon icon="mdi:lightbulb-outline" class="w-4 h-4" /> Writing help
            </h3>
            <p class="mb-2 text-xs text-gray-500 dark:text-gray-400">Click to copy. Strong bullets start with an action verb.</p>
            <div class="flex flex-wrap gap-1 mb-3">
                <button v-for="v in verbs" :key="v" type="button" class="px-2 py-0.5 text-xs text-gray-700 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600" @click="copy(v)">{{ v }}</button>
            </div>
            <div v-for="(list, group) in phrases" :key="group" class="mb-2">
                <p class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ group }}</p>
                <button v-for="(p, i) in list" :key="i" type="button" class="block py-0.5 w-full text-xs text-left text-gray-600 hover:text-primary-600 dark:text-gray-400" @click="copy(p)">• {{ p }}</button>
            </div>
        </BaseCard>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import { useResume } from '~/composables/useResume';
import { useToast } from '~/composables/useToast';
import { analyze } from '~/utils/resume/ats';
import { ACTION_VERBS, PHRASE_LIBRARY } from '~/utils/resume/content';

const resume = useResume();
const doc = resume.current;
const toast = useToast();

const jobDescription = ref('');
const verbs = ACTION_VERBS;
const phrases = PHRASE_LIBRARY;

const report = computed(() =>
    jobDescription.value.trim()
        ? analyze(doc.value, jobDescription.value)
        : { score: 0, matched: [], missing: [], warnings: [] }
);

const scoreColor = computed(() => {
    const s = report.value.score;
    return s >= 70 ? 'text-green-600' : s >= 40 ? 'text-amber-600' : 'text-red-600';
});

async function copy(text) {
    try {
        await navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    } catch {
        toast.error('Could not copy');
    }
}
</script>
