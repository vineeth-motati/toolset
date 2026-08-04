/**
 * Grid engine behind the JSON Grid tool (/tools/jsongrid): JSON ↔ grid
 * conversion, sorting and filtering.
 */
import { describe, it, expect, vi } from 'vitest';
import {
    useJsonGrid,
    getByPath,
    setByPath,
    pathToLabel,
    valueType,
    toRows,
    deriveColumns,
    deepMatch,
    compareValues,
    sortIndices,
    rowsToObjects,
    toCsv,
    toMarkdown,
    toNdjson,
    toJson,
    findRootCandidates,
    pickDefaultRoot,
} from '@/composables/useJsonGrid';

const grid = useJsonGrid();

describe('validateJson', () => {
    it('accepts valid JSON', () => {
        expect(grid.validateJson('{"a":1}')).toEqual({
            valid: true,
            error: null,
        });
    });

    it('rejects empty and whitespace-only strings', () => {
        expect(grid.validateJson('').valid).toBe(false);
        expect(grid.validateJson('   ').valid).toBe(false);
    });

    it('reports the parser message for invalid JSON', () => {
        const result = grid.validateJson('{nope}');
        expect(result.valid).toBe(false);
        expect(result.error).toBeTruthy();
    });
});

describe('jsonToGrid', () => {
    it('converts an array of objects to headers + rows', () => {
        const { headers, data } = grid.jsonToGrid(
            '[{"a":1,"b":2},{"a":3,"b":4}]'
        );
        expect(headers).toEqual(['a', 'b']);
        expect(data).toEqual([
            { a: 1, b: 2 },
            { a: 3, b: 4 },
        ]);
    });

    it('normalizes ragged objects by filling missing keys with null', () => {
        const { headers, data } = grid.jsonToGrid('[{"a":1},{"b":2}]');
        expect(headers).toEqual(['a', 'b']);
        expect(data).toEqual([
            { a: 1, b: null },
            { a: null, b: 2 },
        ]);
    });

    it('wraps a single object as one row', () => {
        const { headers, data } = grid.jsonToGrid('{"x":1,"y":2}');
        expect(headers).toEqual(['x', 'y']);
        expect(data).toEqual([{ x: 1, y: 2 }]);
    });

    it('wraps a primitive as a value row', () => {
        const { headers, data } = grid.jsonToGrid('42');
        expect(headers).toEqual(['value']);
        expect(data).toEqual([{ value: 42 }]);
    });

    it('returns an empty grid and records the error for invalid JSON', () => {
        const { headers, data } = grid.jsonToGrid('{broken');
        expect(headers).toEqual([]);
        expect(data).toEqual([]);
        expect(grid.error.value).toBeTruthy();
    });

    it('wraps non-object items (primitives, null) as their own {value} row', () => {
        const { headers, data } = grid.jsonToGrid('[1,null,{"a":1}]');
        expect(headers).toEqual(['a']);
        expect(data).toEqual([{ value: 1 }, { value: null }, { a: 1 }]);
    });

    it('treats an empty array as a single object with no headers (not the array branch)', () => {
        // parsed.length > 0 is false, so it falls through to the
        // "single object" branch — typeof [] === 'object' is true too.
        const { headers, data } = grid.jsonToGrid('[]');
        expect(headers).toEqual([]);
        expect(data).toEqual([[]]);
    });

    it('records the error and returns an empty grid on unexpected parse failures', () => {
        // Contrived: validateJson's JSON.parse succeeds but the second,
        // independent JSON.parse call inside jsonToGrid then fails — this
        // pins the catch-all fallback for that gap between validation and use.
        const originalParse = JSON.parse;
        const spy = vi.spyOn(JSON, 'parse');
        spy.mockImplementationOnce((s) => originalParse(s));
        spy.mockImplementationOnce(() => {
            throw new Error('parse exploded');
        });
        const { headers, data } = grid.jsonToGrid('{"a":1}');
        expect(headers).toEqual([]);
        expect(data).toEqual([]);
        expect(grid.error.value).toBe('parse exploded');
        spy.mockRestore();
    });
});

