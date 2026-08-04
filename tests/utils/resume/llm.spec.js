/**
 * Local-LLM client. No real server is contacted — fetch is injected and the
 * streaming body is faked, so these tests verify OUR request building and
 * stream parsing for both Ollama (NDJSON) and OpenAI-compatible (SSE).
 */
import { describe, it, expect, vi } from 'vitest';
import {
    endpoints,
    buildChatRequest,
    buildModelsRequest,
    extractModels,
    parseStreamLine,
    streamChat,
    listModels,
    defaultLlmConfig,
} from '@/utils/resume/llm';

const ollama = { provider: 'ollama', baseUrl: 'http://localhost:11434', model: 'llama3', apiKey: '' };
const openai = { provider: 'openai', baseUrl: 'http://localhost:1234', model: 'm', apiKey: 'secret' };

const enc = new TextEncoder();
const streamRes = (chunks, ok = true, status = 200) => {
    let i = 0;
    return {
        ok,
        status,
        body: {
            getReader: () => ({
                read: () =>
                    i < chunks.length
                        ? Promise.resolve({ done: false, value: enc.encode(chunks[i++]) })
                        : Promise.resolve({ done: true, value: undefined }),
            }),
        },
        text: () => Promise.resolve(chunks.join('')),
    };
};

describe('config + endpoints', () => {
    it('defaults to Ollama on localhost', () => {
        expect(defaultLlmConfig()).toMatchObject({ provider: 'ollama', baseUrl: 'http://localhost:11434' });
    });
    it('maps endpoints per provider and trims trailing slashes', () => {
        expect(endpoints({ ...ollama, baseUrl: 'http://localhost:11434/' })).toEqual({
            chat: 'http://localhost:11434/api/chat',
            models: 'http://localhost:11434/api/tags',
        });
        expect(endpoints(openai)).toEqual({
            chat: 'http://localhost:1234/v1/chat/completions',
            models: 'http://localhost:1234/v1/models',
        });
    });
});

describe('request builders', () => {
    it('builds an Ollama chat request (no auth, streaming body)', () => {
        const { url, init } = buildChatRequest(ollama, [{ role: 'user', content: 'hi' }]);
        expect(url).toBe('http://localhost:11434/api/chat');
        expect(init.method).toBe('POST');
        expect(init.headers.Authorization).toBeUndefined();
        const body = JSON.parse(init.body);
        expect(body).toMatchObject({ model: 'llama3', stream: true });
        expect(body.messages[0].content).toBe('hi');
    });
    it('adds a Bearer token for OpenAI-compatible servers with a key', () => {
        const { url, init } = buildChatRequest(openai, []);
        expect(url).toBe('http://localhost:1234/v1/chat/completions');
        expect(init.headers.Authorization).toBe('Bearer secret');
    });
    it('builds model-list requests', () => {
        expect(buildModelsRequest(ollama).url).toBe('http://localhost:11434/api/tags');
        expect(buildModelsRequest(openai).init.headers.Authorization).toBe('Bearer secret');
    });
});

describe('extractModels', () => {
    it('reads Ollama tags and OpenAI model lists', () => {
        expect(extractModels(ollama, { models: [{ name: 'a' }, { name: 'b' }] })).toEqual(['a', 'b']);
        expect(extractModels(openai, { data: [{ id: 'x' }, { id: 'y' }] })).toEqual(['x', 'y']);
        expect(extractModels(ollama, {})).toEqual([]);
    });
});

describe('parseStreamLine', () => {
    it('parses Ollama NDJSON', () => {
        expect(parseStreamLine('ollama', '{"message":{"content":"Hi"},"done":false}')).toEqual({ content: 'Hi', done: false });
        expect(parseStreamLine('ollama', '{"done":true}')).toEqual({ content: '', done: true });
        expect(parseStreamLine('ollama', '   ')).toBeNull();
        expect(parseStreamLine('ollama', '{bad json')).toBeNull();
    });
    it('parses OpenAI SSE', () => {
        expect(parseStreamLine('openai', 'data: {"choices":[{"delta":{"content":"Hi"}}]}')).toEqual({ content: 'Hi', done: false });
        expect(parseStreamLine('openai', 'data: [DONE]')).toEqual({ content: '', done: true });
        expect(parseStreamLine('openai', ': keep-alive')).toBeNull();
        expect(parseStreamLine('openai', '')).toBeNull();
    });
});

describe('streamChat', () => {
    it('accumulates Ollama tokens split across chunks and stops on done', async () => {
        const tokens = [];
        const full = await streamChat(ollama, [{ role: 'user', content: 'hi' }], {
            fetchImpl: () =>
                Promise.resolve(
                    streamRes([
                        '{"message":{"content":"Hel',
                        'lo"},"done":false}\n',
                        '{"message":{"content":" world"},"done":true}\n',
                        '{"message":{"content":" IGNORED"},"done":false}\n',
                    ])
                ),
            onToken: (t) => tokens.push(t),
        });
        expect(full).toBe('Hello world');
        expect(tokens.join('')).toBe('Hello world'); // stopped at done, ignored trailing
    });

    it('parses OpenAI SSE with [DONE]', async () => {
        const full = await streamChat(openai, [], {
            fetchImpl: () =>
                Promise.resolve(
                    streamRes([
                        'data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n',
                        'data: {"choices":[{"delta":{"content":" there"}}]}\n\n',
                        'data: [DONE]\n\n',
                    ])
                ),
        });
        expect(full).toBe('Hi there');
    });

    it('throws on a non-OK response, surfacing the status', async () => {
        await expect(
            streamChat(ollama, [], { fetchImpl: () => Promise.resolve(streamRes(['boom'], false, 500)) })
        ).rejects.toThrow(/500/);
    });

    it('refuses to run without a selected model', async () => {
        await expect(
            streamChat({ ...ollama, model: '' }, [], { fetchImpl: vi.fn() })
        ).rejects.toThrow(/model/i);
    });
});

describe('listModels', () => {
    it('lists Ollama models', async () => {
        const fetchImpl = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ models: [{ name: 'llama3' }] }) }));
        await expect(listModels(ollama, { fetchImpl })).resolves.toEqual(['llama3']);
        expect(fetchImpl).toHaveBeenCalledWith('http://localhost:11434/api/tags', expect.any(Object));
    });
    it('lists OpenAI models and throws on failure', async () => {
        await expect(
            listModels(openai, { fetchImpl: () => Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [{ id: 'x' }] }) }) })
        ).resolves.toEqual(['x']);
        await expect(
            listModels(ollama, { fetchImpl: () => Promise.resolve({ ok: false, status: 404 }) })
        ).rejects.toThrow(/404/);
    });
});
