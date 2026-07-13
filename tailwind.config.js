const colors = require('tailwindcss/colors');

module.exports = {
    darkMode: 'class', // Ensures dark mode is based on .dark class
    content: [
        './components/**/*.{js,vue,ts}',
        './layouts/**/*.vue',
        './pages/**/*.vue',
        './plugins/**/*.{js,ts}',
        './app.vue',
        './error.vue',
    ],
    theme: {
        extend: {
            colors: {
                // Brand tokens — use these instead of raw blue-*/gray-* on
                // interactive elements so pages stay visually consistent.
                primary: colors.indigo,
                accent: colors.purple,
                surface: {
                    DEFAULT: '#ffffff',
                    muted: '#f9fafb',
                    dark: '#111827',
                    'dark-muted': '#1f2937',
                },
            },
            borderRadius: {
                card: '0.75rem',
            },
            // Add any theme extensions needed for proper dark mode styling
            backgroundColor: {
                dark: '#1f2937',
            },
            textColor: {
                dark: '#f9fafb',
            },
        },
    },
    plugins: [],
};
