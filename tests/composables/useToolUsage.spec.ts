/**
 * Favorites + recents shown on the index page and command palette.
 */
import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { useToolUsage } from '@/composables/useToolUsage';

describe('recents', () => {
    it('records usage most-recent-first and dedupes by path', () => {
        const usage = useToolUsage();
        usage.recordUsage('/tools/notes');
        usage.recordUsage('/tools/kanban');
        usage.recordUsage('/tools/notes'); // revisit moves it back to front
        expect(usage.recents.value.map((r) => r.path)).toEqual([
            '/tools/notes',
            '/tools/kanban',
        ]);
        expect(usage.recents.value[0].lastUsed).toBeTypeOf('number');
    });

    it('caps the list at 6 entries', () => {
        const usage = useToolUsage();
        for (let i = 0; i < 9; i++) {
            usage.recordUsage(`/tools/tool-${i}`);
        }
        expect(usage.recents.value).toHaveLength(6);
        expect(usage.recents.value[0].path).toBe('/tools/tool-8');
    });

    it('persists to localStorage', async () => {
        useToolUsage().recordUsage('/tools/qr');
        // vueuse flushes the storage write on the next tick.
        await nextTick();
        expect(localStorage.getItem('tool-recents')).toContain('/tools/qr');
    });
});

describe('favorites', () => {
    it('toggles favorites on and off', () => {
        const usage = useToolUsage();
        expect(usage.isFavorite('/tools/qr')).toBe(false);
        usage.toggleFavorite('/tools/qr');
        expect(usage.isFavorite('/tools/qr')).toBe(true);
        usage.toggleFavorite('/tools/qr');
        expect(usage.isFavorite('/tools/qr')).toBe(false);
    });

    it('keeps multiple favorites independently', () => {
        const usage = useToolUsage();
        usage.toggleFavorite('/tools/a');
        usage.toggleFavorite('/tools/b');
        usage.toggleFavorite('/tools/a');
        expect(usage.favorites.value).toEqual(['/tools/b']);
    });
});
