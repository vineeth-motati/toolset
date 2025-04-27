module.exports = {
    darkMode: 'class', // Ensures dark mode is based on .dark class
    content: [
        './components/**/*.{js,vue,ts}',
        './layouts/**/*.vue',
        './pages/**/*.vue',
        './plugins/**/*.{js,ts}',
        './app.vue',
    ],
    theme: {
        extend: {
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