describe('gridToJson', () => {
    it('serializes rows using the header order', () => {
        const json = grid.gridToJson(['b', 'a'], [{ a: 1, b: 2 }]);
        expect(JSON.parse(json)).toEqual([{ b: 2, a: 1 }]);
        expect(json).toContain('\n'); // pretty by default
    });

    it('supports compact output', () => {
        const json = grid.gridToJson(['a'], [{ a: 1 }], false);
        expect(json).toBe('[{"a":1}]');
    });

    it('round-trips with jsonToGrid', () => {
        const source = '[{"a":1,"b":"x"},{"a":2,"b":"y"}]';
        const { headers, data } = grid.jsonToGrid(source);
        expect(JSON.parse(grid.gridToJson(headers, data))).toEqual(
            JSON.parse(source)
        );
    });

    it('records the error and returns an empty string for non-array data', () => {
        expect(grid.gridToJson(['a'], null)).toBe('');
        expect(grid.error.value).toBeTruthy();
    });
});

describe('sortGridData', () => {
    const rows = [{ n: 3 }, { n: 1 }, { n: null }, { n: 2 }];

    it('sorts ascending with nulls last and does not mutate input', () => {
        const sorted = grid.sortGridData(rows, 'n', 'asc');
        expect(sorted.map((r) => r.n)).toEqual([1, 2, 3, null]);
        expect(rows.map((r) => r.n)).toEqual([3, 1, null, 2]);
    });

    it('sorts descending', () => {
        const sorted = grid.sortGridData(rows, 'n', 'desc');
        expect(sorted.slice(0, 3).map((r) => r.n)).toEqual([3, 2, 1]);
    });

    it('treats equal values as already in order', () => {
        const tied = [{ n: 1 }, { n: 1 }, { n: 1 }];
        expect(grid.sortGridData(tied, 'n', 'asc').map((r) => r.n)).toEqual([
            1, 1, 1,
        ]);
    });
});

describe('filterGridData', () => {
    const rows = [
        { name: 'Alice', city: 'Paris' },
        { name: 'Bob', city: 'Lyon' },
    ];

    it('matches values case-insensitively', () => {
        expect(grid.filterGridData(rows, 'paris')).toEqual([rows[0]]);
    });

    it('matches header names too', () => {
        expect(grid.filterGridData(rows, 'CITY')).toHaveLength(2);
    });

    it('returns everything for a blank query and nothing on no match', () => {
        expect(grid.filterGridData(rows, '  ')).toEqual(rows);
        expect(grid.filterGridData(rows, 'zzz')).toEqual([]);
    });

    it('handles null values without crashing', () => {
        expect(grid.filterGridData([{ a: null }], 'x')).toEqual([]);
    });
});

// ── Pure core (the logic the page now actually runs) ─────────────────────────

describe('getByPath', () => {
    const obj = { a: { b: [{ c: 1 }, { c: 2 }] }, x: null };

    it('walks object keys and array indices', () => {
        expect(getByPath(obj, ['a', 'b', 1, 'c'])).toBe(2);
    });

    it('returns undefined for any missing hop instead of throwing', () => {
        expect(getByPath(obj, ['a', 'nope', 'deep'])).toBeUndefined();
        expect(getByPath(obj, ['x', 'anything'])).toBeUndefined();
    });

    it('returns the object itself for an empty path', () => {
        expect(getByPath(obj, [])).toBe(obj);
    });
});

describe('setByPath', () => {
    it('sets a nested value in place and returns the root', () => {
        const obj = { a: { b: [{ c: 1 }] } };
        const out = setByPath(obj, ['a', 'b', 0, 'c'], 9);
        expect(out).toBe(obj);
        expect(obj.a.b[0].c).toBe(9);
    });

    it('returns the replacement value for an empty path', () => {
        expect(setByPath({ a: 1 }, [], 'replaced')).toBe('replaced');
    });

    it('leaves the object untouched when the path cannot be navigated', () => {
        const obj = { a: null };
        expect(setByPath(obj, ['a', 'b', 'c'], 1)).toBe(obj);
        expect(obj).toEqual({ a: null });
    });
});

