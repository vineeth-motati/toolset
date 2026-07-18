import { getStoreConfig, MAX_STORED_SHARE_CHARS } from '../utils/shareStore.js';
import {
    getAliasSecret,
    generateAliasCode,
    encryptAtRest,
    putAlias,
} from '../utils/aliasStore.js';

/**
 * Creates a memorable share code (swift-otter-lake) for a tool payload.
 * These shares are server-readable by design — the tradeoff for a fully
 * speakable link — but are encrypted at rest before hitting Upstash.
 */
export default defineEventHandler(async (event) => {
    const config = getStoreConfig();
    const secret = getAliasSecret();
    if (!config || !secret) {
        throw createError({
            statusCode: 503,
            message: 'Memorable links are not configured',
        });
    }

    const body = await readBody(event);
    const { tool, data } = body ?? {};
    if (
        typeof tool !== 'string' ||
        !/^\/tools\/[a-z0-9/-]+$/.test(tool) ||
        typeof data !== 'object' ||
        data === null ||
        Array.isArray(data)
    ) {
        throw createError({
            statusCode: 400,
            message: 'Invalid share payload',
        });
    }

    const blob = encryptAtRest(secret, JSON.stringify({ tool, v: 1, data }));
    if (blob.length > MAX_STORED_SHARE_CHARS) {
        throw createError({
            statusCode: 413,
            message: 'Share payload too large',
        });
    }

    // putAlias is NX — collisions fail instead of overwriting. At 2.17B
    // codes a few retries make exhaustion a non-issue.
    for (let attempt = 0; attempt < 3; attempt++) {
        const code = generateAliasCode();
        if (await putAlias(config, code, blob)) {
            return { code };
        }
    }
    throw createError({ statusCode: 500, message: 'Could not store share' });
});
