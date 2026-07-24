import { describe, it, expect } from 'vitest';
import { toJsonResume, fromJsonResume } from '@/utils/resume/jsonResume';
import { defaultResume } from '@/utils/resume/schema';

function sampleDoc() {
    const d = defaultResume('Sample');
    d.basics.name = 'Jane Doe';
    d.basics.email = 'jane@example.com';
    d.basics.photo = 'data:image/png;base64,AAAA';
    d.basics.profiles.push({ network: 'GitHub', username: 'jane', url: 'https://github.com/jane' });
    d.work.push({ name: 'Acme', position: 'Engineer', startDate: '2020-01', endDate: '', location: 'Remote', summary: '', highlights: ['Shipped X'] });
    d.skills.push({ name: 'Languages', level: '', keywords: ['TypeScript', 'Go'] });
    return d;
}

describe('toJsonResume', () => {
    it('emits a spec-shaped document', () => {
        const json = toJsonResume(sampleDoc());
        expect(json.$schema).toContain('jsonresume');
        expect(json.basics.name).toBe('Jane Doe');
        expect(json.basics.image).toBe('data:image/png;base64,AAAA');
        expect(json.work[0].position).toBe('Engineer');
        expect(json.skills[0].keywords).toEqual(['TypeScript', 'Go']);
    });
});

describe('fromJsonResume', () => {
    it('round-trips core data through export + import', () => {
        const original = sampleDoc();
        const back = fromJsonResume(toJsonResume(original));
        expect(back.basics.name).toBe('Jane Doe');
        expect(back.basics.email).toBe('jane@example.com');
        expect(back.basics.photo).toBe('data:image/png;base64,AAAA'); // image -> photo
        expect(back.work).toHaveLength(1);
        expect(back.work[0].highlights).toEqual(['Shipped X']);
        expect(back.skills[0].keywords).toEqual(['TypeScript', 'Go']);
    });

    it('accepts a JSON string and always returns a complete resume', () => {
        const r = fromJsonResume('{"basics":{"name":"Bob"}}');
        expect(r.basics.name).toBe('Bob');
        expect(Array.isArray(r.work)).toBe(true);
        expect(r.meta.template).toBe('classic');
    });

    it('falls back gracefully on invalid input', () => {
        const r = fromJsonResume('not json', { name: 'Imported' });
        expect(r.name).toBe('Imported');
        expect(r.basics.name).toBe('');
    });
});
