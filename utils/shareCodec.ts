/**
 * Share-link codec. Two link shapes share the same versioned envelope
 * ({ tool, v, data }, deflate-compressed with fflate):
 *
 *  - #s=<payload>   Self-contained: the compressed envelope IS the link.
 *                   No server, no database, no expiry. Default shape.
 *  - #p=<id>.<key>  Stored: for payloads too large to be their own link.
 *                   The envelope is AES-GCM-encrypted *in the browser* and
 *                   parked server-side under <id>; <key> lives only in the
 *                   fragment, so the server and the store see ciphertext
 *                   they cannot read.
 *
 * Either way the fragment never reaches any server — browsers don't send
 * it — which is what makes both shapes private.
 */
import { strToU8, strFromU8, deflateSync, inflateSync } from 'fflate';

export interface SharePayload {
    tool: string;
    v: number;
    data: Record<string, any>;
}

export const SHARE_SCHEMA_VERSION = 1;

// Fragment names: /tools/kanban#s=<payload> and /tools/kanban#p=<id>.<key>.
export const SHARE_FRAGMENT_PREFIX = '#s=';
export const STORED_FRAGMENT_PREFIX = '#p=';

// Very long URLs survive browsers fine but get truncated by chat/email
// clients; payloads that compress past this cap can't be shared as links.
export const MAX_SHARE_LINK_CHARS = 16_000;

const toBase64Url = (bytes: Uint8Array): string => {
    let binary = '';
    const CHUNK = 0x8000; // String.fromCharCode arg-count limit
    for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

const fromBase64Url = (encoded: string): Uint8Array => {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
};

export const encodeSharePayload = (
    tool: string,
    data: Record<string, any>
): string => {
    const json = JSON.stringify({ tool, v: SHARE_SCHEMA_VERSION, data });
    return toBase64Url(deflateSync(strToU8(json)));
};

// Shared by both link shapes: anything that isn't a valid, well-formed
// envelope comes back null — share links arrive from the outside world
// and are never trusted.
const parseEnvelope = (json: string): SharePayload | null => {
    const payload = JSON.parse(json);
    if (
        !payload ||
        typeof payload.tool !== 'string' ||
        payload.v !== SHARE_SCHEMA_VERSION ||
        typeof payload.data !== 'object' ||
        payload.data === null ||
        Array.isArray(payload.data)
    ) {
        return null;
    }
    return payload as SharePayload;
};

export const decodeSharePayload = (encoded: string): SharePayload | null => {
    try {
        return parseEnvelope(strFromU8(inflateSync(fromBase64Url(encoded))));
    } catch {
        return null;
    }
};

// --- Stored (#p=) links: client-side encryption ---------------------------
// AES-GCM is authenticated, so a tampered or wrongly-keyed ciphertext fails
// decryption outright instead of producing garbage data.

const GCM_IV_BYTES = 12;

export interface EncryptedShare {
    ciphertext: string; // base64url(iv ‖ ciphertext)
    key: string; // base64url(raw AES-256 key) — belongs in the fragment only
}

export const encryptSharePayload = async (
    tool: string,
    data: Record<string, any>
): Promise<EncryptedShare> => {
    const json = JSON.stringify({ tool, v: SHARE_SCHEMA_VERSION, data });
    const compressed = deflateSync(strToU8(json));

    const cryptoKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt']
    );
    const iv = crypto.getRandomValues(new Uint8Array(GCM_IV_BYTES));
    const encrypted = new Uint8Array(
        await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, compressed)
    );

    const packed = new Uint8Array(iv.length + encrypted.length);
    packed.set(iv);
    packed.set(encrypted, iv.length);
    const rawKey = new Uint8Array(await crypto.subtle.exportKey('raw', cryptoKey));

    return { ciphertext: toBase64Url(packed), key: toBase64Url(rawKey) };
};

export const decryptSharePayload = async (
    ciphertext: string,
    key: string
): Promise<SharePayload | null> => {
    try {
        const packed = fromBase64Url(ciphertext);
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            fromBase64Url(key),
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );
        const compressed = new Uint8Array(
            await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: packed.subarray(0, GCM_IV_BYTES) },
                cryptoKey,
                packed.subarray(GCM_IV_BYTES)
            )
        );
        return parseEnvelope(strFromU8(inflateSync(compressed)));
    } catch {
        return null;
    }
};
