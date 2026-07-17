/**
 * Dark-mode composable. Runs its client branch by faking Nuxt's
 * process.client flag; happy-dom supplies document + localStorage.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { nextTick } from 'vue';
import { useTheme } from '@/composables/useTheme';

beforeEach(() => {
    process.client = true;
    document.documentElement.classList.remove('dark');
});

afterEach(() => {
    delete process.client;
});

describe('useTheme', () => {
    it('adopts the pre-hydration DOM state on first visit', async () => {
        document.documentElement.classList.add('dark');
        const { isDark } = useTheme();
        expect(isDark.value).toBe(true);
        // Class watch + storage write flush on the next tick.
        await nextTick();
        expect(localStorage.getItem('dark-theme')).toBe('true');
    });

    it('toggles the .dark class and persists as "true"/"false" strings', async () => {
        const { isDark, toggleTheme } = useTheme();
        expect(isDark.value).toBe(false);

        toggleTheme();
        await nextTick();
        expect(isDark.value).toBe(true);
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(localStorage.getItem('dark-theme')).toBe('true');

        toggleTheme();
        await nextTick();
        expect(isDark.value).toBe(false);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
        expect(localStorage.getItem('dark-theme')).toBe('false');
    });

    it('reads a persisted preference through the custom serializer', () => {
        localStorage.setItem('dark-theme', 'true');
        const { isDark } = useTheme();
        expect(isDark.value).toBe(true);
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
});
