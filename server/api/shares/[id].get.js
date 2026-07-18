import { getStoreConfig, getShare } from '../../utils/shareStore.js';

/**
 * Returns the stored ciphertext for a share id and refreshes its sliding
 * TTL. Decryption happens in the recipient's browser — the key is in the
 * URL fragment and never reaches this endpoint.
 */
export default defineEventHandler(async (event) => {
    const config = getStoreConfig();
    if (!config) {
        throw createError({
            statusCode: 503,
            message: 'Share storage is not configured',
        });
    }

    const { id } = event.context.params;
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
        throw createError({ statusCode: 400, message: 'Invalid share id' });
    }

    const ciphertext = await getShare(config, id);
    if (!ciphertext) {
        throw createError({ statusCode: 404, message: 'Not Found' });
    }
    return { ciphertext };
});
