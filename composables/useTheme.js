import { useLocalStorage } from '@vueuse/core';
import { computed, watch } from 'vue';

export function useTheme() {
    // Store theme preference in localStorage with null as initial value to detect first visit
    const isDarkTheme = useLocalStorage('dark-theme', null);

    // Check if user prefers dark mode at system level
    const prefersDark = () => {
        if (process.client) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    };

    // Apply theme to document
    const applyTheme = () => {
        if (!process.client) return;

        if (isDarkTheme.value === true) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Initialize theme from system preference if not set yet
    const initTheme = () => {
        if (!process.client) return;

        // First visit - use system preference
        if (isDarkTheme.value === null) {
            isDarkTheme.value = prefersDark();
        }

        // Apply current theme
        applyTheme();

        // Listen for system preference changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (mediaQuery?.addEventListener) {
            mediaQuery.addEventListener('change', (e) => {
                // Only update if user hasn't set a preference
                if (isDarkTheme.value === null) {
                    isDarkTheme.value = e.matches;
                }
            });
        }
    };

    // Toggle theme with explicit true/false values
    const toggleTheme = () => {
        isDarkTheme.value = !isDarkTheme.value;
        applyTheme();
    };

    // Watch for changes and apply them
    if (process.client) {
        watch(
            isDarkTheme,
            () => {
                applyTheme();
            },
            { immediate: true }
        );
    }

    // Expose computed property for components to use
    const isDark = computed(() => isDarkTheme.value === true);

    return {
        isDark,
        toggleTheme,
        initTheme,
    };
}
