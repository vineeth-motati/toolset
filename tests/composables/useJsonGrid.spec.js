/**
 * Grid engine behind the JSON Grid tool (/tools/jsongrid): JSON ↔ grid
 * conversion, sorting and filtering.
 */
import { describe, it, expect } from 'vitest';
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