describe('pathToLabel', () => {
    it('joins object keys with dots and array indices with brackets', () => {
        expect(pathToLabel(['data', 'tracks', 0, 'elements'])).toBe(
            'data.tracks[0].elements'
        );
    });

    it('labels the empty path as the whole document', () => {
        expect(pathToLabel([])).toBe('(whole document)');
    });
});

describe('findRootCandidates', () => {
    const envelope = {
        data: {
            tracks: [{ id: 1, elements: [{ e: 1 }, { e: 2 }] }],
        },
        meta: { tags: ['a', 'b'] },
    };

    it('surfaces every array (descending arrays representatively at index 0)', () => {
        const labels = findRootCandidates(envelope).map((c) => c.label);
        expect(labels).toContain('data.tracks');
        expect(labels).toContain('data.tracks[0].elements');
        expect(labels).toContain('meta.tags');
    });

    it('records length and object ratio per candidate', () => {
        const elements = findRootCandidates(envelope).find(
            (c) => c.label === 'data.tracks[0].elements'
        );
        expect(elements.length).toBe(2);
        expect(elements.objectRatio).toBe(1);
        const tags = findRootCandidates(envelope).find(
            (c) => c.label === 'meta.tags'
        );
        expect(tags.objectRatio).toBe(0);
    });
});

describe('pickDefaultRoot', () => {
    it('keeps a top-level array of objects at the document root', () => {
        expect(pickDefaultRoot([{ a: 1 }, { a: 2 }])).toEqual([]);
    });

    it('pivots a nested envelope onto its shallowest 2+ array of objects', () => {
        const envelope = {
            data: {
                tracks: [{ id: 1 }], // length 1 — skipped
                users: [{ n: 'a' }, { n: 'b' }, { n: 'c' }],
            },
        };
        expect(pickDefaultRoot(envelope)).toEqual(['data', 'users']);
    });

    it('falls back to the whole document when no array of objects qualifies', () => {
        expect(pickDefaultRoot({ a: 1, tags: ['x', 'y'] })).toEqual([]);
    });
});

describe('valueType', () => {
    it('distinguishes null, array and object from primitives', () => {
        expect(valueType(null)).toBe('null');
        expect(valueType([1])).toBe('array');
        expect(valueType({})).toBe('object');
        expect(valueType('s')).toBe('string');
        expect(valueType(1)).toBe('number');
        expect(valueType(true)).toBe('boolean');
    });
});

describe('toRows', () => {
    it('maps an array of objects to rows as-is', () => {
        expect(toRows([{ a: 1 }, { a: 2 }])).toEqual([{ a: 1 }, { a: 2 }]);
    });

    it('wraps primitives and null array items as {value}', () => {
        expect(toRows([1, null, { a: 1 }])).toEqual([
            { value: 1 },
            { value: null },
            { a: 1 },
        ]);
    });

    it('wraps a lone object as a single row and a primitive as {value}', () => {
        expect(toRows({ a: 1 })).toEqual([{ a: 1 }]);
        expect(toRows(42)).toEqual([{ value: 42 }]);
    });

    it('yields no rows for an empty array, null or undefined', () => {
        expect(toRows([])).toEqual([]);
        expect(toRows(null)).toEqual([]);
        expect(toRows(undefined)).toEqual([]);
    });
});

describe('deriveColumns', () => {
    it('keeps first-seen order and unions keys across ragged rows', () => {
        const cols = deriveColumns([{ a: 1 }, { b: 2, a: 3 }]);
        expect(cols.map((c) => c.id)).toEqual(['a', 'b']);
        expect(cols[0].path).toEqual(['a']);
    });

    it('tallies types, picks the dominant non-null type, and flags nullable', () => {
        const cols = deriveColumns([
            { id: 1 },
            { id: 2 },
            { id: 'x' },
            { id: null },
        ]);
        const id = cols.find((c) => c.id === 'id');
        expect(id.types).toEqual({ number: 2, string: 1, null: 1 });
        expect(id.inferredType).toBe('number');
        expect(id.nullable).toBe(true);
    });

    it('infers null type for an all-null column', () => {
        const [col] = deriveColumns([{ a: null }, { a: null }]);
        expect(col.inferredType).toBe('null');
        expect(col.nullable).toBe(true);
    });

    it('ignores array and primitive rows when collecting columns', () => {
        expect(deriveColumns([[1, 2], { value: 3 }]).map((c) => c.id)).toEqual([
            'value',
        ]);
    });
});

