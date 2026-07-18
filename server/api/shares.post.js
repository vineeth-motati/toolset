import { nanoid } from 'nanoid';
import {
    getStoreConfig,
    putShare,
    MAX_STORED_SHARE_CHARS,
} from '../utils/shareStore.js';

/**
 * Stores a client-side-encrypted share payload and returns its id. The
 * decryption key never reaches this endpoint — see utils/shareCodec.ts.
 */
export default defineEventHandler(async (event) => {
    const config = getStoreConfig();
    if (!config) {
        throw createError({
            statusCode: 503,
            message: 'Share storage is not configured',
        });
    }

    const body = await readBody(event);
    const ciphertext = body?.ciphertext;
    if (typeof ciphertext !== 'string' || !/^[A-Za-z0-9_-]+$/.test(ciphertext)) {
        throw createError({ statusCode: 400, message: 'Invalid share payload' });
    }
    if (ciphertext.length > MAX_STORED_SHARE_CHARS) {
        throw createError({
            statusCode: 413,
            message: 'Share payload too large',
        });
    }

    // putShare is NX — an id collision fails instead of overwriting, so
    // retry once with a fresh id (with 16 nanoid chars this is theoretical).
    for (let attempt = 0; attempt < 2; attempt++) {
        const id = nanoid(16);
        if (await putShare(config, id, ciphertext)) {
            return { id };
        }
    }
    throw createError({ statusCode: 500, message: 'Could not store share' });
});
