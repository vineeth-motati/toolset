import { getBaseUrl } from '~/utils/baseUrl';
import {
    encodeSharePayload,
    decodeSharePayload,
    encryptSharePayload,
    decryptSharePayload,
    SHARE_FRAGMENT_PREFIX,
    STORED_FRAGMENT_PREFIX,
    MAX_SHARE_LINK_CHARS,
} from '~/utils/shareCodec';

/**
 * Share links are self-contained by default: the payload lives compressed
 * in the URL fragment (#s=, see utils/shareCodec.ts), so those links never
 * expire and no server storage is involved. Payloads too large to be their
 * own link are AES-GCM-encrypted in the browser and stored server-side
 * (#p=<id>.<key>); the key stays in the fragment, so the server only ever
 * sees ciphertext. Stored links expire after 90 days without being opened.
 * The old server-stored links (?share=<id>) are still readable so existing
 * links keep working, but no new ones are created.
 */
export const useShareLink = () => {
    const generateShareLink = async (
        toolPath: string,
        data: Record<string, any>
    ) => {
        try {
            const encoded = encodeSharePayload(toolPath, data);
            if (encoded.length <= MAX_SHARE_LINK_CHARS) {
                return `${getBaseUrl()}${toolPath}${SHARE_FRAGMENT_PREFIX}${encoded}`;
            }
            // Too big to be its own link — encrypt client-side and park the
            // ciphertext server-side. Only the id and key go into the URL.
            const { ciphertext, key } = await encryptSharePayload(
                toolPath,
                data
            );
            const { $axios } = useNuxtApp();
            const response = await $axios.post('/api/shares', { ciphertext });
            if (typeof response.data?.id !== 'string') {
                throw new Error('Share store returned no id');
            }
            return `${getBaseUrl()}${toolPath}${STORED_FRAGMENT_PREFIX}${response.data.id}.${key}`;
        } catch (err) {
            console.error('Error generating share link:', err);
            return null;
        }
    };

    // Loading shared state replaces whatever the user has locally — always
    // ask first (plan §1.2: "destructive load").
    const confirmSharedLoad = () =>
        window.confirm(
            'Load shared data? This will replace your current work in this tool.'
        );

    // Drop the payload from the address bar once handled, so a refresh
    // doesn't re-prompt and silently re-overwrite later edits.
    const stripShareFromUrl = (path: string) => {
        window.history.replaceState(window.history.state, '', path);
    };

    const getSharedData = async () => {
        if (typeof window === 'undefined') return null;
        const route = useRoute();

        // Self-contained links — the fragment never reaches the server.
        const hash = window.location.hash;
        if (hash.startsWith(SHARE_FRAGMENT_PREFIX)) {
            const payload = decodeSharePayload(
                hash.slice(SHARE_FRAGMENT_PREFIX.length)
            );
            if (!payload) {
                console.error('Share link payload is invalid or corrupted');
                return null;
            }
            if (payload.tool !== route.path) {
                console.error(
                    `Share link is for ${payload.tool}, not ${route.path} — ignoring`
                );
                return null;
            }
            if (!confirmSharedLoad()) return null;
            stripShareFromUrl(route.path);
            return payload.data;
        }

        // Stored links — fetch the ciphertext, decrypt with the key from
        // the fragment. A missing share (expired or never existed) and a
        // bad key both end up as null.
        if (hash.startsWith(STORED_FRAGMENT_PREFIX)) {
            const [id, key] = hash
                .slice(STORED_FRAGMENT_PREFIX.length)
                .split('.');
            if (!id || !key) {
                console.error('Share link is malformed');
                return null;
            }
            try {
                const { $axios } = useNuxtApp();
                const response = await $axios.get(`/api/shares/${id}`);
                const payload = await decryptSharePayload(
                    response.data?.ciphertext,
                    key
                );
                if (!payload) {
                    console.error('Share link payload is invalid or corrupted');
                    return null;
                }
                if (payload.tool !== route.path) {
                    console.error(
                        `Share link is for ${payload.tool}, not ${route.path} — ignoring`
                    );
                    return null;
                }
                if (!confirmSharedLoad()) return null;
                stripShareFromUrl(route.path);
                return payload.data;
            } catch (err) {
                console.error('Failed to fetch shared data:', err);
                return null;
            }
        }

        // Legacy server-stored links — read-only backward compatibility.
        const id = route.query.share;
        if (id) {
            try {
                const { $axios } = useNuxtApp();
                const response = await $axios.get(`/api/share/${id}`);
                if (!confirmSharedLoad()) return null;
                stripShareFromUrl(route.path);
                return response.data;
            } catch (err) {
                console.error('Failed to fetch shared data:', err);
                return null;
            }
        }

        return null;
    };

    return {
        generateShareLink,
        getSharedData,
    };
};
