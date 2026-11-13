const colors = require('tailwindcss/colors');
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
    darkMode: 'class',
    content: [
        './components/**/*.{js,vue,ts}',
        './layouts/**/*.vue',
        './pages/**/*.vue',
        './plugins/**/*.{js,ts}',
        './composables/**/*.{js,ts}',
        './app.vue',
        './error.vue',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Inter Variable"', ...defaultTheme.fontFamily.sans],
                mono: [
                    '"JetBrains Mono Variable"',
                    ...defaultTheme.fontFamily.mono,
                ],
            },
            colors: {
                // Cool "ink" neutrals. Every page leans on gray-*, so this
                // scale sets the tone of the whole app in both themes.
                gray: {
                    50: '#F7F8FA',
                    100: '#F0F2F6',
                    200: '#E3E7EE',
                    300: '#CDD3DE',
                    400: '#98A1B3',
                    500: '#697287',
                    600: '#4C5568',
                    700: '#2B3243',
                    800: '#161B27',
                    900: '#0C0F17',
                    950: '#06080D',
                },
                primary: {
                    50: '#EFF4FF',
                    100: '#DCE6FF',
                    200: '#BFD1FF',
                    300: '#93B1FD',
                    400: '#6187FA',
                    500: '#3B62F5',
                    600: '#2447E6',
                    700: '#1C37C7',
                    800: '#1C30A1',
                    900: '#1D2E7E',
                    950: '#141C4C',
                },
                accent: colors.lime,
                surface: {
                    DEFAULT: '#ffffff',
                    muted: '#F7F8FA',
                    dark: '#0C0F17',
                    'dark-muted': '#161B27',
                },
            },
            borderRadius: {
                card: '1rem',
            },
            boxShadow: {
                xs: '0 1px 2px 0 rgb(12 15 23 / 0.05)',
                card: '0 1px 2px 0 rgb(12 15 23 / 0.04), 0 1px 3px 0 rgb(12 15 23 / 0.06)',
                lift: '0 1px 2px 0 rgb(12 15 23 / 0.04), 0 12px 32px -12px rgb(12 15 23 / 0.18)',
                pop: '0 24px 48px -12px rgb(12 15 23 / 0.28)',
                'inner-top': 'inset 0 1px 0 0 rgb(255 255 255 / 0.12)',
            },
        },
    },
    plugins: [],
};
