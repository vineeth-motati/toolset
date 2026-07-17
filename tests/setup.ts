import { afterEach } from 'vitest';

// localStorage-backed composables (useToolUsage, useTheme, useConverter's
// API key) must not leak state between tests.
afterEach(() => {
    localStorage.clear();
});
