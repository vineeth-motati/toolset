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
      title: 'ToolSet',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },

  runtimeConfig: {
    public: {
      baseUrl: process.env.BASE_URL || '',
    },
  },

  compatibilityDate: '2024-11-16',
});
