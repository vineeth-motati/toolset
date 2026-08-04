/**
 * Stable render keys for draggable entry lists (utils/resume/entryKey.ts).
 */
import { describe, it, expect } from 'vitest';
import { entryKey } from '@/utils/resume/entryKey';

describe('entryKey', () => {
    it('returns the same key for the same object every time', () => {
        const entry = { position: 'Engineer' };
        expect(entryKey(entry)).toBe(entryKey(entry));
    });

    it('gives distinct keys to distinct objects, even when equal by value', () => {
        const a = { position: 'Engineer' };
        const b = { position: 'Engineer' };
        expect(entryKey(a)).not.toBe(entryKey(b));
    });

    it('survives reordering — the key follows the object, not the index', () => {
        const list = [{ n: 1 }, { n: 2 }, { n: 3 }];
        const before = list.map(entryKey);
        list.reverse();
        expect(list.map(entryKey)).toEqual([...before].reverse());
    });

    it('falls back to a string for primitives and nullish values', () => {
        expect(entryKey('bullet text')).toBe('bullet text');
        expect(entryKey(null)).toBe('null');
        expect(entryKey(undefined)).toBe('undefined');
        expect(entryKey(7)).toBe('7');
    });
});
