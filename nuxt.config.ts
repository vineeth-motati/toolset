import tailwindTypography from '@tailwindcss/typography';

export default defineNuxtConfig({
    modules: ['@nuxtjs/tailwindcss'],

    tailwindcss: {
        config: {
            plugins: [tailwindTypography()],
        },
    },

    app: {
        head: {
            title: 'Tools-Set',
            meta: [
                { charset: 'utf-8' },
                {
                    name: 'viewport',
                    content: 'width=device-width, initial-scale=1',
                },
            ],
            script: [
                {
                    // Apply dark mode before first paint. Reads the same
                    // 'dark-theme' key useTheme() persists (stored as the
                    // strings "true"/"false"); absent key falls back to the
                    // OS preference.
                    innerHTML: `(function(){try{var v=localStorage.getItem('dark-theme');var d=v===null?window.matchMedia('(prefers-color-scheme: dark)').matches:v==='true';if(d)document.documentElement.classList.add('dark')}catch(e){}})()`,
                    tagPosition: 'head',
                },
            ],
        },
    },

    runtimeConfig: {
        public: {
            baseUrl: process.env.BASE_URL || 'https://tools-set.vercel.app',
        },
    },

    compatibilityDate: '2024-11-16',
});
