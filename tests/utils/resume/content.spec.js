import { describe, it, expect } from 'vitest';
import { ACTION_VERBS, PHRASE_LIBRARY, SUMMARY_STARTERS } from '@/utils/resume/content';

describe('writing-help content', () => {
    it('provides a non-empty, unique list of action verbs', () => {
        expect(ACTION_VERBS.length).toBeGreaterThan(10);
        expect(new Set(ACTION_VERBS).size).toBe(ACTION_VERBS.length);
        expect(ACTION_VERBS.every((v) => typeof v === 'string' && v.length > 1)).toBe(true);
    });

    it('groups phrase templates into non-empty arrays', () => {
        const groups = Object.keys(PHRASE_LIBRARY);
        expect(groups.length).toBeGreaterThanOrEqual(3);
        for (const g of groups) {
            expect(Array.isArray(PHRASE_LIBRARY[g])).toBe(true);
            expect(PHRASE_LIBRARY[g].length).toBeGreaterThan(0);
            expect(PHRASE_LIBRARY[g].every((p) => typeof p === 'string' && p.length > 0)).toBe(true);
        }
    });

    it('offers summary starters', () => {
        expect(SUMMARY_STARTERS.length).toBeGreaterThan(0);
    });
});
