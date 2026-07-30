<template>
    <div class="space-y-5">
        <div>
            <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">Tailor to a job</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Paste a posting and see what it asks for that your resume doesn't say yet.
                Matched entirely in this tab — the job description is never uploaded.
            </p>
        </div>

        <!-- ------------------------------------------------ empty state -->
        <div v-if="!hasJob" class="space-y-3">
            <BaseTextarea
                :model-value="job.description"
                :rows="7"
                placeholder="Paste the full posting — responsibilities, requirements, the lot. The more you paste, the better the match."
                @update:model-value="update('description', $event)"
            />
            <ol class="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                <li v-for="(step, i) in HOW_IT_WORKS" :key="step" class="flex gap-2 items-start">
                    <span
                        class="flex justify-center items-center mt-px w-4 h-4 text-[10px] font-semibold rounded-full shrink-0 bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300"
                    >
                        {{ i + 1 }}
                    </span>
                    {{ step }}
                </li>
            </ol>
        </div>

        <!-- ---------------------------------------------------- matched -->
        <template v-else>
            <!-- Which job -->
            <div class="grid gap-2 sm:grid-cols-2">
                <BaseInput
                    :model-value="job.title"
                    label="Role"
                    placeholder="Senior Frontend Engineer"
                    @update:model-value="update('title', $event)"
                />
                <BaseInput
                    :model-value="job.company"
                    label="Company"
                    placeholder="Northwind Software"
                    @update:model-value="update('company', $event)"
                />
            </div>

            <!-- Result -->
            <div class="flex gap-4 items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <ResumeScoreRing :value="match.score" :size="56" />
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ verdict.title }}</p>
                    <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ verdict.blurb }}</p>
                </div>
                <BaseButton size="sm" variant="ghost" icon="mdi:refresh" @click="showEditor = !showEditor">
                    {{ showEditor ? 'Hide' : 'Edit' }} posting
                </BaseButton>
            </div>

            <div v-if="showEditor" class="space-y-2">
                <BaseTextarea
                    :model-value="job.description"
                    :rows="6"
                    @update:model-value="update('description', $event)"
                />
                <BaseButton size="sm" variant="ghost" icon="mdi:delete-outline" @click="clearJob">
                    Clear this posting
                </BaseButton>
            </div>

            <!-- Gaps -->
            <section v-if="match.missing.length">
                <div class="flex flex-wrap gap-2 justify-between items-baseline mb-1">
                    <h3 class="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                        Not in your resume
                    </h3>
                    <button
                        type="button"
                        class="text-[11px] font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        @click="copy(match.missing.map((t) => t.term).join(', '))"
                    >
                        Copy all
                    </button>
                </div>
                <p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
                    Add only what you can defend in an interview — the human who reads after the scanner
                    can tell. <strong class="font-medium">Add to skills</strong> files it under a group;
                    better still, work it into a bullet where you can show the result.
                </p>

                <ul class="space-y-1">
                    <li
                        v-for="term in match.missing"
                        :key="term.key"
                        class="flex gap-2 items-center py-1.5 px-2 rounded-lg group hover:bg-gray-50 dark:hover:bg-gray-800/60"
                    >
                        <span
                            class="w-1.5 h-1.5 rounded-full shrink-0"
                            :class="term.priority === 'must' ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'"
                            :title="term.priority === 'must' ? 'The posting calls this out as required' : 'Mentioned, but not flagged as required'"
                        />
                        <span class="flex-1 text-sm text-gray-800 truncate dark:text-gray-200">{{ term.term }}</span>
                        <BaseBadge v-if="term.priority === 'must'" variant="danger">required</BaseBadge>
                        <span class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                            <button
                                type="button"
                                class="px-1.5 py-0.5 text-[11px] font-medium rounded text-primary-700 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300"
                                @click="addKeyword(term.term)"
                            >
                                Add to skills
                            </button>
                            <BaseIconButton icon="mdi:content-copy" label="Copy term" @click="copy(term.term)" />
                        </span>
                    </li>
                </ul>
            </section>

            <!-- Covered -->
            <section v-if="match.matched.length">
                <h3 class="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                    Already covered ({{ match.matched.length }})
                </h3>
                <div class="flex flex-wrap gap-1">
                    <span
                        v-for="term in match.matched"
                        :key="term.key"
                        class="inline-flex gap-1 items-center px-2 py-0.5 text-xs text-green-800 bg-green-100 rounded dark:bg-green-900/40 dark:text-green-300"
                        :title="term.where ? `Found in ${term.where}` : undefined"
                    >
                        <Icon icon="mdi:check" class="w-3 h-3" />
                        {{ term.term }}
                        <span v-if="term.where" class="opacity-60">· {{ term.where }}</span>
                    </span>
                </div>
            </section>

            <p v-if="!match.terms.length" class="text-sm text-gray-500 dark:text-gray-400">
                Couldn't find much to match on — the posting may be too short. Paste the requirements section too.
            </p>
        </template>

        <!-- ------------------------------------------- optional local AI -->
        <section class="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
                type="button"
                class="flex gap-2 items-center w-full text-left group"
                :aria-expanded="showAi"
                @click="toggleAi"
            >
                <Icon
                    icon="mdi:chevron-right"
                    class="w-4 h-4 text-gray-400 transition-transform"
                    :class="showAi ? 'rotate-90' : ''"
                />
                <span class="flex-1">
                    <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Rewrite with a local AI model
                    </span>
                    <span class="block text-xs text-gray-500 dark:text-gray-400">
                        Optional. Uses a model already running on your machine — no account, no API bill.
                    </span>
                </span>
                <BaseBadge v-if="llm.status.value === 'connected'" variant="success">connected</BaseBadge>
            </button>

            <div v-if="showAi" class="pl-6 mt-3 space-y-3">
                <div class="flex flex-wrap gap-2 items-center text-xs">
                    <span class="w-2 h-2 rounded-full" :class="statusDot" />
                    <span class="text-gray-600 dark:text-gray-300">{{ statusText }}</span>
                    <BaseButton
                        size="sm"
                        variant="secondary"
                        icon="mdi:connection"
                        :loading="llm.status.value === 'connecting'"
                        @click="testConnection"
                    >
                        {{ llm.status.value === 'connected' ? 'Recheck' : 'Connect' }}
                    </BaseButton>
                    <button
                        type="button"
                        class="text-[11px] text-gray-500 underline hover:text-primary-600 dark:text-gray-400"
                        @click="showSettings = !showSettings"
                    >
                        {{ showSettings ? 'Hide settings' : 'Settings' }}
                    </button>
                </div>
                <p v-if="llm.statusMessage.value" class="text-xs text-amber-600 dark:text-amber-400">
                    {{ llm.statusMessage.value }}
                </p>

                <div v-if="showSettings" class="p-3 space-y-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <BaseSelect
                        label="Provider"
                        :options="PROVIDERS"
                        :model-value="llm.config.value.provider"
                        @update:model-value="llm.setProvider"
                    />
                    <BaseInput v-model="llm.config.value.baseUrl" label="Server URL" placeholder="http://localhost:11434" />
                    <BaseInput
                        v-if="llm.config.value.provider === 'openai'"
                        v-model="llm.config.value.apiKey"
                        label="API key (optional)"
                        type="password"
                        placeholder="usually blank for a local server"
                    />
                    <BaseSelect
                        v-if="llm.models.value.length"
                        v-model="llm.config.value.model"
                        label="Model"
                        :options="llm.models.value"
                    />
                    <p class="text-[11px] text-gray-400">
                        Ollama needs CORS enabled for browser access:
                        <code class="px-1 rounded bg-gray-100 dark:bg-gray-700">OLLAMA_ORIGINS=* ollama serve</code>
                    </p>
                </div>

                <div class="flex flex-wrap gap-2">
                    <BaseButton size="sm" icon="mdi:text-short" :disabled="!canRun" @click="runSummary">
                        Draft a summary
                    </BaseButton>
                    <BaseButton
                        size="sm"
                        variant="secondary"
                        icon="mdi:target-account"
                        :disabled="!canRun || !hasJob"
                        @click="runTailor"
                    >
                        Rewrite for this job
                    </BaseButton>
                    <BaseButton v-if="aiStreaming" size="sm" variant="danger" icon="mdi:stop" @click="stop">
                        Stop
                    </BaseButton>
                </div>

                <div v-if="aiOutput || aiStreaming">
                    <div
                        class="p-3 text-sm text-gray-800 whitespace-pre-wrap rounded-lg border border-gray-200 min-h-[3rem] dark:border-gray-700 dark:text-gray-200"
                    >
                        {{ aiOutput }}<span v-if="aiStreaming" class="text-gray-400 animate-pulse">▍</span>
                    </div>
                    <div v-if="aiOutput && !aiStreaming" class="flex gap-2 mt-2">
                        <BaseButton v-if="aiMode === 'summary'" size="sm" icon="mdi:check" @click="applySummary">
                            Use as my summary
                        </BaseButton>
                        <BaseButton size="sm" variant="secondary" icon="mdi:content-copy" @click="copy(aiOutput)">
                            Copy
                        </BaseButton>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup>
