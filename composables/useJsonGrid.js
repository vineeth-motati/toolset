import { ref } from 'vue';

/**
 * Grid engine behind the JSON Grid tool (/tools/jsongrid).
 *
 * Two layers live here:
 *   1. Pure, dependency-free functions (exported at module scope) that parse
 *      JSON into rows/columns, search, sort and export. These are the tested
 *      "core" the page actually runs — no Vue, no DOM.
 *   2. A thin `useJsonGrid()` factory keeping the original stateful helpers
 *      (`validateJson`/`jsonToGrid`/…) that record parse errors on a ref.
 *
 * Historically the page re-implemented grid-building and search inline while
 * this composable's `jsonToGrid` (fully tested) went unused. The pure core
 * below is the single source of truth both the page and the specs share.
 */

// ── Path helpers ────────────────────────────────────────────────────────────

/**
 * Resolve a value by structural path. `path` is an array of segments — string
 * keys or numeric indices. Returns undefined for any missing hop.
 */
export function getByPath(obj, path) {
    let cur = obj;
    for (const seg of path) {
        if (cur === null || cur === undefined) return undefined;
        cur = cur[seg];
    }
    return cur;
}

/** Classify a value for column typing and operator selection. */
export function valueType(v) {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'array';
    if (typeof v === 'object') return 'object';
    return typeof v; // 'string' | 'number' | 'boolean' | 'undefined'
}

/** Set a value at a structural path in place, returning the (mutated) root. */
export function setByPath(obj, path, value) {
    if (!path || path.length === 0) return value;
    let cur = obj;
    for (let i = 0; i < path.length - 1; i++) {
        if (cur === null || cur === undefined) return obj;
        cur = cur[path[i]];
    }
    if (cur !== null && cur !== undefined) cur[path[path.length - 1]] = value;
    return obj;
}

/** Render a path as a human label: ['data','tracks',0,'elements'] → 'data.tracks[0].elements'. */
export function pathToLabel(path) {
    let out = '';
    for (const seg of path) {
        if (typeof seg === 'number') out += `[${seg}]`;
        else out += out ? `.${seg}` : String(seg);
    }
    return out || '(whole document)';
}

// ── Root-path picking ──────────────────────────────────────────────────────
//
// A nested object envelope ({ data: { tracks: [...] } }) renders as a single
// unusable row. These helpers surface the arrays buried inside so the grid can
// pivot onto one of them. Arrays are descended representatively (index 0 only)
// so the candidate list stays a clean set of shapes rather than every indexed
// permutation.

export function findRootCandidates(parsed, { maxDepth = 8 } = {}) {
    const candidates = [];
    const seen = new Set();

    const walk = (node, path, depth) => {
        if (node === null || typeof node !== 'object' || depth > maxDepth)
            return;
        if (Array.isArray(node)) {
            const objectItems = node.reduce(
                (n, x) =>
                    n +
                    (x !== null && typeof x === 'object' && !Array.isArray(x)
                        ? 1
                        : 0),
                0
            );
            const key = path.map(String).join('\u0000');
            if (!seen.has(key)) {
                seen.add(key);
                candidates.push({
                    path: path.slice(),
                    label: pathToLabel(path),
                    length: node.length,
                    objectRatio: node.length ? objectItems / node.length : 0,
                    depth,
                });
            }
            if (node.length > 0) walk(node[0], path.concat(0), depth + 1);
        } else {
            for (const k of Object.keys(node)) {
                walk(node[k], path.concat(k), depth + 1);
            }
        }
    };

    walk(parsed, [], 0);
    return candidates;
}

/**
 * Choose a sensible default grid root. A top-level array (or non-object) stays
 * at the document root. Otherwise pivot onto the shallowest array-of-objects
 * with at least two items — the most top-level meaningful collection — falling
 * back to the whole document when none qualifies.
 */
export function pickDefaultRoot(parsed) {
    if (
        Array.isArray(parsed) ||
        parsed === null ||
        typeof parsed !== 'object'
    ) {
        return [];
    }
    const qualifying = findRootCandidates(parsed)
        .filter((c) => c.objectRatio >= 0.5 && c.length >= 2)
        .sort((a, b) => a.depth - b.depth || b.length - a.length);
    return qualifying.length ? qualifying[0].path : [];
}

// ── Rows & columns ───────────────────────────────────────────────────────────

/**
 * Normalize parsed JSON into grid rows. An array becomes its items (primitives
 * and null wrapped as `{ value }`), a plain object becomes a single row, and a
 * bare primitive becomes one `{ value }` row. An empty array yields no rows.
 */
export function toRows(parsed) {
    if (parsed === null || parsed === undefined) return [];
    if (Array.isArray(parsed)) {
        return parsed.map((item) =>
            item !== null && typeof item === 'object' ? item : { value: item }
        );
    }
    if (typeof parsed === 'object') return [parsed];
    return [{ value: parsed }];
}

/**
 * Derive first-class columns from rows. Columns keep first-seen order and carry
 * a per-type tally, the dominant inferred type, and view state (visible/sort)
 * that the page mutates. Nested paths stay collapsed here (top-level only);
 * flatten/promote is a later phase.
 */
