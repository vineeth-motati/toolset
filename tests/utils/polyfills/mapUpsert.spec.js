/**
 * The polyfill functions are tested by .call()-ing them onto real Maps rather
 * than by installing them, so the assertions hold regardless of whether the
 * host V8 already ships the native methods.
 */
import { describe, it, expect, vi } from 'vitest';
import {
    getOrInsert,
    getOrInsertComputed,
    installMapUpsert,
} from '~/utils/polyfills/mapUpsert';

describe('getOrInsert', () => {
    it('returns the existing value without overwriting it', () => {
        const m = new Map([['a', 1]]);
        expect(getOrInsert.call(m, 'a', 99)).toBe(1);
        expect(m.get('a')).toBe(1);
    });

    it('inserts and returns the default when the key is absent', () => {
        const m = new Map();
        expect(getOrInsert.call(m, 'a', 42)).toBe(42);
        expect(m.get('a')).toBe(42);
    });

    it('treats a stored undefined as present, not missing', () => {
        const m = new Map([['a', undefined]]);
        expect(getOrInsert.call(m, 'a', 7)).toBeUndefined();
        expect(m.get('a')).toBeUndefined();
    });
});

describe('getOrInsertComputed', () => {
    it('does not call the callback when the key exists', () => {
        const m = new Map([['a', 1]]);
        const cb = vi.fn(() => 99);
        expect(getOrInsertComputed.call(m, 'a', cb)).toBe(1);
        expect(cb).not.toHaveBeenCalled();
    });

    it('computes, inserts and returns when the key is absent', () => {
        const m = new Map();
        const cb = vi.fn(() => ['x']);
        const value = getOrInsertComputed.call(m, 'k', cb);
        expect(value).toEqual(['x']);
        expect(m.get('k')).toBe(value);
        expect(cb).toHaveBeenCalledWith('k');
    });

    it('returns the same reference on the second call — the property pdf.js relies on', () => {
        // pdf.js does `map.getOrInsertComputed(key, makeArr).push(...)`, so a
        // fresh array on every call would silently drop everything pushed.
        const m = new Map();
        const first = getOrInsertComputed.call(m, 'k', () => []);
        first.push('a');
        const second = getOrInsertComputed.call(m, 'k', () => []);
        second.push('b');
        expect(second).toBe(first);
        expect(first).toEqual(['a', 'b']);
    });

    it('overwrites when the callback inserted the key itself', () => {
        const m = new Map();
        const value = getOrInsertComputed.call(m, 'k', () => {
            m.set('k', 'from-callback');
            return 'returned';
        });
        expect(value).toBe('returned');
        expect(m.get('k')).toBe('returned');
    });

    it('rejects a non-callable callback', () => {
        expect(() => getOrInsertComputed.call(new Map(), 'k', 'nope')).toThrow(
            TypeError
        );
    });

    it('works on a WeakMap, whose keys pdf.js uses for DOM/object caches', () => {
        const wm = new WeakMap();
        const key = {};
        const value = getOrInsertComputed.call(wm, key, () => new Map());
        expect(wm.get(key)).toBe(value);
        expect(getOrInsertComputed.call(wm, key, () => new Map())).toBe(value);
    });
});

describe('installMapUpsert', () => {
    it('leaves Map and WeakMap with callable upsert methods', () => {
        installMapUpsert();
        for (const Ctor of [Map, WeakMap]) {
            expect(typeof Ctor.prototype.getOrInsert).toBe('function');
            expect(typeof Ctor.prototype.getOrInsertComputed).toBe('function');
        }
        expect(new Map().getOrInsertComputed('k', () => 5)).toBe(5);
    });

    it('is idempotent and keeps the methods non-enumerable', () => {
        installMapUpsert();
        const first = Map.prototype.getOrInsertComputed;
        installMapUpsert();
        expect(Map.prototype.getOrInsertComputed).toBe(first);
        expect(
            Object.propertyIsEnumerable.call(
                Map.prototype,
                'getOrInsertComputed'
            )
        ).toBe(false);
    });
});
