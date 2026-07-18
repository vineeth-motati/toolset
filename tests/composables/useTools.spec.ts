/**
 * Tool catalog composable: lookup, categories, search — drives the index
 * page, navigation and command palette.
 */
import { describe, it, expect, vi } from 'vitest';
import { useTools, CATEGORY_LABELS } from '@/composables/useTools';
import toolsData from '@/data/tools.json';
import converterConfigs from '@/config/converters';
import { getLocalConverter } from '@/utils/localConverters';

const tools = useTools();

describe('byPath / currentTool', () => {
    it('finds a tool by exact path', () => {
        expect(tools.byPath('/tools/notes')?.name).toBe('Notes');
        expect(tools.byPath('/nope')).toBeUndefined();
    });

    it('resolves the current tool from the route (Nuxt auto-import stubbed)', () => {
        vi.stubGlobal('useRoute', () => ({ path: '/tools/kanban' }));
        expect(tools.currentTool()?.name).toBe('Kanban Board');
    });
});

describe('popular', () => {
    it('returns only tools flagged popular', () => {
        const popular = tools.popular();
        expect(popular.length).toBeGreaterThan(0);
        expect(popular.every((t) => t.popular)).toBe(true);
    });
});

describe('categories', () => {
    it('buckets every tool exactly once with a human label', () => {
        const categories = tools.categories();
        const bucketed = categories.flatMap((c) => c.items);
        expect(bucketed).toHaveLength(toolsData.length);
        for (const category of categories) {
            expect(category.label).toBe(CATEGORY_LABELS[category.key]);
            expect(category.items.length).toBeGreaterThan(0);
        }
    });
});

describe('search', () => {
    it('matches names case-insensitively', () => {
        expect(tools.search('KANBAN')[0].path).toBe('/tools/kanban');
    });

    it('matches keywords and descriptions', () => {
        const byKeyword = tools.search('drag and drop');
        expect(byKeyword.map((t) => t.path)).toContain('/tools/kanban');
    });

    it('returns nothing for a blank query', () => {
        expect(tools.search('   ')).toEqual([]);
    });

    it('every tool is findable by its own name — no dead search entries', () => {
        for (const tool of tools.all) {
            const hits = tools.search(tool.name);
            expect(
                hits.map((t) => t.path),
                `search("${tool.name}") should find ${tool.path}`
            ).toContain(tool.path);
        }
    });
});

describe('converter integration — the unified search index', () => {
    it('exposes every converter from config/converters.js', () => {
        expect(tools.converters).toHaveLength(converterConfigs.length);
    });

    it('finds converters by name from any search box', () => {
        expect(tools.search('pdf to word').map((t) => t.path)).toContain(
            '/tools/convert/pdf-to-word'
        );
        expect(tools.search('MP4 to MP3').map((t) => t.path)).toContain(
            '/tools/convert/mp4-to-mp3'
        );
    });

    it('every converter is findable by its own title — no dead entries', () => {
        for (const c of converterConfigs) {
            expect(
                tools.search(c.title).map((t) => t.path),
                `search("${c.title}") should find ${c.path}`
            ).toContain(c.path);
        }
    });

    it('ranks top-level tools ahead of converters', () => {
        const results = tools.search('json');
        const firstConverter = results.findIndex(
            (t) => t.kind === 'converter'
        );
        const lastTool = results.map((t) => t.kind !== 'converter').lastIndexOf(true);
        expect(firstConverter).toBeGreaterThan(-1);
        expect(lastTool).toBeLessThan(firstConverter);
    });

    it('byPath resolves converter paths', () => {
        expect(tools.byPath('/tools/convert/csv-to-json')?.kind).toBe(
            'converter'
        );
    });

    it('apiOnly agrees with the local-converter registry for every converter', () => {
        for (const c of converterConfigs) {
            expect(
                tools.byPath(c.path)?.apiOnly,
                `${c.path} apiOnly flag`
            ).toBe(!getLocalConverter(c.path));
        }
        // Spot-check both directions so a registry-wide failure can't
        // trivially satisfy the loop above.
        expect(tools.byPath('/tools/convert/pdf-to-word')?.apiOnly).toBe(true);
        expect(tools.byPath('/tools/convert/csv-to-json')?.apiOnly).toBe(
            false
        );
    });

    it('keeps converters out of the home grid (all/categories stay tools.json-only)', () => {
        expect(tools.all).toHaveLength(toolsData.length);
        const bucketed = tools.categories().flatMap((c) => c.items);
        expect(bucketed.every((t) => t.kind !== 'converter')).toBe(true);
    });
});

describe('categories — fallback label for an unmapped category', () => {
    it('falls back to the raw category key when CATEGORY_LABELS has no entry', async () => {
        // tools.json today only ever uses categories with a configured
        // label; mock the data source to exercise the defensive fallback
        // that protects against a future category added without one.
        vi.resetModules();
        vi.doMock('@/data/tools.json', () => ({
            default: [
                {
                    name: 'Mystery Tool',
                    path: '/tools/mystery',
                    icon: 'mdi:help',
                    description: 'A tool in an unlabeled category',
                    category: 'mystery',
                    keywords: ['mystery'],
                    layout: 'default',
                    popular: false,
                    seo: { title: 'Mystery Tool', description: 'desc' },
                },
            ],
        }));

        const { useTools: useFreshTools } = await import(
            '@/composables/useTools'
        );
        const categories = useFreshTools().categories();

        expect(categories).toHaveLength(1);
        expect(categories[0].key).toBe('mystery');
        expect(categories[0].label).toBe('mystery');

        vi.doUnmock('@/data/tools.json');
        vi.resetModules();
    });
});
