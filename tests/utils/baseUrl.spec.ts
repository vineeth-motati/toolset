/**
 * getBaseUrl server branch (import.meta.client is falsy under Vitest).
 * The client branch is exercised in the browser build only.
 */
import { describe, it, expect, vi } from 'vitest';
import { getBaseUrl } from '@/utils/baseUrl';

describe('getBaseUrl (server)', () => {
    it('returns the configured public baseUrl', () => {
        vi.stubGlobal('useRuntimeConfig', () => ({
            public: { baseUrl: 'https://tools.test' },
        }));
        expect(getBaseUrl()).toBe('https://tools.test');
    });

    it('falls back to an empty string when unconfigured', () => {
        vi.stubGlobal('useRuntimeConfig', () => ({ public: { baseUrl: '' } }));
        expect(getBaseUrl()).toBe('');
    });
});
