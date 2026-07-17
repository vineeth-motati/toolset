/**
 * Grid engine behind the JSON Grid tool (/tools/jsongrid): JSON ↔ grid
 * conversion, sorting and filtering.
 */
import { describe, it, expect, vi } from 'vitest';
import { useJsonGrid } from '@/composables/useJsonGrid';

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
