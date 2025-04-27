/**
 * JSON Worker for handling intensive JSON operations
 * This worker offloads JSON parsing, formatting, and searching from the main thread
 */

self.addEventListener('message', function (e) {
    const { action, payload } = e.data;

    try {
        switch (action) {
            case 'validate':
                validateJson(payload);
                break;
            case 'format':
                formatJson(payload);
                break;
            case 'minify':
                minifyJson(payload);
                break;
            case 'search':
                searchInJson(payload.json, payload.query);
                break;
            default:
                self.postMessage({
                    success: false,
                    error: 'Unknown action',
                });
        }
    } catch (error) {
        self.postMessage({
            success: false,
            action,
            error: error.message,
        });
    }
});

/**
 * Validates if a string is valid JSON
 */
function validateJson(jsonString) {
    try {
        const parsed = JSON.parse(jsonString);
        self.postMessage({
            success: true,
            action: 'validate',
            result: {
                valid: true,
                parsed,
            },
        });
    } catch (error) {
        self.postMessage({
            success: true,
            action: 'validate',
            result: {
                valid: false,
                error: error.message,
            },
        });
    }
}

/**
 * Formats (pretty prints) JSON with indentation
 */
function formatJson(jsonString) {
    try {
        const parsed = JSON.parse(jsonString);
        const formatted = JSON.stringify(parsed, null, 2);
        self.postMessage({
            success: true,
            action: 'format',
            result: formatted,
        });
    } catch (error) {
        self.postMessage({
            success: false,
            action: 'format',
            error: error.message,
        });
    }
}

/**
 * Minifies JSON by removing all unnecessary whitespace
 */
function minifyJson(jsonString) {
    try {
        const parsed = JSON.parse(jsonString);
        const minified = JSON.stringify(parsed);
        self.postMessage({
            success: true,
            action: 'minify',
            result: minified,
        });
    } catch (error) {
        self.postMessage({
            success: false,
            action: 'minify',
            error: error.message,
        });
    }
}

/**
 * Performs a deep search in JSON data
 */
function searchInJson(jsonString, query) {
    try {
        if (!query || query.trim() === '') {
            throw new Error('Search query is empty');
        }

        const parsed = JSON.parse(jsonString);
        const normalizedQuery = query.toLowerCase();
        const results = [];

        function deepSearch(obj, path = '') {
            if (obj === null || obj === undefined) {
                return;
            }

            // For arrays
            if (Array.isArray(obj)) {
                obj.forEach((item, index) => {
                    const currentPath = path
                        ? `${path}[${index}]`
                        : `[${index}]`;

                    // Check if primitive value matches search
                    if (
                        typeof item !== 'object' &&
                        String(item).toLowerCase().includes(normalizedQuery)
                    ) {
                        results.push({
                            path: currentPath,
                            value: item,
                        });
                    }
                    // Recurse if object
                    if (item !== null && typeof item === 'object') {
                        deepSearch(item, currentPath);
                    }
                });
                return;
            }

            // For objects
            if (typeof obj === 'object') {
                for (const key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        const value = obj[key];
                        const currentPath = path ? `${path}.${key}` : key;

                        // Check if key matches search
                        if (key.toLowerCase().includes(normalizedQuery)) {
                            results.push({
                                path: currentPath,
                                value: value,
                                matchedKey: true,
                            });
                        }

                        // Check if primitive value matches search
                        if (
                            typeof value !== 'object' &&
                            value !== null &&
                            String(value)
                                .toLowerCase()
                                .includes(normalizedQuery)
                        ) {
                            results.push({
                                path: currentPath,
                                value: value,
                            });
                        }

                        // Recurse if object
                        if (value !== null && typeof value === 'object') {
                            deepSearch(value, currentPath);
                        }
                    }
                }
            }
        }

        deepSearch(parsed);

        self.postMessage({
            success: true,
            action: 'search',
            result: {
                query: query,
                count: results.length,
                matches: results.slice(0, 100), // Limit results to prevent large transfers
            },
        });
    } catch (error) {
        self.postMessage({
            success: false,
            action: 'search',
            error: error.message,
        });
    }
}
