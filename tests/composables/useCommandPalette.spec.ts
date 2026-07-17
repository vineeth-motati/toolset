/**
 * ⌘K palette open-state. Uses Nuxt's useState — stubbed with a keyed
 * ref store to verify cross-instance sharing semantics.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref, type Ref } from 'vue';
import { useCommandPalette } from '@/composables/useCommandPalette';

beforeEach(() => {
    const states = new Map<string, Ref<unknown>>();
    vi.stubGlobal('useState', (key: string, init: () => unknown) => {
        if (!states.has(key)) states.set(key, ref(init()));
        return states.get(key);
    });
});

describe('useCommandPalette', () => {
    it('starts closed and toggles open/close', () => {
        const palette = useCommandPalette();
        expect(palette.isOpen.value).toBe(false);
        palette.open();
        expect(palette.isOpen.value).toBe(true);
        palette.close();
        expect(palette.isOpen.value).toBe(false);
    });

    it('shares open-state across consumers via the state key', () => {
        const navbar = useCommandPalette();
        const shortcut = useCommandPalette();
        shortcut.open();
        expect(navbar.isOpen.value).toBe(true);
    });
});
