import { describe, it, expect } from 'vitest';
import {
    defaultResume,
    validate,
    isEmptyResume,
    SECTION_ORDER,
} from '@/utils/resume/schema';

describe('defaultResume', () => {
    it('produces a complete, empty resume', () => {
        const r = defaultResume('My CV');
        expect(r.id).toBeTruthy();
        expect(r.name).toBe('My CV');
        expect(r.meta.template).toBe('classic');
        expect(r.meta.sectionsOrder).toEqual(SECTION_ORDER);
        expect(Object.values(r.meta.sectionVisibility).every((v) => v === true)).toBe(true);
        expect(r.work).toEqual([]);
        expect(r.basics.name).toBe('');
    });
});

describe('validate', () => {
    it('returns a full default for non-objects', () => {
        expect(validate(null).meta.template).toBe('classic');
        expect(validate('nope').work).toEqual([]);
    });

    it('repairs a partial resume, filling missing fields', () => {
        const r = validate({ basics: { name: 'Jane' }, work: [{ position: 'Dev' }] });
        expect(r.basics.name).toBe('Jane');
        expect(r.basics.email).toBe('');
        expect(r.basics.location.city).toBe('');
        expect(r.work).toHaveLength(1);
        expect(r.work[0].position).toBe('Dev');
        expect(r.work[0].name).toBe('');
        expect(Array.isArray(r.work[0].highlights)).toBe(true);
    });

    it('normalizes a partial/legacy sectionsOrder to the full unique set', () => {
        const r = validate({ meta: { sectionsOrder: ['skills', 'work'] } });
        expect(r.meta.sectionsOrder[0]).toBe('skills');
        expect(r.meta.sectionsOrder[1]).toBe('work');
        expect(r.meta.sectionsOrder).toHaveLength(SECTION_ORDER.length);
        expect(new Set(r.meta.sectionsOrder).size).toBe(SECTION_ORDER.length);
    });

    it('clamps out-of-range theme values and rejects bad accent colors', () => {
        const r = validate({ meta: { theme: { fontSize: 999, accent: 'red', pageSize: 'A3' } } });
        expect(r.meta.theme.fontSize).toBeLessThanOrEqual(16);
        expect(r.meta.theme.accent).toMatch(/^#[0-9a-f]{6}$/i);
        expect(['A4', 'LETTER']).toContain(r.meta.theme.pageSize);
    });

    it('respects explicit section visibility booleans', () => {
        const r = validate({ meta: { sectionVisibility: { work: false } } });
        expect(r.meta.sectionVisibility.work).toBe(false);
        expect(r.meta.sectionVisibility.education).toBe(true);
    });
});

describe('isEmptyResume', () => {
    it('is true for a fresh resume and false once content exists', () => {
        const r = defaultResume();
        expect(isEmptyResume(r)).toBe(true);
        r.basics.name = 'Jane';
        expect(isEmptyResume(r)).toBe(false);
    });

    it('counts section content, not just basics', () => {
        const r = defaultResume();
        r.skills.push({ name: 'Lang', level: '', keywords: ['TS'] });
        expect(isEmptyResume(r)).toBe(false);
    });
});
