import { describe, it, expect } from 'vitest';
import { extractKeywords, analyze, resumeText } from '@/utils/resume/ats';
import { defaultResume } from '@/utils/resume/schema';

describe('extractKeywords', () => {
    it('ranks salient words and drops stop-words', () => {
        const kws = extractKeywords('We need a React developer. React, TypeScript and GraphQL.');
        expect(kws).toContain('react');
        expect(kws).toContain('typescript');
        expect(kws).toContain('graphql');
        expect(kws).not.toContain('we');
        expect(kws).not.toContain('and');
        // "react" appears twice -> should outrank single-occurrence words.
        expect(kws[0]).toBe('react');
    });
});

describe('resumeText', () => {
    it('flattens all user text to a lowercased blob', () => {
        const d = defaultResume();
        d.basics.summary = 'Senior TypeScript engineer';
        d.skills.push({ name: 'Lang', level: '', keywords: ['React'] });
        const text = resumeText(d);
        expect(text).toContain('typescript');
        expect(text).toContain('react');
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

    it('returns a zero score for an empty job description', () => {
        expect(analyze(defaultResume(), '').score).toBe(0);
    });

    it('warns about a missing email/phone and an included photo', () => {
        const d = defaultResume();
        d.basics.photo = 'data:image/png;base64,AAAA';
        const report = analyze(d, 'anything here');
        expect(report.warnings.some((w) => /photo/i.test(w))).toBe(true);
        expect(report.warnings.some((w) => /email or phone/i.test(w))).toBe(true);
    });

    it('matches on word boundaries (react != reaction)', () => {
        const d = defaultResume();
        d.basics.summary = 'Built a reaction test';
        const report = analyze(d, 'react');
        expect(report.missing).toContain('react');
    });
});
