/**
 * Source locator behind the JSON Grid cell→line highlight (/tools/jsongrid).
 * A one-pass scanner maps each value's structural path to its source position,
 * replacing the old string-matching heuristics that broke on duplicate values,
 * minified input and repeated keys.
 */
import { describe, it, expect } from 'vitest';
import {
    buildLocationMap,
    locatePath,
    parseCellPath,
} from '@/utils/jsonLocate';

const PRETTY = `[
  {
    "id": 1,
    "name": "Alice",
    "tags": ["dev", "ui"],
    "meta": { "city": "Paris" }
  },
  {
    "id": 2,
    "name": "Bob",
    "tags": ["ops"]
  }
]`;

describe('parseCellPath', () => {
    it('splits dotted paths into segments', () => {
        expect(parseCellPath('0.metadata.settings.theme')).toEqual([
            '0',
            'metadata',
            'settings',
            'theme',
        ]);
    });

    it('turns bracket indices into numbers', () => {
        expect(parseCellPath('0.tags[1]')).toEqual(['0', 'tags', 1]);
    });

    it('handles a key with multiple indices', () => {
        expect(parseCellPath('grid[0][2]')).toEqual(['grid', 0, 2]);
    });

    it('drops a leading root segment and empty parts', () => {
        expect(parseCellPath('root.a')).toEqual(['a']);
        expect(parseCellPath('')).toEqual([]);
    });
});

describe('locatePath', () => {
    it('locates a top-level array element by index', () => {
        const loc = locatePath(PRETTY, [1]);
        expect(loc).not.toBeNull();
        // Second object opens on line index 7 (0-based).
        expect(loc.line).toBe(7);
    });

    it('locates a primitive field to the exact line', () => {
        expect(locatePath(PRETTY, [0, 'name']).line).toBe(3);
        expect(locatePath(PRETTY, [1, 'name']).line).toBe(9);
    });

    it('locates a nested array item, not just the array', () => {
        const item = locatePath(PRETTY, [0, 'tags', 1]);
        const array = locatePath(PRETTY, [0, 'tags']);
        expect(item.line).toBe(4);
        expect(item.start).toBeGreaterThan(array.start);
    });

    it('locates a nested object field', () => {
        expect(locatePath(PRETTY, [0, 'meta', 'city']).line).toBe(5);
    });

    it('returns null for a path that does not exist', () => {
        expect(locatePath(PRETTY, [0, 'missing'])).toBeNull();
        expect(locatePath(PRETTY, [9])).toBeNull();
    });
});

describe('buildLocationMap robustness', () => {
    it('disambiguates duplicate values by path, not by text search', () => {
        // Both objects have name "Same"; a naive text search would collide.
        const src = '[{"name":"Same"},{"name":"Same"}]';
        const first = locatePath(src, [0, 'name']);
        const second = locatePath(src, [1, 'name']);
        expect(first.start).toBeLessThan(second.start);
        expect(src.slice(first.start, first.end)).toBe('"Same"');
        expect(src.slice(second.start, second.end)).toBe('"Same"');
    });

    it('works on minified single-line JSON via character offsets', () => {
        const src = '{"a":1,"b":{"c":2}}';
        const c = locatePath(src, ['b', 'c']);
        expect(c.line).toBe(0);
        expect(src.slice(c.start, c.end)).toBe('2');
    });

    it('handles escaped quotes inside string keys and values', () => {
        const src = '{"a\\"b":"x","y":true}';
        const y = locatePath(src, ['y']);
        expect(src.slice(y.start, y.end)).toBe('true');
    });

    it('records object and array container extents', () => {
        const src = '{"obj":{"k":1},"arr":[1,2]}';
        const obj = locatePath(src, ['obj']);
        const arr = locatePath(src, ['arr']);
        expect(src.slice(obj.start, obj.end)).toBe('{"k":1}');
        expect(src.slice(arr.start, arr.end)).toBe('[1,2]');
    });

    it('returns an empty map for empty input', () => {
        expect(buildLocationMap('').size).toBe(0);
    });
});