/**
 * Job targeting. Three changes over the first version, all of them about
 * removing things that were not about this job:
 *
 *  - The action-verb list and phrase library moved to the Review panel, next to
 *    the bullet criticism they answer. They were padding this panel and burying
 *    the match.
 *  - The local-model connection is collapsed and no longer probed on mount, so
 *    an optional integration stops greeting everyone with a red failure.
 *  - Gaps are a prioritised list, not a flat chip cloud: the posting's stated
 *    requirements are separated from things it merely mentioned, and every row
 *    carries an action.
 */
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import { useResume } from '~/composables/useResume';
import { useLlm } from '~/composables/useLlm';
import { useToast } from '~/composables/useToast';
import { matchJob, detectJobHeadline } from '~/utils/resume/jobMatch';
import { summaryMessages, tailorMessages } from '~/utils/resume/aiPrompts';
import ResumeScoreRing from '~/components/resume/ScoreRing.vue';

const props = defineProps({
    /** { description, title, company } for the resume being edited. */
    job: { type: Object, required: true },
});
const emit = defineEmits(['update:job']);

const resume = useResume();
const doc = resume.current;
const llm = useLlm();
const toast = useToast();

const PROVIDERS = [
    { label: 'Ollama', value: 'ollama' },
    { label: 'OpenAI-compatible (LM Studio, llama.cpp…)', value: 'openai' },
];

