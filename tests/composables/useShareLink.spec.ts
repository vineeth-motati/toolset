/**
 * Share-link composable: encodes tool state into a self-contained URL
 * fragment (#s=<payload>) — no server storage. Payloads too large for a
 * link are encrypted client-side and stored via /api/shares (#p=<id>.<key>).
 * Legacy ?share=<id> links are still fetched from the API. Loading always
 * confirms first, since it replaces the user's local work.
 * Nuxt auto-imports (useNuxtApp, useRoute, useRuntimeConfig) are stubbed.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useShareLink } from '@/composables/useShareLink';
import { encodeSharePayload, encryptSharePayload } from '@/utils/shareCodec';

// Incompressible data: deterministic pseudo-random strings, comfortably
// past the self-contained link cap once encoded.
const oversizedPayload = () => ({
    cells: Array.from({ length: 4000 }, (_, i) =>
        ((i * 2654435761) % 2 ** 32).toString(36)
    ),
});

const axios = { post: vi.fn(), get: vi.fn() };
let routeQuery: Record<string, string> = {};
let routePath = '/tools/notes';
let confirmSpy: ReturnType<typeof vi.fn>;
let replaceStateSpy: ReturnType<typeof vi.spyOn>;

const setHash = (hash: string) => {
    // happy-dom lets tests drive the address bar directly.
    window.location.hash = hash;
};

beforeEach(() => {
    routeQuery = {};
    routePath = '/tools/notes';
    setHash('');
    vi.stubGlobal('useNuxtApp', () => ({ $axios: axios }));
    vi.stubGlobal('useRoute', () => ({ query: routeQuery, path: routePath }));
    // getBaseUrl takes the server branch in tests (no import.meta.client).
    vi.stubGlobal('useRuntimeConfig', () => ({
        public: { baseUrl: 'https://tools.test' },
    }));
    confirmSpy = vi.fn(() => true);
    vi.stubGlobal('confirm', confirmSpy);
    replaceStateSpy = vi
        .spyOn(window.history, 'replaceState')
        .mockImplementation(() => {});
});

describe('generateShareLink', () => {
    it('builds a self-contained #s= link without any API call', async () => {
        const { generateShareLink } = useShareLink();
        const link = await generateShareLink('/tools/notes', { text: 'hi' });

        expect(link).toMatch(
            /^https:\/\/tools\.test\/tools\/notes#s=[A-Za-z0-9_-]+$/
        );
        expect(axios.post).not.toHaveBeenCalled();
    });

    it('falls back to an encrypted stored link when the payload is too large', async () => {
        axios.post.mockResolvedValue({ data: { id: 'stored123' } });
        const { generateShareLink } = useShareLink();
        const link = await generateShareLink(
            '/tools/sheets',
            oversizedPayload()
        );

        expect(link).toMatch(
            /^https:\/\/tools\.test\/tools\/sheets#p=stored123\.[A-Za-z0-9_-]+$/
        );
        // Only ciphertext leaves the browser — never the key or plaintext.
        expect(axios.post).toHaveBeenCalledWith('/api/shares', {
            ciphertext: expect.stringMatching(/^[A-Za-z0-9_-]+$/),
        });
    });

    it('returns null when storing an oversized payload fails', async () => {
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        axios.post.mockRejectedValue(new Error('503'));
        const { generateShareLink } = useShareLink();

        expect(
            await generateShareLink('/tools/sheets', oversizedPayload())
        ).toBeNull();
        expect(consoleError).toHaveBeenCalled();
    });
});

describe('getSharedData — fragment links', () => {
    it('decodes the fragment, confirms, strips the URL, and returns data', async () => {
        setHash('#s=' + encodeSharePayload('/tools/notes', { text: 'shared' }));
        const { getSharedData } = useShareLink();

        expect(await getSharedData()).toEqual({ text: 'shared' });
        expect(confirmSpy).toHaveBeenCalled();
        // history.state passes through unchanged (null in happy-dom).
        expect(replaceStateSpy).toHaveBeenCalledTimes(1);
        expect(replaceStateSpy.mock.calls[0].slice(1)).toEqual([
            '',
            '/tools/notes',
        ]);
        expect(axios.get).not.toHaveBeenCalled();
    });

    it('returns null when the user declines the confirmation', async () => {
        confirmSpy.mockReturnValue(false);
        setHash('#s=' + encodeSharePayload('/tools/notes', { text: 'x' }));
        const { getSharedData } = useShareLink();

        expect(await getSharedData()).toBeNull();
        expect(replaceStateSpy).not.toHaveBeenCalled();
    });

    it('ignores links belonging to a different tool', async () => {
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        setHash('#s=' + encodeSharePayload('/tools/kanban', { kanban: [] }));
        const { getSharedData } = useShareLink();

        expect(await getSharedData()).toBeNull();
        expect(confirmSpy).not.toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalled();
    });

    it('returns null for a corrupted fragment without prompting', async () => {
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        setHash('#s=corrupted-garbage');
        const { getSharedData } = useShareLink();

        expect(await getSharedData()).toBeNull();
        expect(confirmSpy).not.toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalled();
    });
});

describe('getSharedData — stored #p= links', () => {
    it('fetches the ciphertext, decrypts, confirms, strips, and returns data', async () => {
        const { ciphertext, key } = await encryptSharePayload('/tools/notes', {
            text: 'big shared thing',
        });
        axios.get.mockResolvedValue({ data: { ciphertext } });
        setHash(`#p=abc123.${key}`);
        const { getSharedData } = useShareLink();

        expect(await getSharedData()).toEqual({ text: 'big shared thing' });
        expect(axios.get).toHaveBeenCalledWith('/api/shares/abc123');
        expect(confirmSpy).toHaveBeenCalled();
        expect(replaceStateSpy).toHaveBeenCalledTimes(1);
    });

    it('returns null when the user declines the confirmation', async () => {
        const { ciphertext, key } = await encryptSharePayload('/tools/notes', {
            text: 'x',
        });
        axios.get.mockResolvedValue({ data: { ciphertext } });
        confirmSpy.mockReturnValue(false);
        setHash(`#p=abc123.${key}`);
        const { getSharedData } = useShareLink();

        expect(await getSharedData()).toBeNull();
        expect(replaceStateSpy).not.toHaveBeenCalled();
    });

    it('ignores stored links belonging to a different tool', async () => {
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        const { ciphertext, key } = await encryptSharePayload('/tools/kanban', {
            kanban: [],
        });
        axios.get.mockResolvedValue({ data: { ciphertext } });
        setHash(`#p=abc123.${key}`);
        const { getSharedData } = useShareLink();

        expect(await getSharedData()).toBeNull();
        expect(confirmSpy).not.toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalled();
    });

    it('returns null when the key is wrong, without prompting', async () => {
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        const { ciphertext } = await encryptSharePayload('/tools/notes', {
            text: 'x',
        });
        const { key: wrongKey } = await encryptSharePayload('/tools/notes', {
            text: 'y',
        });
        axios.get.mockResolvedValue({ data: { ciphertext } });
        setHash(`#p=abc123.${wrongKey}`);
        const { getSharedData } = useShareLink();

        expect(await getSharedData()).toBeNull();
        expect(confirmSpy).not.toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalled();
    });

    it('returns null when the stored share has expired (404)', async () => {
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        axios.get.mockRejectedValue(new Error('404'));
        setHash('#p=gone.somekey');
        const { getSharedData } = useShareLink();

        expect(await getSharedData()).toBeNull();
        expect(consoleError).toHaveBeenCalled();
    });

    it('returns null for a malformed fragment without calling the API', async () => {
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        setHash('#p=no-dot-in-here');
        const { getSharedData } = useShareLink();

        expect(await getSharedData()).toBeNull();
        expect(axios.get).not.toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalled();
    });
});

describe('createMemorableLink', () => {
    it('decodes a #s= link and trades it for a /s/<code> alias', async () => {
        axios.post.mockResolvedValue({ data: { code: 'swift-otter-lake' } });
        const url =
            'https://tools.test/tools/notes#s=' +
            encodeSharePayload('/tools/notes', { text: 'hi' });
        const { createMemorableLink } = useShareLink();

        expect(await createMemorableLink(url)).toBe(
            'https://tools.test/s/swift-otter-lake'
        );
        expect(axios.post).toHaveBeenCalledWith('/api/aliases', {
            tool: '/tools/notes',
            data: { text: 'hi' },
        });
    });

    it('fetches and decrypts a #p= link before aliasing it', async () => {
        const { ciphertext, key } = await encryptSharePayload('/tools/sheets', {
            rows: [1, 2],
        });
        axios.get.mockResolvedValue({ data: { ciphertext } });
        axios.post.mockResolvedValue({ data: { code: 'amber-canyon-drift' } });
        const { createMemorableLink } = useShareLink();

        const url = `https://tools.test/tools/sheets#p=abc123.${key}`;
        expect(await createMemorableLink(url)).toBe(
            'https://tools.test/s/amber-canyon-drift'
        );
        expect(axios.get).toHaveBeenCalledWith('/api/shares/abc123');
        expect(axios.post).toHaveBeenCalledWith('/api/aliases', {
            tool: '/tools/sheets',
            data: { rows: [1, 2] },
        });
    });

    it('returns null for a URL without a share fragment', async () => {
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        const { createMemorableLink } = useShareLink();

        expect(
            await createMemorableLink('https://tools.test/tools/notes')
        ).toBeNull();
        expect(axios.post).not.toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalled();
    });

    it('returns null when the alias API fails', async () => {
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        axios.post.mockRejectedValue(new Error('503'));
        const url =
            'https://tools.test/tools/notes#s=' +
            encodeSharePayload('/tools/notes', { text: 'hi' });
        const { createMemorableLink } = useShareLink();

        expect(await createMemorableLink(url)).toBeNull();
        expect(consoleError).toHaveBeenCalled();
    });
});

describe('getSharedData — memorable ?alias= links', () => {
    it('fetches the envelope, confirms, strips, and returns data', async () => {
        routeQuery.alias = 'swift-otter-lake';
        axios.get.mockResolvedValue({
            data: { tool: '/tools/notes', v: 1, data: { text: 'spoken' } },
        });
        const { getSharedData } = useShareLink();

        expect(await getSharedData()).toEqual({ text: 'spoken' });
        expect(axios.get).toHaveBeenCalledWith('/api/aliases/swift-otter-lake');
        expect(confirmSpy).toHaveBeenCalled();
        expect(replaceStateSpy).toHaveBeenCalledTimes(1);
    });

    it('ignores aliases belonging to a different tool', async () => {
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        routeQuery.alias = 'swift-otter-lake';
        axios.get.mockResolvedValue({
            data: { tool: '/tools/kanban', v: 1, data: {} },
        });
        const { getSharedData } = useShareLink();

        expect(await getSharedData()).toBeNull();
        expect(confirmSpy).not.toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalled();
    });

    it('returns null when the alias has expired (404)', async () => {
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        routeQuery.alias = 'gone-gone-gone';
        axios.get.mockRejectedValue(new Error('404'));
        const { getSharedData } = useShareLink();

        expect(await getSharedData()).toBeNull();
        expect(consoleError).toHaveBeenCalled();
    });

    it('returns null when the user declines the confirmation', async () => {
        routeQuery.alias = 'swift-otter-lake';
        axios.get.mockResolvedValue({
            data: { tool: '/tools/notes', v: 1, data: { text: 'x' } },
        });
        confirmSpy.mockReturnValue(false);
        const { getSharedData } = useShareLink();

        expect(await getSharedData()).toBeNull();
        expect(replaceStateSpy).not.toHaveBeenCalled();
    });
});

describe('getSharedData — legacy ?share= links', () => {
    it('fetches from the API, confirms, and returns the stored data', async () => {
        routeQuery.share = 'abc123';
        axios.get.mockResolvedValue({ data: { text: 'shared note' } });
        const { getSharedData } = useShareLink();

        expect(await getSharedData()).toEqual({ text: 'shared note' });
        expect(axios.get).toHaveBeenCalledWith('/api/share/abc123');
        expect(confirmSpy).toHaveBeenCalled();
    });

    it('returns null when the user declines the confirmation', async () => {
        routeQuery.share = 'abc123';
        axios.get.mockResolvedValue({ data: { text: 'shared note' } });
        confirmSpy.mockReturnValue(false);
        const { getSharedData } = useShareLink();

        expect(await getSharedData()).toBeNull();
    });

    it('returns null when the lookup fails', async () => {
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        routeQuery.share = 'gone';
        axios.get.mockRejectedValue(new Error('404'));
        const { getSharedData } = useShareLink();

        expect(await getSharedData()).toBeNull();
        expect(consoleError).toHaveBeenCalled();
    });
});

describe('getSharedData — no share present', () => {
    it('returns null without prompting or requesting', async () => {
        const { getSharedData } = useShareLink();
        expect(await getSharedData()).toBeNull();
        expect(confirmSpy).not.toHaveBeenCalled();
        expect(axios.get).not.toHaveBeenCalled();
    });
});