export function deriveColumns(rows) {
    const order = [];
    const typeCounts = new Map();

    for (const row of rows) {
        if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
        for (const key of Object.keys(row)) {
            if (!typeCounts.has(key)) {
                typeCounts.set(key, {});
                order.push(key);
            }
            const counts = typeCounts.get(key);
            const t = valueType(row[key]);
            counts[t] = (counts[t] || 0) + 1;
        }
    }

    return order.map((key) => {
        const counts = typeCounts.get(key);
        let inferredType = 'null';
        let best = -1;
        for (const [t, c] of Object.entries(counts)) {
            if (t === 'null' || t === 'undefined') continue;
            if (c > best) {
                best = c;
                inferredType = t;
            }
        }
        const nils = (counts.null || 0) + (counts.undefined || 0);
        return {
            id: key,
            label: key,
            path: [key],
            depth: 0,
            types: counts,
            inferredType,
            nullable: nils > 0 || best === -1,
            visible: true,
            sort: null,
        };
    });
}

// ── Search ───────────────────────────────────────────────────────────────────

/**
 * Recursive deep search over keys and values. `query` must be pre-lowercased.
 * Matches a substring in any nested key name or stringified primitive value.
 */
export function deepMatch(value, query) {
    if (value === null || value === undefined) return false;
    if (typeof value !== 'object') {
        return String(value).toLowerCase().includes(query);
    }
    if (Array.isArray(value)) {
        return value.some((item) => deepMatch(item, query));
    }
    for (const key of Object.keys(value)) {
        if (key.toLowerCase().includes(query)) return true;
        if (deepMatch(value[key], query)) return true;
    }
    return false;
}

// ── Sort ───────────────────────────────────────────────────────────────────

/**
 * Total order used across the grid: nulls/undefined sort last, numbers compare
 * numerically, booleans false<true, objects/arrays by their JSON string, and
 * everything else lexicographically.
 */
export function compareValues(a, b) {
    const aNil = a === null || a === undefined;
    const bNil = b === null || b === undefined;
    if (aNil && bNil) return 0;
    if (aNil) return 1;
    if (bNil) return -1;

    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (typeof a === 'boolean' && typeof b === 'boolean') {
        return a === b ? 0 : a ? 1 : -1;
    }

    const as = typeof a === 'object' ? JSON.stringify(a) : String(a);
    const bs = typeof b === 'object' ? JSON.stringify(b) : String(b);
    if (as < bs) return -1;
    if (as > bs) return 1;
    return 0;
}

/**
 * Stably sort an array of row indices by a multi-key sort model.
 * `sortModel` is `[{ path, direction }]`; ties fall back to original order so
 * grid edits can always map a visible position back to its source index.
 */
export function sortIndices(indices, rows, sortModel) {
    if (!sortModel || sortModel.length === 0) return indices.slice();
    const decorated = indices.map((i, ordinal) => ({ i, ordinal }));
    decorated.sort((a, b) => {
        for (const key of sortModel) {
            const cmp = compareValues(
                getByPath(rows[a.i], key.path),
                getByPath(rows[b.i], key.path)
            );
            if (cmp !== 0) return key.direction === 'desc' ? -cmp : cmp;
        }
        return a.ordinal - b.ordinal;
    });
    return decorated.map((d) => d.i);
}

// ── WYSIWYG export ────────────────────────────────────────────────────────────

const scalarString = (v) =>
    v === null || v === undefined
        ? ''
        : typeof v === 'object'
          ? JSON.stringify(v)
          : String(v);

/** Rebuild plain objects from the visible columns, in view order. */
export function rowsToObjects(columns, rows) {
    return rows.map((row) => {
        const obj = {};
        for (const col of columns) obj[col.label] = getByPath(row, col.path);
        return obj;
    });
}

export function toCsv(columns, rows) {
    const esc = (v) => {
        const s = scalarString(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [columns.map((c) => esc(c.label)).join(',')];
    for (const row of rows) {
        lines.push(columns.map((c) => esc(getByPath(row, c.path))).join(','));
    }
    return lines.join('\n');
}

export function toMarkdown(columns, rows) {
    const cell = (v) =>
        scalarString(v).replace(/\|/g, '\\|').replace(/\n/g, ' ');
    const lines = [
        `| ${columns.map((c) => cell(c.label)).join(' | ')} |`,
        `| ${columns.map(() => '---').join(' | ')} |`,
    ];
    for (const row of rows) {
        lines.push(
            `| ${columns.map((c) => cell(getByPath(row, c.path))).join(' | ')} |`
        );
    }
    return lines.join('\n');
}

export function toNdjson(columns, rows) {
    return rowsToObjects(columns, rows)
        .map((obj) => JSON.stringify(obj))
        .join('\n');
}

export function toJson(columns, rows, pretty = true) {
    const objects = rowsToObjects(columns, rows);
    return pretty ? JSON.stringify(objects, null, 2) : JSON.stringify(objects);
}

// ── Stateful factory (original API, preserved for existing callers/tests) ─────

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
        // Pure core, surfaced for convenience.
        getByPath,
        toRows,
        deriveColumns,
        deepMatch,
        sortIndices,
    };
}