describe('deepMatch', () => {
    const row = { name: 'Alice', tags: ['dev', 'ui'], meta: { city: 'Paris' } };

    it('matches nested values and keys (query pre-lowercased)', () => {
        expect(deepMatch(row, 'paris')).toBe(true);
        expect(deepMatch(row, 'city')).toBe(true);
        expect(deepMatch(row, 'ui')).toBe(true);
    });

    it('returns false when nothing matches and tolerates null/undefined', () => {
        expect(deepMatch(row, 'zzz')).toBe(false);
        expect(deepMatch(null, 'x')).toBe(false);
        expect(deepMatch(undefined, 'x')).toBe(false);
    });
});

describe('compareValues', () => {
    it('orders numbers numerically and strings lexicographically', () => {
        expect(compareValues(2, 10)).toBeLessThan(0);
        expect(compareValues('b', 'a')).toBeGreaterThan(0);
    });

    it('sorts nulls/undefined last regardless of direction sign', () => {
        expect(compareValues(null, 1)).toBe(1);
        expect(compareValues(1, undefined)).toBe(-1);
        expect(compareValues(null, undefined)).toBe(0);
    });

    it('orders booleans false < true and objects by JSON string', () => {
        expect(compareValues(false, true)).toBeLessThan(0);
        expect(compareValues({ a: 1 }, { a: 2 })).toBeLessThan(0);
    });
});

describe('sortIndices', () => {
    const rows = [
        { n: 3, t: 'a' },
        { n: 1, t: 'b' },
        { n: 1, t: 'a' },
    ];

    it('returns a copy of the input order when no sort model is given', () => {
        const indices = [0, 1, 2];
        const out = sortIndices(indices, rows, []);
        expect(out).toEqual([0, 1, 2]);
        expect(out).not.toBe(indices);
    });

    it('sorts indices by a single key ascending', () => {
        expect(
            sortIndices([0, 1, 2], rows, [{ path: ['n'], direction: 'asc' }])
        ).toEqual([1, 2, 0]);
    });

    it('breaks ties with the next key, then stably by original order', () => {
        const model = [
            { path: ['n'], direction: 'asc' },
            { path: ['t'], direction: 'asc' },
        ];
        expect(sortIndices([0, 1, 2], rows, model)).toEqual([2, 1, 0]);
    });
});

describe('WYSIWYG exporters', () => {
    const columns = [
        { label: 'name', path: ['name'] },
        { label: 'meta', path: ['meta'] },
    ];
    const rows = [
        { name: 'Alice, MD', meta: { city: 'Paris' } },
        { name: 'Bob', meta: null },
    ];

    it('rowsToObjects rebuilds objects from visible columns in view order', () => {
        expect(rowsToObjects(columns, rows)).toEqual([
            { name: 'Alice, MD', meta: { city: 'Paris' } },
            { name: 'Bob', meta: null },
        ]);
    });

    it('toCsv quotes cells with commas and serializes objects as JSON', () => {
        const csv = toCsv(columns, rows);
        expect(csv.split('\n')[0]).toBe('name,meta');
        expect(csv).toContain('"Alice, MD"');
        expect(csv).toContain('"{""city"":""Paris""}"');
    });

    it('toMarkdown emits a header, separator and one row per record', () => {
        const md = toMarkdown(columns, rows).split('\n');
        expect(md[0]).toBe('| name | meta |');
        expect(md[1]).toBe('| --- | --- |');
        expect(md).toHaveLength(4);
    });

    it('toNdjson emits one JSON object per line', () => {
        const lines = toNdjson(columns, rows).split('\n');
        expect(lines).toHaveLength(2);
        expect(JSON.parse(lines[0])).toEqual({
            name: 'Alice, MD',
            meta: { city: 'Paris' },
        });
    });

    it('toJson pretty-prints by default and compacts on request', () => {
        expect(toJson(columns, rows)).toContain('\n');
        expect(toJson(columns, rows, false)).not.toContain('\n');
    });
});
