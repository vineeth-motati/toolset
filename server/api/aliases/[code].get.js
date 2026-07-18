import { getStoreConfig } from '../../utils/shareStore.js';
import {
    getAliasSecret,
    decryptAtRest,
    getAlias,
    ALIAS_CODE_PATTERN,
} from '../../utils/aliasStore.js';

/**
 * Resolves a memorable share code to its payload envelope {tool, v, data}
 * and refreshes the sliding TTL. Missing, expired, and undecryptable
 * (rotated secret) all look like 404 — a probing client learns nothing.
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

    const { code } = event.context.params;
    if (!ALIAS_CODE_PATTERN.test(code)) {
        throw createError({ statusCode: 400, message: 'Invalid share code' });
    }

    const blob = await getAlias(config, code);
    const json = blob && decryptAtRest(secret, blob);
    if (!json) {
        throw createError({ statusCode: 404, message: 'Not Found' });
    }
    return JSON.parse(json);
});
