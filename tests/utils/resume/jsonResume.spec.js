import { describe, it, expect } from 'vitest';
import { toJsonResume, fromJsonResume } from '@/utils/resume/jsonResume';
import { defaultResume } from '@/utils/resume/schema';
import { fullResume, TINY_PNG } from './fixtures';

describe('toJsonResume', () => {
    it('emits a spec-shaped document with every section', () => {
        const json = toJsonResume(fullResume());
        expect(json.$schema).toContain('jsonresume');
        expect(json.basics.name).toBe('Ada Lovelace');
        expect(json.basics.image).toBe(TINY_PNG);
        expect(json.basics.location.city).toBe('London');
        expect(json.basics.profiles).toHaveLength(2);
        expect(json.work[0].position).toBe('Principal Engineer');
        expect(json.work[0].highlights).toContain('Cut build time by 60%');
        expect(json.education[0].institution).toBe('University of London');
        expect(json.skills[0].keywords).toEqual(['TypeScript', 'Go', 'Python']);
        expect(json.projects[0].url).toContain('openmetrics');
        expect(json.certificates[0].issuer).toBe('CNCF');
        expect(json.awards[0].title).toBe('Engineer of the Year');
        expect(json.languages).toHaveLength(2);
        expect(json.interests[0].keywords).toContain('strategy');
        expect(json.references[0].name).toBe('Charles Babbage');
    });

    it('omits image when there is no photo', () => {
        const json = toJsonResume(defaultResume());
        expect(json.basics.image).toBeUndefined();
    });
});

describe('fromJsonResume', () => {
    it('round-trips every section through export + import', () => {
        const original = fullResume();
        const back = fromJsonResume(toJsonResume(original));
        expect(back.basics.name).toBe('Ada Lovelace');
        expect(back.basics.email).toBe('ada@example.com');
        expect(back.basics.photo).toBe(TINY_PNG); // image -> photo
        expect(back.basics.profiles).toHaveLength(2);
        expect(back.work).toHaveLength(2);
        expect(back.work[0].highlights).toEqual(['Cut build time by 60%', 'Mentored 5 engineers']);
        expect(back.education[0].score).toBe('First Class');
        expect(back.skills[1].keywords).toEqual(['AWS', 'Kubernetes']);
        expect(back.projects[0].name).toBe('OpenMetrics');
        expect(back.certificates[0].name).toBe('CKA');
        expect(back.awards[0].awarder).toBe('Analytical Engines Ltd');
        expect(back.languages[1].fluency).toBe('Professional');
        expect(back.references[0].reference).toBe('Available on request.');
    });

    it('always returns a complete, valid resume from partial input', () => {
        const r = fromJsonResume({ basics: { name: 'Bob' } });
        expect(r.basics.name).toBe('Bob');
        expect(Array.isArray(r.work)).toBe(true);
        expect(r.meta.template).toBe('classic');
        expect(r.meta.sectionsOrder).toHaveLength(9);
    });

    it('accepts a JSON string', () => {
        const r = fromJsonResume('{"basics":{"name":"Grace","email":"g@x.io"}}');
        expect(r.basics.name).toBe('Grace');
        expect(r.basics.email).toBe('g@x.io');
    });

    it('honours explicit name/id options', () => {
        const r = fromJsonResume({ basics: { name: 'X' } }, { name: 'My Import', id: 'fixed-id' });
        expect(r.name).toBe('My Import');
        expect(r.id).toBe('fixed-id');
    });

    it('falls back gracefully on invalid input', () => {
        const r = fromJsonResume('not json at all', { name: 'Imported' });
        expect(r.name).toBe('Imported');
        expect(r.basics.name).toBe('');
        expect(r.work).toEqual([]);
    });

    it('ignores non-array section fields', () => {
        const r = fromJsonResume({ work: 'oops', skills: null });
        expect(r.work).toEqual([]);
        expect(r.skills).toEqual([]);
    });
});