const HOW_IT_WORKS = [
    'Requirements are pulled out and ranked — the ones the posting calls for are marked.',
    'Each is checked against your resume, section by section.',
    'You get a list of gaps you can act on, and a match score that feeds the resume score.',
];

const showEditor = ref(false);
const showAi = ref(false);
const showSettings = ref(false);

const hasJob = computed(() => !!props.job.description.trim());
const match = computed(() =>
    hasJob.value
        ? matchJob(doc.value, props.job.description)
        : { score: 0, terms: [], matched: [], missing: [], criticalMissing: [] }
);

const verdict = computed(() => {
    const { score, criticalMissing } = match.value;
    if (criticalMissing.length) {
        return {
            title: `${score}% — ${criticalMissing.length} stated requirement${criticalMissing.length > 1 ? 's' : ''} unaddressed`,
            blurb: 'The red items below are ones the posting explicitly asks for.',
        };
    }
    if (score >= 75) return { title: `${score}% — strong match`, blurb: 'Nothing major missing. Send it.' };
    if (score >= 55) return { title: `${score}% — decent match`, blurb: 'Close the gaps below and it will read as a deliberate application.' };
    if (score >= 35) return { title: `${score}% — partial match`, blurb: 'Worth tailoring before you apply.' };
    return { title: `${score}% — weak match`, blurb: 'Either this posting is a stretch, or your resume undersells the overlap.' };
});

