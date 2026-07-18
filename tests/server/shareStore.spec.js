/**
 * Upstash-backed share store: framework-free util used by the /api/shares
 * endpoints. Redis's REST API is mocked at the fetch level — these tests
 * pin the exact commands sent, since NX (no overwrite) and GETEX (sliding
 * TTL) are behavioral guarantees, not implementation details.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import {
    getStoreConfig,
    putShare,
    getShare,
    SHARE_TTL_SECONDS,
} from '@/server/utils/shareStore.js';

const config = { url: 'https://redis.test', token: 'tok-123' };

const mockRedis = (result) => {
    const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ result }),
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
};

const sentCommand = (fetchMock) => JSON.parse(fetchMock.mock.calls[0][1].body);

describe('getStoreConfig', () => {
    afterEach(() => vi.unstubAllEnvs());

    const clearEnv = () => {
        for (const name of [
            'KV_REST_API_URL',
            'KV_REST_API_TOKEN',
            'UPSTASH_REDIS_REST_URL',
            'UPSTASH_REDIS_REST_TOKEN',
        ]) {
            vi.stubEnv(name, '');
        }
    };

    it('reads the Vercel marketplace env names', () => {
        clearEnv();
        vi.stubEnv('KV_REST_API_URL', 'https://kv.test');
        vi.stubEnv('KV_REST_API_TOKEN', 'kv-token');
        expect(getStoreConfig()).toEqual({
            url: 'https://kv.test',
            token: 'kv-token',
        });
    });

    it('falls back to the direct Upstash env names', () => {
        clearEnv();
        vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://up.test');
        vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'up-token');
        expect(getStoreConfig()).toEqual({
            url: 'https://up.test',
            token: 'up-token',
        });
    });

    it('returns null when the store is not configured', () => {
        clearEnv();
        expect(getStoreConfig()).toBeNull();
    });
});

describe('putShare', () => {
    it('SETs with a sliding TTL and NX, authenticated', async () => {
        const fetchMock = mockRedis('OK');
        expect(await putShare(config, 'abc', 'cipher')).toBe(true);

        expect(fetchMock).toHaveBeenCalledWith(
            'https://redis.test',
            expect.objectContaining({ method: 'POST' })
        );
        expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
            'Bearer tok-123'
        );
        expect(sentCommand(fetchMock)).toEqual([
            'SET',
            'share:abc',
            'cipher',
            'EX',
            String(SHARE_TTL_SECONDS),
            'NX',
        ]);
    });

    it('reports an id collision (NX miss) as false', async () => {
        mockRedis(null);
        expect(await putShare(config, 'abc', 'cipher')).toBe(false);
    });
});

describe('getShare', () => {
    it('GETEXes so every read refreshes the TTL', async () => {
        const fetchMock = mockRedis('stored-cipher');
        expect(await getShare(config, 'abc')).toBe('stored-cipher');
        expect(sentCommand(fetchMock)).toEqual([
            'GETEX',
            'share:abc',
            'EX',
            String(SHARE_TTL_SECONDS),
        ]);
    });

    it('returns null for a missing or expired share', async () => {
        mockRedis(null);
        expect(await getShare(config, 'gone')).toBeNull();
    });

    it('throws on an HTTP error from the store', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({ ok: false, status: 500 })
        );
        await expect(getShare(config, 'abc')).rejects.toThrow('HTTP 500');
    });

    it('throws on a Redis-level error reply', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ error: 'WRONGTYPE' }),
            })
        );
        await expect(getShare(config, 'abc')).rejects.toThrow('WRONGTYPE');
    });
});
