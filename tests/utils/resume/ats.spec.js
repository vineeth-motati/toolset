import { describe, it, expect } from 'vitest';
import { extractKeywords, analyze, resumeText } from '@/utils/resume/ats';
import { defaultResume } from '@/utils/resume/schema';
import { fullResume } from './fixtures';

describe('extractKeywords', () => {
    it('ranks salient words and drops stop-words', () => {
        const kws = extractKeywords('We need a React developer. React, TypeScript and GraphQL.');
        expect(kws).toContain('react');
        expect(kws).toContain('typescript');
        expect(kws).toContain('graphql');
        expect(kws).not.toContain('we');
        expect(kws).not.toContain('and');
        expect(kws[0]).toBe('react'); // appears twice -> ranks first
    });

    it('ignores single-character tokens and respects the limit', () => {
        const kws = extractKeywords('a b c react vue angular svelte solid qwik', 3);
        expect(kws).toHaveLength(3);
        expect(kws).not.toContain('a');
    });

    it('keeps tech tokens with symbols intact', () => {
        const kws = extractKeywords('Strong C++ and C# plus Node.js experience');
        expect(kws).toContain('c++');
        expect(kws).toContain('c#');
        expect(kws).toContain('node.js');
    });

    it('returns an empty list for blank input', () => {
        expect(extractKeywords('')).toEqual([]);
        expect(extractKeywords('the and of to')).toEqual([]);
    });
});

describe('resumeText', () => {
    it('flattens all sections to a lowercased blob', () => {
        const text = resumeText(fullResume());
        expect(text).toContain('typescript');
        expect(text).toContain('kubernetes');
        expect(text).toContain('openmetrics');
        expect(text).toContain('chess');
        expect(text).toContain('publications'); // custom section title
        expect(text).toBe(text.toLowerCase());
    });
});

describe('analyze', () => {
    it('scores keyword coverage and lists matched/missing', () => {
        const d = defaultResume();
        d.basics.summary = 'TypeScript expert';
        d.skills.push({ name: 'Lang', level: '', keywords: ['React'] });
        const report = analyze(d, 'React TypeScript GraphQL');
        expect(report.matched).toEqual(expect.arrayContaining(['react', 'typescript']));
        expect(report.missing).toContain('graphql');
        expect(report.score).toBe(67); // 2 of 3
    });

    it('scores a strong match highly against the full resume', () => {
        const report = analyze(fullResume(), 'TypeScript Go Kubernetes AWS engineer');
        expect(report.score).toBeGreaterThanOrEqual(80);
        expect(report.missing).not.toContain('typescript');
    });

    it('returns a zero score for an empty job description', () => {
        const report = analyze(defaultResume(), '');
        expect(report.score).toBe(0);
        expect(report.matched).toEqual([]);
        expect(report.missing).toEqual([]);
    });

    it('matches on word boundaries (react != reaction)', () => {
        const d = defaultResume();
        d.basics.summary = 'Built a reaction test';
        expect(analyze(d, 'react').missing).toContain('react');
    });

    it.each([
        ['photo', (d) => (d.basics.photo = 'data:image/png;base64,AAAA'), /photo/i],
        ['missing contact', (d) => {}, /email or phone/i],
        ['no summary', (d) => {}, /summary/i],
    ])('warns about %s', (_label, mutate, re) => {
        const d = defaultResume();
        mutate(d);
        const report = analyze(d, 'anything relevant here');
        expect(report.warnings.some((w) => re.test(w))).toBe(true);
    });

    it('warns when work entries have no highlights', () => {
        const d = defaultResume();
        d.basics.email = 'a@b.c';
        d.basics.phone = '123';
        d.basics.summary = 'x';
        d.work.push({ name: 'Co', position: 'Dev', startDate: '', endDate: '', location: '', summary: '', highlights: [] });
        const report = analyze(d, 'developer');
        expect(report.warnings.some((w) => /bullet/i.test(w))).toBe(true);
    });

    it('produces no warnings for a complete, photo-free resume', () => {
        const d = fullResume();
        d.basics.photo = '';
        const report = analyze(d, 'engineer typescript');
        expect(report.warnings).toEqual([]);
    });
});
