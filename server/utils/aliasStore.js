/**
 * Memorable share aliases: speakable codes like swift-otter-lake that
 * resolve to a full share payload. Unlike #p= shares, the server CAN read
 * these (that's what makes the whole link speakable), so the payload is
 * encrypted at rest with a server-held key (SHARE_ALIAS_SECRET) — an
 * Upstash-side leak exposes nothing without it. Rotating or losing that
 * secret kills every live alias.
 *
 * Same sliding expiry as stored shares: every open refreshes the TTL.
 */
import crypto from 'node:crypto';
import { SHARE_WORDS } from './shareWords.js';
import { redisCommand, SHARE_TTL_SECONDS } from './shareStore.js';

const KEY_PREFIX = 'alias:';
const GCM_IV_BYTES = 12;
const GCM_TAG_BYTES = 16;

export const ALIAS_CODE_PATTERN = /^[a-z]{3,6}-[a-z]{3,6}-[a-z]{3,6}$/;

// 32-byte base64 secret; null when unset or malformed (endpoints 503).
export const getAliasSecret = () => {
    const raw = process.env.SHARE_ALIAS_SECRET;
    if (!raw) return null;
    const key = Buffer.from(raw, 'base64');
    return key.length === 32 ? key : null;
};

// Three random words: 1295^3 ≈ 2.17B codes.
export const generateAliasCode = () =>
    Array.from(
        { length: 3 },
        () => SHARE_WORDS[crypto.randomInt(SHARE_WORDS.length)]
    ).join('-');

export const encryptAtRest = (secret, json) => {
    const iv = crypto.randomBytes(GCM_IV_BYTES);
    const cipher = crypto.createCipheriv('aes-256-gcm', secret, iv);
    const ciphertext = Buffer.concat([
        cipher.update(json, 'utf8'),
        cipher.final(),
    ]);
    return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
        'base64url'
    );
};

// null for anything that doesn't decrypt cleanly (tamper, rotated secret).
export const decryptAtRest = (secret, blob) => {
    try {
        const packed = Buffer.from(blob, 'base64url');
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            secret,
            packed.subarray(0, GCM_IV_BYTES)
        );
        decipher.setAuthTag(
            packed.subarray(GCM_IV_BYTES, GCM_IV_BYTES + GCM_TAG_BYTES)
        );
        return Buffer.concat([
            decipher.update(packed.subarray(GCM_IV_BYTES + GCM_TAG_BYTES)),
            decipher.final(),
        ]).toString('utf8');
    } catch {
        return null;
    }
};

// NX: a colliding code must fail (false) rather than overwrite.
export const putAlias = async (config, code, blob) => {
    const result = await redisCommand(config, [
        'SET',
        KEY_PREFIX + code,
        blob,
        'EX',
        String(SHARE_TTL_SECONDS),
        'NX',
    ]);
    return result === 'OK';
};

// GETEX so every open pushes expiry out again.
export const getAlias = (config, code) =>
    redisCommand(config, [
        'GETEX',
        KEY_PREFIX + code,
        'EX',
        String(SHARE_TTL_SECONDS),
    ]);
