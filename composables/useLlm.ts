/**
 * Local-LLM connection state for the resume Assist tab. Persists the connection
 * config (provider / base URL / model / optional key) to localStorage and wraps
 * the pure client in utils/resume/llm.ts. Singleton so settings are shared.
 *
 * Everything talks to a model on the user's own machine — nothing is sent to a
 * third-party server.
 */
import { ref } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import {
    defaultLlmConfig,
    listModels,
    streamChat,
    PROVIDER_DEFAULT_URL,
} from '~/utils/resume/llm';
import type { ChatMessage, LlmConfig, LlmProvider } from '~/utils/resume/llm';

const STORAGE_KEY = 'resume-llm';

let state: ReturnType<typeof createState> | null = null;

function createState() {
    const config = useLocalStorage<LlmConfig>(STORAGE_KEY, defaultLlmConfig(), {
        // Merge so new fields appear for configs saved by older builds.
        mergeDefaults: true,
    });
    const models = ref<string[]>([]);
    const status = ref<'idle' | 'connecting' | 'connected' | 'error'>('idle');
    const statusMessage = ref('');

    // Friendly hint for the most common failure (browser can't reach the server).
    const failureHint = (err: unknown): string => {
        const msg = err instanceof Error ? err.message : String(err);
        if (/failed to fetch|networkerror|load failed/i.test(msg)) {
            return config.value.provider === 'ollama'
                ? "Couldn't reach Ollama. Is it running? For browser access, start it with CORS enabled: OLLAMA_ORIGINS=* ollama serve"
                : "Couldn't reach the server. Check it's running and the base URL is correct.";
        }
        if (/does not support (chat|generate|completion)|is an embedding|embedding model/i.test(msg)) {
            return 'That model can’t generate text (it looks like an embedding model). Install a chat model — e.g. `ollama pull llama3.2` — then pick it above.';
        }
        return msg;
    };

    const setProvider = (provider: LlmProvider) => {
        const wasDefault =
            !config.value.baseUrl ||
            Object.values(PROVIDER_DEFAULT_URL).includes(config.value.baseUrl);
        config.value.provider = provider;
        if (wasDefault) config.value.baseUrl = PROVIDER_DEFAULT_URL[provider];
        models.value = [];
        status.value = 'idle';
        statusMessage.value = '';
    };

    const refreshModels = async () => {
        status.value = 'connecting';
        statusMessage.value = '';
        try {
            const list = await listModels(config.value);
            models.value = list;
            if (list.length && !list.includes(config.value.model)) {
                config.value.model = list[0];
            }
            status.value = list.length ? 'connected' : 'error';
            statusMessage.value = list.length
                ? ''
                : 'Connected, but no models are installed. Try `ollama pull llama3.2`.';
        } catch (err) {
            status.value = 'error';
            statusMessage.value = failureHint(err);
            models.value = [];
        }
        return status.value === 'connected';
    };

    const complete = (
        messages: ChatMessage[],
        opts: { onToken?: (c: string) => void; signal?: AbortSignal } = {}
    ) => streamChat(config.value, messages, opts);

    return {
        config,
        models,
        status,
        statusMessage,
        setProvider,
        refreshModels,
        complete,
        failureHint,
    };
}

export function useLlm() {
    if (!state) state = createState();
    return state;
}
