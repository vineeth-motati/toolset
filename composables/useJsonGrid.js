import { ref } from 'vue';

export function useJsonGrid() {
    const error = ref(null);

    /**
     * Validate JSON string
     */
    const validateJson = (jsonString) => {
        try {
            if (!jsonString.trim()) {
                return { valid: false, error: 'Empty JSON string' };
            }
            JSON.parse(jsonString);
            return { valid: true, error: null };
        } catch (e) {
            return { valid: false, error: e.message };
        }
    };

    /**
     * Convert JSON array to grid format
     */
    const jsonToGrid = (jsonString) => {
        try {
            const validation = validateJson(jsonString);
            if (!validation.valid) {
                error.value = validation.error;
                return { headers: [], data: [] };
            }

            const parsed = JSON.parse(jsonString);

            // Handle array of objects (most common case)
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Collect all possible headers from all objects
                const allHeaders = new Set();
                parsed.forEach((item) => {
                    if (typeof item === 'object' && item !== null) {
                        Object.keys(item).forEach((key) => allHeaders.add(key));
                    }
                });

                // Create normalized data with all fields
                const normalizedData = parsed.map((item) => {
                    if (typeof item !== 'object' || item === null) {
                        return { value: item };
                    }

                    // Create an object with all headers
                    const normalizedItem = {};
                    allHeaders.forEach((header) => {
                        normalizedItem[header] =
                            item[header] !== undefined ? item[header] : null;
                    });

                    return normalizedItem;
                });

                return {
                    headers: [...allHeaders],
                    data: normalizedData,
                };
            }

            // Handle single object
            if (typeof parsed === 'object' && parsed !== null) {
                const headers = Object.keys(parsed);
                return {
                    headers,
                    data: [parsed],
                };
            }

            // Handle primitive value
            return {
                headers: ['value'],
                data: [{ value: parsed }],
            };
        } catch (e) {
            error.value = e.message;
            return { headers: [], data: [] };
        }
    };

    /**
     * Convert grid data back to JSON
     */
    const gridToJson = (headers, data, pretty = true) => {
        try {
            const jsonData = data.map((row) => {
                const obj = {};
                headers.forEach((header) => {
                    obj[header] = row[header];
                });
                return obj;
            });

            return pretty
                ? JSON.stringify(jsonData, null, 2)
                : JSON.stringify(jsonData);
        } catch (e) {
            error.value = e.message;
            return '';
        }
    };

    /**
     * Sort grid data by a specific column
     */
    const sortGridData = (data, column, direction = 'asc') => {
        return [...data].sort((a, b) => {
            const aVal = a[column];
            const bVal = b[column];

            if (aVal === bVal) return 0;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            const comparison = aVal > bVal ? 1 : -1;
            return direction === 'asc' ? comparison : -comparison;
        });
    };

    /**
     * Filter grid data based on search query
     */
    const filterGridData = (data, query) => {
        if (!query.trim()) return data;

        const lowerQuery = query.toLowerCase();
        return data.filter((row) => {
            return Object.entries(row).some(([key, value]) => {
                const stringValue =
                    value === null || value === undefined
                        ? ''
                        : String(value).toLowerCase();
                return (
                    key.toLowerCase().includes(lowerQuery) ||
                    stringValue.includes(lowerQuery)
                );
            });
        });
    };

    return {
        error,
        validateJson,
        jsonToGrid,
        gridToJson,
        sortGridData,
        filterGridData,
    };
}
