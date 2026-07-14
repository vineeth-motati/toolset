import type { Tool } from '@/composables/useTools';

// Per-tool SEO driven by tools.json. Called from ToolLayout's setup so every
// tool page gets unique title/description/canonical/OG + JSON-LD for free.
export function useToolMeta(tool: Tool | undefined) {
    if (!tool) return;

    const baseUrl = useRuntimeConfig().public.baseUrl;
    const url = `${baseUrl}${tool.path}`;
    const title = tool.seo?.title || tool.name;
    const description = tool.seo?.description || tool.description;

    useSeoMeta({
        title: `${title} · Tools-Set`,
        description,
        ogTitle: title,
        ogDescription: description,
        ogType: 'website',
        ogUrl: url,
        ogSiteName: 'Tools-Set',
        twitterCard: 'summary',
        twitterTitle: title,
        twitterDescription: description,
    });

    useHead({
        link: [{ rel: 'canonical', href: url }],
        script: [
            {
                type: 'application/ld+json',
                innerHTML: JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'WebApplication',
                    name: tool.name,
                    description,
                    url,
                    applicationCategory: 'UtilityApplication',
                    operatingSystem: 'Any',
                    offers: { '@type': 'Offer', price: '0' },
                }),
            },
        ],
    });
}
