<template>
    <div class="p-4 space-y-4">
        <!-- ================= Local AI Assistant ================= -->
        <BaseCard padding="sm">
            <div class="flex justify-between items-center mb-2">
                <h3 class="flex gap-2 items-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                    <Icon icon="mdi:robot-happy-outline" class="w-4 h-4" /> AI Assistant
                    <span class="inline-flex gap-1 items-center px-1.5 py-0.5 text-[10px] font-medium text-green-700 bg-green-100 rounded dark:bg-green-900/40 dark:text-green-300">
                        <Icon icon="mdi:shield-lock-outline" class="w-3 h-3" /> local
                    </span>
                </h3>
                <button type="button" class="inline-flex gap-1 items-center text-xs text-gray-500 hover:text-primary-600 dark:text-gray-400" @click="showSettings = !showSettings">
                    <Icon icon="mdi:cog-outline" class="w-4 h-4" /> Settings
                </button>
            </div>

            <!-- status line -->
            <div class="flex gap-2 items-center mb-2 text-xs">
                <span class="w-2 h-2 rounded-full" :class="statusDot" />
                <span class="text-gray-600 dark:text-gray-300">{{ statusText }}</span>
            </div>
            <p v-if="llm.statusMessage.value" class="mb-2 text-xs text-amber-600 dark:text-amber-400">
                {{ llm.statusMessage.value }}
            </p>

            <!-- connection settings -->
            <div v-if="showSettings" class="p-3 mb-3 space-y-3 rounded-lg border border-gray-100 dark:border-gray-700/60">
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
                    placeholder="usually blank for local servers"
                />
                <div class="flex gap-2 items-end">
                    <BaseSelect
                        v-if="llm.models.value.length"
                        v-model="llm.config.value.model"
                        label="Model"
                        class="flex-1"
                        :options="llm.models.value"
                    />
                    <p v-else class="flex-1 text-xs text-gray-400">No models loaded — test the connection.</p>
                    <BaseButton size="sm" variant="secondary" icon="mdi:connection" :loading="llm.status.value === 'connecting'" @click="testConnection">
                        Test
                    </BaseButton>
                </div>
                <p class="text-xs text-gray-400">
                    Runs against a model on your machine (Ollama, LM Studio, llama.cpp…). Nothing is uploaded.
                    Ollama needs CORS enabled: <code class="px-1 rounded bg-gray-100 dark:bg-gray-700">OLLAMA_ORIGINS=* ollama serve</code>.
                </p>
            </div>

            <!-- actions -->
            <div class="flex flex-wrap gap-2">
                <BaseButton size="sm" icon="mdi:text-short" :disabled="!canRun" @click="runSummary">
                    Generate summary
                </BaseButton>
                <BaseButton size="sm" variant="secondary" icon="mdi:target-account" :disabled="!canRun" @click="runTailor">
                    Tailor to job
                </BaseButton>
                <BaseButton v-if="aiStreaming" size="sm" variant="danger" icon="mdi:stop" @click="stop">Stop</BaseButton>
            </div>
            <p v-if="!canRun && !aiStreaming" class="mt-2 text-xs text-gray-400">
                Connect a model above to enable AI actions.
            </p>

            <!-- streaming output -->
            <div v-if="aiOutput || aiStreaming" class="mt-3">
                <div class="p-3 text-sm whitespace-pre-wrap rounded-lg border border-gray-100 min-h-[3rem] dark:border-gray-700/60 text-gray-800 dark:text-gray-200">
                    {{ aiOutput }}<span v-if="aiStreaming" class="text-gray-400 animate-pulse">▍</span>
                </div>
                <div v-if="aiOutput && !aiStreaming" class="flex gap-2 mt-2">
                    <BaseButton v-if="aiMode === 'summary'" size="sm" icon="mdi:check" @click="applySummary">
                        Use as summary
                    </BaseButton>
                    <BaseButton size="sm" variant="secondary" icon="mdi:content-copy" @click="copy(aiOutput)">Copy</BaseButton>
                </div>
            </div>
        </BaseCard>

        <!-- ================= ATS keyword check ================= -->
        <BaseCard padding="sm">
            <h3 class="flex gap-2 items-center mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                <Icon icon="mdi:target" class="w-4 h-4" /> ATS keyword check
            </h3>
            <p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Paste a job description. Compared in your browser — nothing uploaded. Also powers “Tailor to job” above.
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

        <!-- ================= Offline writing help ================= -->
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
import { ref, computed, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { useResume } from '~/composables/useResume';
import { useLlm } from '~/composables/useLlm';
import { useToast } from '~/composables/useToast';
import { analyze } from '~/utils/resume/ats';
import { ACTION_VERBS, PHRASE_LIBRARY } from '~/utils/resume/content';
import { summaryMessages, tailorMessages } from '~/utils/resume/aiPrompts';

const resume = useResume();
const doc = resume.current;
const llm = useLlm();
const toast = useToast();

const jobDescription = ref('');
const verbs = ACTION_VERBS;
const phrases = PHRASE_LIBRARY;
const providerOptions = [
    { label: 'Ollama', value: 'ollama' },
    { label: 'OpenAI-compatible (LM Studio, llama.cpp…)', value: 'openai' },
];

// --- ATS keyword report (instant, offline) ---
const report = computed(() =>
    jobDescription.value.trim()
        ? analyze(doc.value, jobDescription.value)
        : { score: 0, matched: [], missing: [], warnings: [] }
);
const scoreColor = computed(() => {
    const s = report.value.score;
    return s >= 70 ? 'text-green-600' : s >= 40 ? 'text-amber-600' : 'text-red-600';
});

// --- LLM connection UI ---
const showSettings = ref(false);
const statusDot = computed(() => ({
    idle: 'bg-gray-300',
    connecting: 'bg-amber-400 animate-pulse',
    connected: 'bg-green-500',
    error: 'bg-red-500',
}[llm.status.value]));
const statusText = computed(() => ({
    idle: 'Not connected',
    connecting: 'Connecting…',
    connected: `Connected · ${llm.config.value.model}`,
    error: 'Connection failed',
}[llm.status.value]));
const canRun = computed(() => llm.status.value === 'connected' && !!llm.config.value.model && !aiStreaming.value);

async function testConnection() {
    const ok = await llm.refreshModels();
    if (ok) toast.success('Connected to your local model.');
}

// --- AI actions ---
const aiOutput = ref('');
const aiStreaming = ref(false);
const aiMode = ref('');
let aiAbort = null;

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

function runSummary() {
    runAi('summary', summaryMessages(doc.value));
}
function runTailor() {
    if (!jobDescription.value.trim()) {
        toast.error('Paste a job description below first.');
        return;
    }
    runAi('tailor', tailorMessages(doc.value, jobDescription.value, report.value.missing));
}
function stop() {
    aiAbort?.abort();
}
function applySummary() {
    doc.value.basics.summary = aiOutput.value.trim();
    resume.touch();
    toast.success('Summary applied to your resume.');
}

async function copy(text) {
    try {
        await navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    } catch {
        toast.error('Could not copy');
    }
}

// Probe the local server once on open so the status reflects reality.
onMounted(() => {
    llm.refreshModels();
});
</script>
