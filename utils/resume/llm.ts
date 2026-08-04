/**
 * Minimal local-LLM client. Talks to a model running on the user's own machine
 * — Ollama (native `/api/*`) or any OpenAI-compatible server (`/v1/*`, e.g.
 * LM Studio, llama.cpp, LocalAI, Jan). Everything is a request-builder + a
 * streaming parser so the logic is pure and unit-testable (fetch is injected).
 *
 * Privacy: requests go straight from the browser to localhost — no third party.
 */

export type LlmProvider = 'ollama' | 'openai';

export interface LlmConfig {
    provider: LlmProvider;
    baseUrl: string;
    model: string;
    apiKey: string; // usually blank for local servers
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export const PROVIDER_DEFAULT_URL: Record<LlmProvider, string> = {
    ollama: 'http://localhost:11434',
    openai: 'http://localhost:1234', // LM Studio's default; server exposes /v1
};

export function defaultLlmConfig(): LlmConfig {
    return { provider: 'ollama', baseUrl: PROVIDER_DEFAULT_URL.ollama, model: '', apiKey: '' };
}

const trimSlash = (s: string) => (s || '').replace(/\/+$/, '');

export function endpoints(config: LlmConfig): { chat: string; models: string } {
    const base = trimSlash(config.baseUrl);
    return config.provider === 'openai'
        ? { chat: `${base}/v1/chat/completions`, models: `${base}/v1/models` }
        : { chat: `${base}/api/chat`, models: `${base}/api/tags` };
}

function authHeaders(config: LlmConfig): Record<string, string> {
    return config.provider === 'openai' && config.apiKey
        ? { Authorization: `Bearer ${config.apiKey}` }
        : {};
}

export function buildChatRequest(config: LlmConfig, messages: ChatMessage[]) {
    return {
        url: endpoints(config).chat,
        init: {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders(config) },
            body: JSON.stringify({ model: config.model, messages, stream: true }),
        },
    };
}

export function buildModelsRequest(config: LlmConfig) {
    return { url: endpoints(config).models, init: { method: 'GET', headers: authHeaders(config) } };
}

export function extractModels(config: LlmConfig, json: any): string[] {
    if (config.provider === 'openai') {
        return (json?.data ?? []).map((m: any) => m?.id).filter(Boolean);
    }
    return (json?.models ?? []).map((m: any) => m?.name).filter(Boolean);
}

/**
 * Parse one line of a streaming chat response. Handles Ollama NDJSON
 * (`{"message":{"content":"…"},"done":false}`) and OpenAI SSE
 * (`data: {"choices":[{"delta":{"content":"…"}}]}` / `data: [DONE]`).
 * Returns null for blank/unparseable lines so partial chunks are skipped.
 */
export function parseStreamLine(
    provider: LlmProvider,
    line: string
): { content: string; done: boolean } | null {
    const raw = line.trim();
    if (!raw) return null;

    if (provider === 'openai') {
        if (!raw.startsWith('data:')) return null;
        const payload = raw.slice(5).trim();
        if (payload === '[DONE]') return { content: '', done: true };
        try {
            const obj = JSON.parse(payload);
            return { content: obj?.choices?.[0]?.delta?.content ?? '', done: false };
        } catch {
            return null;
        }
    }

    try {
        const obj = JSON.parse(raw);
        return { content: obj?.message?.content ?? '', done: !!obj?.done };
    } catch {
        return null;
    }
}

type FetchLike = (url: string, init?: any) => Promise<any>;

export interface StreamOptions {
    onToken?: (chunk: string) => void;
    signal?: AbortSignal;
    fetchImpl?: FetchLike;
}

/** Stream a chat completion, returning the full text and firing onToken per chunk. */
export async function streamChat(
    config: LlmConfig,
    messages: ChatMessage[],
    { onToken, signal, fetchImpl = fetch as FetchLike }: StreamOptions = {}
): Promise<string> {
    if (!config.model) throw new Error('No model selected.');
    const { url, init } = buildChatRequest(config, messages);
    const res = await fetchImpl(url, { ...init, signal });
    if (!res.ok) {
        const detail = typeof res.text === 'function' ? await res.text().catch(() => '') : '';
        throw new Error(`Model server returned ${res.status}. ${String(detail).slice(0, 200)}`.trim());
    }

    const reader = res.body?.getReader?.();
    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';

    const consume = (line: string): boolean => {
        const parsed = parseStreamLine(config.provider, line);
        if (!parsed) return false;
        if (parsed.content) {
            full += parsed.content;
            onToken?.(parsed.content);
        }
        return parsed.done;
    };

    if (!reader) {
        // Server didn't stream — parse the whole body line-by-line.
        const text = typeof res.text === 'function' ? await res.text() : '';
        for (const line of text.split('\n')) if (consume(line)) break;
        return full;
    }

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
            if (consume(line)) return full;
        }
    }
    if (buffer) consume(buffer);
    return full;
}

export async function listModels(
    config: LlmConfig,
    { fetchImpl = fetch as FetchLike }: { fetchImpl?: FetchLike } = {}
): Promise<string[]> {
    const { url, init } = buildModelsRequest(config);
    const res = await fetchImpl(url, init);
    if (!res.ok) throw new Error(`Could not reach the model server (HTTP ${res.status}).`);
    return extractModels(config, await res.json());
}
