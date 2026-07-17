/**
 * Tool catalog composable: lookup, categories, search — drives the index
 * page, navigation and command palette.
 */
import { describe, it, expect, vi } from 'vitest';
import { useTools, CATEGORY_LABELS } from '@/composables/useTools';
import toolsData from '@/data/tools.json';

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
