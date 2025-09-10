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
                    async: true,
                    src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7238618124751862',
                    crossorigin: 'anonymous',
                },
                {
                    type: 'text/javascript',
                    src: '//pl27614534.revenuecpmgate.com/5c/61/30/5c6130af27ed148aea7447587761756f.js',
                },
                {
                    type: 'text/javascript',
                    src: '//pl27614540.revenuecpmgate.com/3e/c7/73/3ec773a345fe051c0f8f042cab94572a.js',
                },
                {
                    async: true,
                    'data-cfasync': 'false',
                    src: '//pl27614570.revenuecpmgate.com/d480860f59e387a6c9dde8cf37b9bc6e/invoke.js',
                },
                {
                    type: 'text/javascript',
                    innerHTML: `
                        atOptions = {
                            'key' : '087d0c7dd9536f826a3dc627031be407',
                            'format' : 'iframe',
                            'height' : 60,
                            'width' : 468,
                            'params' : {}
                        };
                    `,
                },
                {
                    type: 'text/javascript',
                    src: '//www.highperformanceformat.com/087d0c7dd9536f826a3dc627031be407/invoke.js',
                },
                {
                    type: 'text/javascript',
                    innerHTML: `
                        atOptions = {
                            'key' : '59895ae2df1e9fc2c6ee4fc59889d244',
                            'format' : 'iframe',
                            'height' : 300,
                            'width' : 160,
                            'params' : {}
                        };
                    `,
                },
                {
                    type: 'text/javascript',
                    src: '//www.highperformanceformat.com/59895ae2df1e9fc2c6ee4fc59889d244/invoke.js',
                },
                {
                    type: 'text/javascript',
                    innerHTML: `
                        atOptions = {
                            'key' : '686bf89a4fc7ea28bf9f3e7310a165b4',
                            'format' : 'iframe',
                            'height' : 50,
                            'width' : 320,
                            'params' : {}
                        };
                    `,
                },
                {
                    type: 'text/javascript',
                    src: '//www.highperformanceformat.com/686bf89a4fc7ea28bf9f3e7310a165b4/invoke.js',
                },
                {
                    type: 'text/javascript',
                    innerHTML: `
                        atOptions = {
                            'key' : '707de65a5ed59630879a60339d17148b',
                            'format' : 'iframe',
                            'height' : 250,
                            'width' : 300,
                            'params' : {}
                        };
                    `,
                },
                {
                    type: 'text/javascript',
                    src: '//www.highperformanceformat.com/707de65a5ed59630879a60339d17148b/invoke.js',
                },
                {
                    type: 'text/javascript',
                    innerHTML: `
                        atOptions = {
                            'key' : '6cb3ecf18eed64494dab4455f484d635',
                            'format' : 'iframe',
                            'height' : 600,
                            'width' : 160,
                            'params' : {}
                        };
                    `,
                },
                {
                    type: 'text/javascript',
                    src: '//www.highperformanceformat.com/6cb3ecf18eed64494dab4455f484d635/invoke.js',
                },
                {
                    type: 'text/javascript',
                    innerHTML: `
                        atOptions = {
                            'key' : 'c9e09727de327591bac4ff61b90cdd4c',
                            'format' : 'iframe',
                            'height' : 90,
                            'width' : 728,
                            'params' : {}
                        };
                    `,
                },
                {
                    type: 'text/javascript',
                    src: '//www.highperformanceformat.com/c9e09727de327591bac4ff61b90cdd4c/invoke.js',
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
