import tools from '../../data/tools.json';

export default defineEventHandler((event) => {
    const baseUrl = useRuntimeConfig().public.baseUrl;
    const paths = ['/', ...tools.map((t: { path: string }) => t.path)];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
    .map((p) => `    <url><loc>${baseUrl}${p}</loc></url>`)
    .join('\n')}
</urlset>`;

    setHeader(event, 'content-type', 'application/xml');
    return xml;
});
