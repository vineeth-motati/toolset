/**
 * Share-link composable: POSTs tool state to /api/share and builds the
 * shareable URL; reads shared state back from ?share=<id>.
 * Nuxt auto-imports (useNuxtApp, useRoute, useRuntimeConfig) are stubbed.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useShareLink } from '@/composables/useShareLink';

const axios = { post: vi.fn(), get: vi.fn() };
let routeQuery: Record<string, string> = {};

beforeEach(() => {
    routeQuery = {};
    vi.stubGlobal('useNuxtApp', () => ({ $axios: axios }));
    vi.stubGlobal('useRoute', () => ({ query: routeQuery }));
    // getBaseUrl takes the server branch in tests (no import.meta.client).
    vi.stubGlobal('useRuntimeConfig', () => ({
        public: { baseUrl: 'https://tools.test' },
    }));
});

describe('generateShareLink', () => {
    it('posts the payload and returns the tool URL with the share id', async () => {
        axios.post.mockResolvedValue({ data: { id: 'abc123' } });
        const { generateShareLink } = useShareLink();
        const link = await generateShareLink('/tools/notes', { text: 'hi' });
        expect(axios.post).toHaveBeenCalledWith('/api/share', {
            data: { text: 'hi' },
        });
        expect(link).toBe('https://tools.test/tools/notes?share=abc123');
    });

    it('returns null when the API call fails', async () => {
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        axios.post.mockRejectedValue(new Error('db down'));
        const { generateShareLink } = useShareLink();
        expect(await generateShareLink('/tools/notes', {})).toBeNull();
        expect(consoleError).toHaveBeenCalled();
    });
});

describe('getSharedData', () => {
    it('fetches shared state when ?share= is present', async () => {
        routeQuery.share = 'abc123';
        axios.get.mockResolvedValue({ data: { text: 'shared note' } });
        const { getSharedData } = useShareLink();
        expect(await getSharedData()).toEqual({ text: 'shared note' });
        expect(axios.get).toHaveBeenCalledWith('/api/share/abc123');
    });

    it('returns null without a share param (no request made)', async () => {
        const { getSharedData } = useShareLink();
        expect(await getSharedData()).toBeNull();
        expect(axios.get).not.toHaveBeenCalled();
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
