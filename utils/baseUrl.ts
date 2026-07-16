export const getBaseUrl = (): string => {
    // In the browser, the current origin is always correct — the configured
    // baseUrl defaults to the production domain, which would send dev /
    // self-hosted traffic (and share links) to production.
    if (import.meta.client) {
        const { protocol, host } = window.location;
        return `${protocol}//${host}`;
    }

    const config = useRuntimeConfig();
    if (config.public.baseUrl) {
        return config.public.baseUrl;
    }

    // Default fallback for server-side
    return '';
};
