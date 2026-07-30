<template>
    <div class="space-y-5">
        <!-- Headline -->
        <div class="flex gap-4 items-center">
            <ResumeScoreRing :value="score.total" :size="72" />
            <div class="min-w-0">
                <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {{ GRADE_COPY[score.grade].title }}
                </h2>
                <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                    {{ GRADE_COPY[score.grade].blurb }}
                </p>
            </div>
        </div>

        <!-- Category bars -->
        <div class="grid gap-2 sm:grid-cols-2">
            <div
                v-for="cat in score.categories"
                :key="cat.key"
                class="p-2.5 rounded-lg border border-gray-200 dark:border-gray-700"
            >
                <div class="flex justify-between items-baseline">
                    <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ cat.label }}</span>
                    <span class="text-xs font-semibold tabular-nums" :class="tone(cat.score)">
                        {{ cat.score }}
                    </span>
                </div>
                <div class="overflow-hidden mt-1.5 h-1 bg-gray-200 rounded-full dark:bg-gray-700">
                    <div
                        class="h-full rounded-full transition-all duration-500"
                        :class="bar(cat.score)"
                        :style="{ width: `${cat.score}%` }"
                    />
                </div>
            </div>
        </div>

        <!-- Stats strip -->
        <dl class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div v-for="s in stats" :key="s.label" class="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/60">
                <dt class="text-[11px] text-gray-500 dark:text-gray-400">{{ s.label }}</dt>
                <dd class="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                    {{ s.value }}
                </dd>
            </div>
        </dl>

        <!-- Issues -->
        <div>
            <div class="flex justify-between items-center mb-2">
                <h3 class="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                    What to fix
                </h3>
                <div class="flex gap-1">
                    <button
                        v-for="f in FILTERS"
                        :key="f.value"
                        type="button"
                        class="px-2 py-0.5 text-[11px] font-medium rounded-full transition-colors"
                        :class="filter === f.value
                            ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                            : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'"
                        @click="filter = f.value"
                    >
                        {{ f.label }}
                        <span v-if="counts[f.value]" class="tabular-nums opacity-70">{{ counts[f.value] }}</span>
                    </button>
                </div>
            </div>

            <div
                v-if="!visibleIssues.length"
                class="flex gap-2 items-center px-3 py-4 text-sm rounded-lg text-green-800 bg-green-50 dark:bg-green-900/20 dark:text-green-300"
            >
                <Icon icon="mdi:check-circle-outline" class="w-5 h-5 shrink-0" />
                <span>
                    {{ filter === 'all' ? 'Nothing flagged. This resume is ready to send.' : 'Nothing in this category.' }}
                </span>
            </div>

            <ul v-else class="space-y-1.5">
                <li
                    v-for="issue in visibleIssues"
                    :key="issue.id"
                    class="flex gap-2.5 items-start p-2.5 rounded-lg border transition-colors"
                    :class="severityBox(issue.severity)"
                >
                    <Icon :icon="severityIcon(issue.severity)" class="mt-0.5 w-4 h-4 shrink-0" :class="severityIconTone(issue.severity)" />
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ issue.message }}</p>
                        <p class="mt-0.5 text-xs text-gray-600 dark:text-gray-400">{{ issue.fix }}</p>
                    </div>
                    <button
                        v-if="issue.target"
                        type="button"
                        class="px-2 py-1 text-xs font-medium rounded transition-colors shrink-0 text-primary-700 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50"
                        @click="$emit('jump', issue.target)"
                    >
                        Fix
                    </button>
                </li>
            </ul>
        </div>

        <p class="flex gap-1.5 items-start text-[11px] text-gray-400">
            <Icon icon="mdi:shield-lock-outline" class="mt-px w-3.5 h-3.5 shrink-0" />
            Every check above runs in this browser tab. Nothing is uploaded, scored remotely, or stored on a server.
        </p>
    </div>
</template>

<script setup>
/**
 * The score breakdown. Modelled on Rezi's category read-out, with one addition
 * they don't offer: every issue carries the field it came from, so "Fix" jumps
 * straight to the input instead of leaving the user to hunt for it.
 */
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import ResumeScoreRing from '~/components/resume/ScoreRing.vue';

const props = defineProps({
    score: { type: Object, required: true },
});
defineEmits(['jump']);

const GRADE_COPY = {
    excellent: { title: 'Ready to send', blurb: 'Strong across the board. Tailor it per application and go.' },
    good: { title: 'Nearly there', blurb: 'Solid foundation — a few fixes below will sharpen it.' },
    fair: { title: 'Needs work', blurb: 'The bones are right. Work through the list below in order.' },
    poor: { title: 'Just getting started', blurb: 'Fill in the essentials first — the red items block everything else.' },
};

const FILTERS = [
    { label: 'All', value: 'all' },
    { label: 'Must fix', value: 'error' },
    { label: 'Improve', value: 'warning' },
    { label: 'Polish', value: 'tip' },
];

const filter = ref('all');

const counts = computed(() => ({
    all: props.score.issues.length,
    error: props.score.issues.filter((i) => i.severity === 'error').length,
    warning: props.score.issues.filter((i) => i.severity === 'warning').length,
    tip: props.score.issues.filter((i) => i.severity === 'tip').length,
}));

const visibleIssues = computed(() =>
    filter.value === 'all'
        ? props.score.issues
        : props.score.issues.filter((i) => i.severity === filter.value)
);

const stats = computed(() => {
    const s = props.score.stats;
    return [
        { label: 'Bullets', value: s.bullets },
        {
            label: 'Quantified',
            value: s.bullets ? `${Math.round((s.quantifiedBullets / s.bullets) * 100)}%` : '—',
        },
        {
            label: 'Verb-led',
            value: s.bullets ? `${Math.round((s.verbLedBullets / s.bullets) * 100)}%` : '—',
        },
        { label: 'Words', value: s.words },
    ];
});

const tone = (v) =>
    v >= 80 ? 'text-green-600 dark:text-green-400'
    : v >= 55 ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-600 dark:text-red-400';
const bar = (v) => (v >= 80 ? 'bg-green-500' : v >= 55 ? 'bg-amber-500' : 'bg-red-500');

const severityBox = (s) =>
    ({
        error: 'border-red-200 bg-red-50/60 dark:border-red-900/40 dark:bg-red-900/10',
        warning: 'border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-900/10',
        tip: 'border-gray-200 dark:border-gray-700',
    })[s];
const severityIcon = (s) =>
    ({
        error: 'mdi:alert-circle-outline',
        warning: 'mdi:alert-outline',
        tip: 'mdi:lightbulb-outline',
    })[s];
const severityIconTone = (s) =>
    ({
        error: 'text-red-500',
        warning: 'text-amber-500',
        tip: 'text-gray-400',
    })[s];
</script>
