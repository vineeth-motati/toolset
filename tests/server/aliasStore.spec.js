/**
 * Memorable alias store: speakable word-triplet codes plus AES-256-GCM
 * at-rest encryption with a server-held secret. The Redis commands are
 * pinned like shareStore's — NX and GETEX are behavioral guarantees.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import crypto from 'node:crypto';
import {
    getAliasSecret,
    generateAliasCode,
    encryptAtRest,
    decryptAtRest,
    putAlias,
    getAlias,
    ALIAS_CODE_PATTERN,
} from '@/server/utils/aliasStore.js';
import { SHARE_TTL_SECONDS } from '@/server/utils/shareStore.js';
import { SHARE_WORDS } from '@/server/utils/shareWords.js';

const config = { url: 'https://redis.test', token: 'tok-123' };
const secret = crypto.randomBytes(32);

const mockRedis = (result) => {
    const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ result }),
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
};

describe('generateAliasCode', () => {
    it('builds three hyphenated words from the vendored list', () => {
        for (let i = 0; i < 50; i++) {
            const code = generateAliasCode();
            expect(code).toMatch(ALIAS_CODE_PATTERN);
            for (const word of code.split('-')) {
                expect(SHARE_WORDS).toContain(word);
            }
        }
    });

    it('produces different codes across draws', () => {
        const codes = new Set(
            Array.from({ length: 20 }, () => generateAliasCode())
        );
        expect(codes.size).toBeGreaterThan(1);
    });
});

describe('encryptAtRest / decryptAtRest', () => {
    it('round-trips an envelope', () => {
        const json = JSON.stringify({ tool: '/tools/notes', v: 1, data: {} });
        expect(decryptAtRest(secret, encryptAtRest(secret, json))).toBe(json);
    });

    it('produces URL-safe blobs and never reuses an IV', () => {
        const a = encryptAtRest(secret, 'same');
        const b = encryptAtRest(secret, 'same');
        expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(a).not.toBe(b);
    });

    it('returns null with the wrong secret', () => {
        const blob = encryptAtRest(secret, 'payload');
        expect(decryptAtRest(crypto.randomBytes(32), blob)).toBeNull();
    });

    it('returns null for tampered or garbage blobs', () => {
        const blob = encryptAtRest(secret, 'payload');
        const flipped = (blob[0] === 'A' ? 'B' : 'A') + blob.slice(1);
        expect(decryptAtRest(secret, flipped)).toBeNull();
        expect(decryptAtRest(secret, '%%%')).toBeNull();
        expect(decryptAtRest(secret, '')).toBeNull();
    });
});

describe('getAliasSecret', () => {
    afterEach(() => vi.unstubAllEnvs());

    it('decodes a 32-byte base64 secret', () => {
        vi.stubEnv('SHARE_ALIAS_SECRET', secret.toString('base64'));
        expect(getAliasSecret()).toEqual(secret);
    });

    it('rejects missing or wrong-size secrets', () => {
        vi.stubEnv('SHARE_ALIAS_SECRET', '');
        expect(getAliasSecret()).toBeNull();
        vi.stubEnv('SHARE_ALIAS_SECRET', 'dG9vLXNob3J0');
        expect(getAliasSecret()).toBeNull();
    });
});

describe('putAlias / getAlias', () => {
    it('SETs under alias: with sliding TTL and NX', async () => {
        const fetchMock = mockRedis('OK');
        expect(await putAlias(config, 'swift-otter-lake', 'blob')).toBe(true);
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual([
            'SET',
            'alias:swift-otter-lake',
            'blob',
            'EX',
            String(SHARE_TTL_SECONDS),
            'NX',
        ]);
    });

    it('reports a code collision (NX miss) as false', async () => {
        mockRedis(null);
        expect(await putAlias(config, 'swift-otter-lake', 'blob')).toBe(false);
    });

    it('GETEXes so every open refreshes the TTL', async () => {
        const fetchMock = mockRedis('blob');
        expect(await getAlias(config, 'swift-otter-lake')).toBe('blob');
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual([
            'GETEX',
            'alias:swift-otter-lake',
            'EX',
            String(SHARE_TTL_SECONDS),
        ]);
    });
});
