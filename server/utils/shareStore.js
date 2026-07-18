/**
 * Stored share payloads: client-side-encrypted blobs parked in Upstash
 * Redis via its REST API, so oversized share links can stay short. The
 * AES key never arrives here — it lives in the URL fragment — so this
 * store only ever holds ciphertext it cannot read.
 *
 * Expiry is sliding: every read refreshes the TTL, so a link dies only
 * after SHARE_TTL_SECONDS without being opened.
 */

export const SHARE_TTL_SECONDS = 90 * 24 * 60 * 60;

// Upstash free-tier requests cap at 1MB; base64url ciphertext at this
// length is ~750KB binary, far past any realistic tool state.
export const MAX_STORED_SHARE_CHARS = 1_000_000;

const KEY_PREFIX = 'share:';

// Vercel's Upstash marketplace integration injects KV_*; a direct
// Upstash setup uses UPSTASH_*. Accept either.
export const getStoreConfig = () => {
    const url =
        process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token =
        process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    return url && token ? { url, token } : null;
};

// Exported for reuse by aliasStore.js — one REST client, two key spaces.
export const redisCommand = async (config, cmd) => {
    const response = await fetch(config.url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${config.token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(cmd),
    });
    if (!response.ok) {
        throw new Error(`Share store error: HTTP ${response.status}`);
    }
    const { result, error } = await response.json();
    if (error) {
        throw new Error(`Share store error: ${error}`);
    }
    return result;
};

// NX: a colliding id must fail (false) rather than overwrite someone
// else's share.
export const putShare = async (config, id, ciphertext) => {
    const result = await redisCommand(config, [
        'SET',
        KEY_PREFIX + id,
        ciphertext,
        'EX',
        String(SHARE_TTL_SECONDS),
        'NX',
    ]);
    return result === 'OK';
};

// GETEX (not GET) so every open pushes expiry out again.
export const getShare = (config, id) =>
    redisCommand(config, [
        'GETEX',
        KEY_PREFIX + id,
        'EX',
        String(SHARE_TTL_SECONDS),
    ]);
