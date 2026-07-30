<template>
    <div class="space-y-6">
        <section>
            <h2 class="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">Tailor to a job</h2>
            <p class="mb-3 text-xs text-gray-500 dark:text-gray-400">
                Paste the posting. Keywords are extracted and matched against your resume in this tab —
                the job description never leaves your browser.
            </p>

            <BaseTextarea
                :model-value="jobDescription"
                :rows="jobDescription ? 5 : 8"
                placeholder="Paste the full job description here — responsibilities, requirements, the lot."
                @update:model-value="$emit('update:jobDescription', $event)"
            />

            <div v-if="jobDescription.trim()" class="flex gap-2 items-center mt-2">
                <BaseButton size="sm" variant="ghost" icon="mdi:close" @click="$emit('update:jobDescription', '')">
                    Clear
                </BaseButton>
                <span class="text-[11px] text-gray-400">
                    Saved with this resume, so you can come back to it.
                </span>
            </div>
        </section>

        <!-- Match -->
        <section v-if="jobDescription.trim()">
            <div class="flex gap-4 items-center mb-3">
                <ResumeScoreRing :value="report.score" :size="56" />
                <div>
                    <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {{ matchCopy }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        {{ report.matched.length }} of
                        {{ report.matched.length + report.missing.length }} keywords present
                    </p>
                </div>
            </div>

            <div v-if="report.missing.length" class="mb-3">
                <div class="flex justify-between items-center mb-1.5">
                    <p class="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Missing — click any you genuinely have
                    </p>
                    <button
                        type="button"
                        class="text-[11px] font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        @click="copy(report.missing.join(', '))"
                    >
                        Copy all
                    </button>
                </div>
                <div class="flex flex-wrap gap-1">
                    <button
                        v-for="kw in report.missing"
                        :key="kw"
                        type="button"
                        class="px-2 py-0.5 text-xs rounded transition-colors text-amber-800 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60"
                        :title="`Add “${kw}” to your skills`"
                        @click="addKeyword(kw)"
                    >
                        + {{ kw }}
                    </button>
                </div>
                <p class="mt-1.5 text-[11px] text-gray-400">
                    Only add what you can defend in an interview. Keyword stuffing is obvious to the human who reads next.
                </p>
            </div>

            <div v-if="report.matched.length">
                <p class="mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">Already covered</p>
                <div class="flex flex-wrap gap-1">
                    <span
                        v-for="kw in report.matched"
                        :key="kw"
                        class="px-2 py-0.5 text-xs text-green-800 bg-green-100 rounded dark:bg-green-900/40 dark:text-green-300"
                    >
                        {{ kw }}
                    </span>
                </div>
            </div>
        </section>

        <!-- Local AI -->
        <section class="pt-5 border-t border-gray-200 dark:border-gray-700">
            <div class="flex flex-wrap gap-2 justify-between items-center mb-1">
                <h2 class="flex gap-2 items-center text-base font-semibold text-gray-900 dark:text-gray-100">
                    AI assistant
                    <BaseBadge variant="success">
                        <Icon icon="mdi:shield-lock-outline" class="mr-0.5 w-3 h-3" /> runs locally
                    </BaseBadge>
                </h2>
                <button
                    type="button"
                    class="inline-flex gap-1 items-center text-xs text-gray-500 hover:text-primary-600 dark:text-gray-400"
                    :aria-expanded="showSettings"
                    @click="showSettings = !showSettings"
                >
                    <Icon icon="mdi:cog-outline" class="w-4 h-4" />
                    {{ showSettings ? 'Hide' : 'Connection' }}
                </button>
            </div>
            <p class="mb-3 text-xs text-gray-500 dark:text-gray-400">
                Optional. Point it at a model already running on your machine — Ollama, LM Studio, llama.cpp.
                No account, no API bill, nothing uploaded.
            </p>

            <div class="flex gap-2 items-center mb-3 text-xs">
                <span class="w-2 h-2 rounded-full" :class="statusDot" />
                <span class="text-gray-600 dark:text-gray-300">{{ statusText }}</span>
                <span v-if="llm.statusMessage.value" class="text-amber-600 dark:text-amber-400">
                    — {{ llm.statusMessage.value }}
                </span>
            </div>

            <div
                v-if="showSettings"
                class="p-3 mb-3 space-y-3 rounded-lg border border-gray-200 dark:border-gray-700"
            >
                <BaseSelect
                    label="Provider"
                    :options="providerOptions"
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
                <div class="flex gap-2 items-end">
                    <BaseSelect
                        v-if="llm.models.value.length"
                        v-model="llm.config.value.model"
                        label="Model"
                        class="flex-1"
                        :options="llm.models.value"
                    />
                    <p v-else class="flex-1 text-xs text-gray-400">No models found yet — test the connection.</p>
                    <BaseButton
                        size="sm"
                        variant="secondary"
                        icon="mdi:connection"
                        :loading="llm.status.value === 'connecting'"
                        @click="testConnection"
                    >
                        Test
                    </BaseButton>
                </div>
                <p class="text-[11px] text-gray-400">
                    Ollama needs CORS enabled:
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
                    :disabled="!canRun || !jobDescription.trim()"
                    @click="runTailor"
                >
                    Rewrite for this job
                </BaseButton>
                <BaseButton v-if="aiStreaming" size="sm" variant="danger" icon="mdi:stop" @click="stop">
                    Stop
                </BaseButton>
            </div>
            <p v-if="!canRun && !aiStreaming" class="mt-2 text-xs text-gray-400">
                Connect a local model above to enable these.
            </p>

            <div v-if="aiOutput || aiStreaming" class="mt-3">
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
        </section>

        <!-- Writing help -->
        <section class="pt-5 border-t border-gray-200 dark:border-gray-700">
            <h2 class="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">Writing help</h2>
            <p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
                No model needed. Click anything to copy it.
            </p>
            <div class="flex flex-wrap gap-1 mb-3">
                <button
                    v-for="v in ACTION_VERBS"
                    :key="v"
                    type="button"
                    class="px-2 py-0.5 text-xs text-gray-700 bg-gray-100 rounded transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    @click="copy(v)"
                >
                    {{ v }}
                </button>
            </div>
            <details
                v-for="(list, group) in PHRASE_LIBRARY"
                :key="group"
                class="py-1.5 border-b border-gray-100 dark:border-gray-800"
            >
                <summary class="text-xs font-medium text-gray-600 cursor-pointer dark:text-gray-400">
                    {{ group }}
                </summary>
                <button
                    v-for="(p, i) in list"
                    :key="i"
                    type="button"
                    class="block py-0.5 w-full text-xs text-left text-gray-600 hover:text-primary-600 dark:text-gray-400"
                    @click="copy(p)"
                >
                    • {{ p }}
                </button>
            </details>
        </section>
    </div>
</template>

<script setup>
/**
 * Job targeting. Two changes over the old panel worth calling out: missing
 * keywords are clickable (one tap files them under a "Tailored for this role"
 * skill group — Rezi's approve-the-addition flow), and the job description is
 * persisted per resume by the parent, so returning to an application restores
 * its context.
 */
import { ref, computed, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { useResume } from '~/composables/useResume';
import { useLlm } from '~/composables/useLlm';
import { useToast } from '~/composables/useToast';
import { analyze } from '~/utils/resume/ats';
import { ACTION_VERBS, PHRASE_LIBRARY } from '~/utils/resume/content';
import { summaryMessages, tailorMessages } from '~/utils/resume/aiPrompts';
import ResumeScoreRing from '~/components/resume/ScoreRing.vue';

const props = defineProps({
    jobDescription: { type: String, default: '' },
});
defineEmits(['update:jobDescription']);

const resume = useResume();
const doc = resume.current;
const llm = useLlm();
const toast = useToast();

const providerOptions = [
    { label: 'Ollama', value: 'ollama' },
    { label: 'OpenAI-compatible (LM Studio, llama.cpp…)', value: 'openai' },
];

const report = computed(() =>
    props.jobDescription.trim()
        ? analyze(doc.value, props.jobDescription)
        : { score: 0, matched: [], missing: [], warnings: [] }
);

const matchCopy = computed(() => {
    const s = report.value.score;
    if (s >= 75) return 'Strong match';
    if (s >= 55) return 'Decent match — close the gaps below';
    if (s >= 35) return 'Partial match';
    return 'Weak match for this posting';
});

const TAILORED_GROUP = 'Tailored for this role';

/** File a missing keyword under a dedicated group, created on first use. */
function addKeyword(kw) {
    let group = doc.value.skills.find((s) => s.name === TAILORED_GROUP);
    if (!group) {
        group = { name: TAILORED_GROUP, level: '', keywords: [] };
        doc.value.skills.push(group);
    }
    if (!group.keywords.some((k) => k.toLowerCase() === kw.toLowerCase())) {
        group.keywords.push(kw);
    }
    resume.touch();
    toast.success(`Added “${kw}” to your skills`);
}

// --- LLM ---
const showSettings = ref(false);
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
            connecting: 'Connecting…',
            connected: `Connected · ${llm.config.value.model}`,
            error: 'Connection failed',
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
function runTailor() {
    if (!props.jobDescription.trim()) {
        toast.error('Paste a job description first.');
        return;
    }
    runAi('tailor', tailorMessages(doc.value, props.jobDescription, report.value.missing));
}
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

// Probe once so the status line reflects reality without the user asking.
onMounted(() => llm.refreshModels());
</script>
