import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Plain Vitest (no Nuxt runtime): converter handlers and most composables are
// framework-free, and the few Nuxt auto-imports used inside composables
// (useRoute, useState, useNuxtApp, ...) are stubbed per-test in tests/setup.ts.
export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./', import.meta.url)),
            '~': fileURLToPath(new URL('./', import.meta.url)),
        },
    },
    test: {
        globals: true,
        // Converters need browser APIs: Blob.text(), File.arrayBuffer(),
        // DOMParser, localStorage. Canvas/createImageBitmap are mocked.
        environment: 'happy-dom',
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.spec.{js,ts}'],
        clearMocks: true,
        restoreMocks: true,
        unstubGlobals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: [
                'utils/**/*.{js,ts}',
                'composables/**/*.{js,ts}',
                'config/**/*.js',
            ],
        },
    },
});
