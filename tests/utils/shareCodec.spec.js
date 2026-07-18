/**
 * Share payload codec: deflate + base64url with a versioned envelope.
 * Decoding handles hostile input — share links arrive from the outside
 * world, so anything malformed must come back null, never throw.
 */
import { describe, it, expect } from 'vitest';
import {
    encodeSharePayload,
    decodeSharePayload,
    encryptSharePayload,
    decryptSharePayload,
    SHARE_SCHEMA_VERSION,
} from '@/utils/shareCodec';

describe('encodeSharePayload / decodeSharePayload', () => {
    it('round-trips tool path and data', () => {
        const data = {
            kanban: [{ title: 'To Do', items: [{ id: 'a1', text: 'task' }] }],
        };
        const encoded = encodeSharePayload('/tools/kanban', data);
        const payload = decodeSharePayload(encoded);

        expect(payload).not.toBeNull();
        expect(payload.tool).toBe('/tools/kanban');
        expect(payload.v).toBe(SHARE_SCHEMA_VERSION);
        expect(payload.data).toEqual(data);
    });

    it('round-trips unicode content', () => {
        const data = { note: 'héllo wörld — 中文 🎉' };
        const payload = decodeSharePayload(
            encodeSharePayload('/tools/notes', data)
        );
        expect(payload.data).toEqual(data);
    });

    it('produces URL-safe output (no +, /, =, or spaces)', () => {
        // Binary-ish content exercises all base64 code points.
        const data = { blob: Array.from({ length: 500 }, (_, i) => i % 256) };
        const encoded = encodeSharePayload('/tools/qr', data);
        expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('compresses repetitive tool state well below raw JSON size', () => {
        const data = {
            rows: Array.from({ length: 200 }, (_, i) => ({
                name: `row-${i}`,
                status: 'pending',
                enabled: true,
            })),
        };
        const encoded = encodeSharePayload('/tools/sheets', data);
        expect(encoded.length).toBeLessThan(JSON.stringify(data).length / 4);
    });

    it('returns null for garbage input', () => {
        expect(decodeSharePayload('not-a-payload')).toBeNull();
        expect(decodeSharePayload('')).toBeNull();
        expect(decodeSharePayload('%%%')).toBeNull();
    });

    it('returns null for a tampered payload', () => {
        const encoded = encodeSharePayload('/tools/notes', { a: 1 });
        const tampered = encoded.slice(0, -4) + 'AAAA';
        expect(decodeSharePayload(tampered)).toBeNull();
    });

    it('returns null when the envelope shape is wrong', () => {
        // Valid compression, invalid envelopes.
        const { strToU8, deflateSync } = require('fflate');
        const encodeRaw = (obj) => {
            const bytes = deflateSync(strToU8(JSON.stringify(obj)));
            let binary = '';
            for (const b of bytes) binary += String.fromCharCode(b);
            return btoa(binary)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
        };
        expect(decodeSharePayload(encodeRaw({ data: {} }))).toBeNull(); // no tool
        expect(decodeSharePayload(encodeRaw({ tool: '/t', v: 99, data: {} }))).toBeNull(); // future version
        expect(decodeSharePayload(encodeRaw({ tool: '/t', v: 1, data: 'str' }))).toBeNull(); // non-object data
        expect(decodeSharePayload(encodeRaw({ tool: '/t', v: 1, data: [] }))).toBeNull(); // array data
        expect(decodeSharePayload(encodeRaw(null))).toBeNull();
    });
});

describe('encryptSharePayload / decryptSharePayload', () => {
    it('round-trips through encrypt → decrypt', async () => {
        const data = { text: 'secret note', items: [1, 2, 3] };
        const { ciphertext, key } = await encryptSharePayload(
            '/tools/notes',
            data
        );
        const payload = await decryptSharePayload(ciphertext, key);

        expect(payload).not.toBeNull();
        expect(payload.tool).toBe('/tools/notes');
        expect(payload.v).toBe(SHARE_SCHEMA_VERSION);
        expect(payload.data).toEqual(data);
    });

    it('produces URL-safe ciphertext and key', async () => {
        const { ciphertext, key } = await encryptSharePayload('/tools/qr', {
            blob: Array.from({ length: 500 }, (_, i) => i % 256),
        });
        expect(ciphertext).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(key).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('returns null with the wrong key', async () => {
        const { ciphertext } = await encryptSharePayload('/tools/notes', {
            a: 1,
        });
        const { key: otherKey } = await encryptSharePayload('/tools/notes', {
            b: 2,
        });
        expect(await decryptSharePayload(ciphertext, otherKey)).toBeNull();
    });

    it('returns null for tampered ciphertext (GCM auth failure)', async () => {
        const { ciphertext, key } = await encryptSharePayload('/tools/notes', {
            a: 1,
        });
        const flipped =
            (ciphertext[0] === 'A' ? 'B' : 'A') + ciphertext.slice(1);
        expect(await decryptSharePayload(flipped, key)).toBeNull();
    });

    it('returns null for garbage inputs without throwing', async () => {
        expect(await decryptSharePayload('%%%', 'key')).toBeNull();
        expect(await decryptSharePayload('', '')).toBeNull();
        expect(await decryptSharePayload(undefined, undefined)).toBeNull();
    });

    it('never reuses a key across shares', async () => {
        const a = await encryptSharePayload('/tools/notes', { a: 1 });
        const b = await encryptSharePayload('/tools/notes', { a: 1 });
        expect(a.key).not.toBe(b.key);
        expect(a.ciphertext).not.toBe(b.ciphertext);
    });
});
