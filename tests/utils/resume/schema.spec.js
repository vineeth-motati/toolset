import { describe, it, expect } from 'vitest';
import {
    defaultResume,
    defaultTheme,
    validate,
    isEmptyResume,
    SECTION_ORDER,
    SECTION_META,
    FONT_OPTIONS,
    PAGE_SIZES,
    DEFAULT_ACCENT,
} from '@/utils/resume/schema';
import { fullResume } from './fixtures';

describe('constants', () => {
    it('defines nine standard sections with metadata', () => {
        expect(SECTION_ORDER).toHaveLength(9);
        expect(new Set(SECTION_ORDER).size).toBe(9);
        for (const key of SECTION_ORDER) {
            expect(SECTION_META[key].label).toBeTruthy();
            expect(SECTION_META[key].icon).toMatch(/^mdi:/);
            expect(SECTION_META[key].itemNoun).toBeTruthy();
        }
    });

    it('exposes font/page/accent constants', () => {
        expect(FONT_OPTIONS).toContain('Roboto');
        expect(PAGE_SIZES).toEqual(['A4', 'LETTER']);
        expect(DEFAULT_ACCENT).toMatch(/^#[0-9a-f]{6}$/i);
    });
});

describe('defaultResume', () => {
    it('produces a complete, empty resume', () => {
        const r = defaultResume('My CV');
        expect(r.id).toBeTruthy();
        expect(r.name).toBe('My CV');
        expect(r.updatedAt).toBeTypeOf('number');
        expect(r.meta.template).toBe('classic');
        expect(r.meta.sectionsOrder).toEqual(SECTION_ORDER);
        expect(Object.values(r.meta.sectionVisibility).every((v) => v === true)).toBe(true);
        expect(r.work).toEqual([]);
        expect(r.basics.name).toBe('');
        expect(r.basics.location).toEqual({ city: '', region: '', countryCode: '' });
        expect(r.meta.customSections).toEqual([]);
    });

    it('gives each resume a unique id', () => {
        expect(defaultResume().id).not.toBe(defaultResume().id);
    });

    it('defaultTheme is within the accepted ranges', () => {
        const t = defaultTheme();
        expect(t.pageSize).toBe('A4');
        expect(t.margins).toHaveLength(4);
        expect(t.fontSize).toBeGreaterThanOrEqual(7);
    });
});

describe('validate — repair semantics', () => {
    it('returns a full default for non-objects', () => {
        expect(validate(null).meta.template).toBe('classic');
        expect(validate('nope').work).toEqual([]);
        expect(validate(42).basics.name).toBe('');
        expect(validate(undefined).meta.sectionsOrder).toEqual(SECTION_ORDER);
    });

    it('fills missing fields on a partial resume', () => {
        const r = validate({ basics: { name: 'Jane' }, work: [{ position: 'Dev' }] });
        expect(r.basics.name).toBe('Jane');
        expect(r.basics.email).toBe('');
        expect(r.basics.location.city).toBe('');
        expect(r.work).toHaveLength(1);
        expect(r.work[0].position).toBe('Dev');
        expect(r.work[0].name).toBe('');
        expect(Array.isArray(r.work[0].highlights)).toBe(true);
    });

    it('preserves a fully-populated resume round-trip (idempotent)', () => {
        const full = fullResume();
        const once = validate(full);
        const twice = validate(once);
        expect(twice).toEqual(once);
        expect(once.work).toHaveLength(2);
        expect(once.basics.profiles).toHaveLength(2);
        expect(once.meta.customSections[0].items).toHaveLength(2);
    });

    it('drops unknown/garbage array entries into clean shapes', () => {
        const r = validate({ work: [null, 5, { position: 'X', highlights: [1, 'ok', null] }] });
        expect(r.work).toHaveLength(3);
        expect(r.work[0].position).toBe('');
        expect(r.work[2].highlights).toEqual(['ok']); // non-strings + empties dropped
    });

    it('normalizes a partial/legacy sectionsOrder to the full unique set', () => {
        const r = validate({ meta: { sectionsOrder: ['skills', 'work', 'skills', 'bogus'] } });
        expect(r.meta.sectionsOrder[0]).toBe('skills');
        expect(r.meta.sectionsOrder[1]).toBe('work');
        expect(r.meta.sectionsOrder).toHaveLength(SECTION_ORDER.length);
        expect(new Set(r.meta.sectionsOrder).size).toBe(SECTION_ORDER.length);
        expect(r.meta.sectionsOrder).not.toContain('bogus');
    });

    it('clamps out-of-range theme values and rejects bad accents/pages', () => {
        const r = validate({ meta: { theme: { fontSize: 999, lineHeight: 9, sectionSpacing: -3, accent: 'red', pageSize: 'A3' } } });
        expect(r.meta.theme.fontSize).toBeLessThanOrEqual(16);
        expect(r.meta.theme.lineHeight).toBeLessThanOrEqual(2);
        expect(r.meta.theme.sectionSpacing).toBeGreaterThanOrEqual(0);
        expect(r.meta.theme.accent).toBe(DEFAULT_ACCENT);
        expect(PAGE_SIZES).toContain(r.meta.theme.pageSize);
    });

    it('accepts a valid custom accent and page size', () => {
        const r = validate({ meta: { theme: { accent: '#Ff8800', pageSize: 'LETTER' } } });
        expect(r.meta.theme.accent).toBe('#Ff8800');
        expect(r.meta.theme.pageSize).toBe('LETTER');
    });

    it('falls back when margins are malformed', () => {
        expect(validate({ meta: { theme: { margins: [1, 2] } } }).meta.theme.margins).toHaveLength(4);
        expect(validate({ meta: { theme: { margins: 'x' } } }).meta.theme.margins).toEqual(defaultTheme().margins);
    });

    it('respects explicit section-visibility booleans, ignoring non-booleans', () => {
        const r = validate({ meta: { sectionVisibility: { work: false, skills: 'yes' } } });
        expect(r.meta.sectionVisibility.work).toBe(false);
        expect(r.meta.sectionVisibility.skills).toBe(true); // non-boolean ignored -> default
        expect(r.meta.sectionVisibility.education).toBe(true);
    });

    it('repairs custom sections, generating ids where missing', () => {
        const r = validate({ meta: { customSections: [{ title: 'Talks', items: [{ title: 'A' }, null] }] } });
        expect(r.meta.customSections).toHaveLength(1);
        expect(r.meta.customSections[0].id).toBeTruthy();
        expect(r.meta.customSections[0].items[0]).toEqual({ title: 'A', description: '' });
        expect(r.meta.customSections[0].items[1]).toEqual({ title: '', description: '' });
    });

    it('coerces a non-numeric updatedAt to a number', () => {
        expect(validate({ updatedAt: 'yesterday' }).updatedAt).toBeTypeOf('number');
    });
});

describe('isEmptyResume', () => {
    it('is true for a fresh resume', () => {
        expect(isEmptyResume(defaultResume())).toBe(true);
    });

    it.each([
        ['name', (r) => (r.basics.name = 'Jane')],
        ['summary', (r) => (r.basics.summary = 'Hi')],
        ['a skill', (r) => r.skills.push({ name: 'x', level: '', keywords: [] })],
        ['a custom item', (r) => r.meta.customSections.push({ id: 'c', title: 't', items: [{ title: 'a', description: '' }] })],
    ])('is false once %s exists', (_label, mutate) => {
        const r = defaultResume();
        mutate(r);
        expect(isEmptyResume(r)).toBe(false);
    });

    it('is true even with empty custom-section shells', () => {
        const r = defaultResume();
        r.meta.customSections.push({ id: 'c', title: 'Empty', items: [] });
        expect(isEmptyResume(r)).toBe(true);
    });
});
