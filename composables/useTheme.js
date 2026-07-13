import { useLocalStorage } from '@vueuse/core';
import { computed, watch } from 'vue';

// The pre-hydration script in nuxt.config.ts applies the .dark class before
// first paint (localStorage value, else system preference). This composable
// only tracks state and user toggles from then on.
export function useTheme() {
    // Explicit serializer: multiple useTheme() instances sync through
    // storage events, and the default serializer would hand later
    // instances the raw string "true"/"false" instead of a boolean.
    const isDarkTheme = useLocalStorage('dark-theme', null, {
        serializer: {
            read: (v) => v === 'true',
            write: (v) => String(v),
        },
    });

    if (process.client) {
        // First visit: adopt whatever the pre-hydration script decided.
        if (isDarkTheme.value === null) {
            isDarkTheme.value =
                document.documentElement.classList.contains('dark');
        }

        watch(
            isDarkTheme,
            (value) => {
                document.documentElement.classList.toggle(
                    'dark',
                    value === true
                );
            },
            { immediate: true }
        );
    }

    const isDark = computed(() => isDarkTheme.value === true);

    const toggleTheme = () => {
        isDarkTheme.value = !isDark.value;
    };

    return {
        isDark,
        toggleTheme,
    };
}