function update(field, value) {
    const next = { ...props.job, [field]: value };
    // Pasting a posting fills Role/Company from its headline — but only when
    // they are still blank, so a correction is never overwritten.
    if (field === 'description') {
        const guess = detectJobHeadline(value);
        if (!next.title.trim() && guess.title) next.title = guess.title;
        if (!next.company.trim() && guess.company) next.company = guess.company;
    }
    emit('update:job', next);
}

function clearJob() {
    emit('update:job', { description: '', title: '', company: '' });
    showEditor.value = false;
}

const TAILORED_GROUP = 'Additional skills';

/** File a term under a skills group, created on first use. */
function addKeyword(term) {
    let group = doc.value.skills.find((s) => s.name === TAILORED_GROUP);
    if (!group) {
        group = { name: TAILORED_GROUP, level: '', keywords: [] };
        doc.value.skills.push(group);
    }
    if (group.keywords.some((k) => k.toLowerCase() === term.toLowerCase())) {
        toast.error(`“${term}” is already in your skills.`);
        return;
    }
    group.keywords.push(term);
    resume.touch();
    toast.success(`Added “${term}” to ${TAILORED_GROUP}`);
}

// --- optional local model ---
// Deliberately not probed on mount: this is an opt-in extra, and a red
// "connection failed" on open made the whole panel look broken to the majority
// of people who do not run a local LLM.
function toggleAi() {
    showAi.value = !showAi.value;
    if (showAi.value && llm.status.value === 'idle') llm.refreshModels();
}

const statusDot = computed(
    () =>
        ({
            idle: 'bg-gray-300',
            connecting: 'bg-amber-400 animate-pulse',
            connected: 'bg-green-500',
            error: 'bg-red-500',
        })[llm.status.value]
);
const statusText = computed(
    () =>
        ({
            idle: 'Not connected',
            connecting: 'Looking for a local model…',
            connected: `Connected · ${llm.config.value.model}`,
            error: 'No local model found',
        })[llm.status.value]
);

const aiOutput = ref('');
const aiStreaming = ref(false);
const aiMode = ref('');
let aiAbort = null;

const canRun = computed(
    () => llm.status.value === 'connected' && !!llm.config.value.model && !aiStreaming.value
);

async function testConnection() {
    const ok = await llm.refreshModels();
    if (ok) toast.success('Connected to your local model.');
    else showSettings.value = true;
}

async function runAi(mode, messages) {
    aiMode.value = mode;
    aiOutput.value = '';
    aiStreaming.value = true;
    aiAbort = new AbortController();
    try {
        await llm.complete(messages, {
            signal: aiAbort.signal,
            onToken: (t) => (aiOutput.value += t),
        });
    } catch (err) {
        if (err?.name !== 'AbortError') toast.error(llm.failureHint(err));
    } finally {
        aiStreaming.value = false;
    }
}

const runSummary = () => runAi('summary', summaryMessages(doc.value));
const runTailor = () =>
    runAi(
        'tailor',
        tailorMessages(
            doc.value,
            props.job.description,
            match.value.missing.map((t) => t.term)
        )
    );
const stop = () => aiAbort?.abort();

function applySummary() {
    doc.value.basics.summary = aiOutput.value.trim();
    resume.touch();
    toast.success('Summary applied.');
}

async function copy(text) {
    try {
        await navigator.clipboard.writeText(text);
        toast.success('Copied');
    } catch {
        toast.error('Could not copy');
    }
}
</script>
