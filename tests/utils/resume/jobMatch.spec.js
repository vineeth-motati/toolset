/**
 * Job-description matching (utils/resume/jobMatch.ts). This replaced a
 * word-frequency counter, so the tests lean on the cases that one got wrong:
 * boilerplate, multi-word terms, and generic recruiting prose.
 */
import { describe, it, expect } from 'vitest';
import {
    matchJob,
    extractJobTerms,
    jobLines,
    resumeSectionTexts,
    detectJobHeadline,
} from '@/utils/resume/jobMatch';
import { defaultResume } from '@/utils/resume/schema';
import { sampleResume } from '@/utils/resume/sample';
import { fullResume } from './fixtures';

const keys = (terms) => terms.map((t) => t.key);

const POSTING = `
Senior Frontend Engineer — Northwind Software

About us
We are a fast-paced, dynamic company changing the world.

Requirements
- 5+ years of experience with React and TypeScript
- Strong background in design systems and component libraries
- Experience with unit testing and CI/CD pipelines
- Familiarity with Kubernetes is a plus

Benefits
- Competitive salary and a generous benefits package
- 401(k) matching and unlimited PTO

We are an equal opportunity employer and consider all applicants without regard to race.
`;

describe('jobLines', () => {
    it('drops EEO, benefits and about-us boilerplate', () => {
        const text = jobLines(POSTING).map((l) => l.text).join(' ');
        expect(text).not.toMatch(/equal opportunity/i);
        expect(text).not.toMatch(/401/);
        expect(text).not.toMatch(/competitive salary/i);
        expect(text).not.toMatch(/unlimited pto/i);
    });

    it('weights lines under a requirements heading above prose', () => {
        const lines = jobLines(POSTING);
        const react = lines.find((l) => /React and TypeScript/.test(l.text));
        expect(react.weight).toBeGreaterThan(1);
    });

    it('flags lines that state a hard requirement', () => {
        const lines = jobLines(POSTING);
        expect(lines.find((l) => /5\+ years/.test(l.text)).must).toBe(true);
        expect(lines.find((l) => /Strong background/.test(l.text)).must).toBe(true);
        expect(lines.find((l) => /a plus/.test(l.text)).must).toBe(false);
    });

    it('strips bullet markers from the text it keeps', () => {
        expect(jobLines('- React\n• Vue').map((l) => l.text)).toEqual(['React', 'Vue']);
    });

    it('returns nothing for blank input', () => {
        expect(jobLines('')).toEqual([]);
        expect(jobLines('   \n  \n')).toEqual([]);
    });
});

describe('extractJobTerms', () => {
    it('surfaces the named technologies', () => {
        const k = keys(extractJobTerms(POSTING));
        expect(k).toEqual(expect.arrayContaining(['react', 'typescript', 'kubernetes']));
    });

    it('keeps multi-word terms instead of splitting them', () => {
        const k = keys(extractJobTerms(POSTING));
        expect(k).toContain('design systems');
        // The phrase covers the parts, so the bare words are dropped as noise.
        expect(k).not.toContain('systems');
    });

    it('does not surface generic recruiting prose', () => {
        const k = keys(extractJobTerms(POSTING));
        for (const noise of ['experience', 'years', 'strong', 'familiarity', 'company', 'world', 'applicants']) {
            expect(k).not.toContain(noise);
        }
    });

    it('never offers the job title or the employer as a gap', () => {
        const k = keys(extractJobTerms(POSTING, 40));
        expect(k).not.toContain('northwind');
        expect(k).not.toContain('northwind software');
        expect(k).not.toContain('frontend engineer');
    });

    it('drops generic nouns that are not terms in their own right', () => {
        const k = keys(extractJobTerms(POSTING, 40));
        for (const noise of ['applications', 'reusable', 'communication', 'building', 'professional']) {
            expect(k).not.toContain(noise);
        }
    });

    it('still keeps a multi-word requirement built from generic nouns', () => {
        const k = keys(extractJobTerms('Requirements\n- Strong background in design systems and component libraries'));
        expect(k).toContain('component libraries');
    });

    it('chains two overlapping phrases into the whole requirement', () => {
        const k = keys(
            extractJobTerms('Requirements\n- Experience building reusable component libraries')
        );
        expect(k).toContain('reusable component libraries');
        expect(k).not.toContain('reusable component');
        expect(k).not.toContain('component libraries');
    });

    it('does not mistake a requirement cue word for a requirement', () => {
        const k = keys(extractJobTerms(POSTING, 30));
        for (const cue of ['deep', 'strong', 'extensive', 'advanced', 'background', 'minimum']) {
            expect(k).not.toContain(cue);
        }
    });

    it('marks stated requirements as must and extras as nice', () => {
        const terms = extractJobTerms(POSTING);
        const react = terms.find((t) => t.key === 'react');
        const k8s = terms.find((t) => t.key === 'kubernetes');
        expect(react.priority).toBe('must');
        expect(k8s.priority).toBe('nice');
    });

    it('preserves the casing the ad used, for display', () => {
        const terms = extractJobTerms(POSTING);
        expect(terms.find((t) => t.key === 'typescript').term).toBe('TypeScript');
        expect(terms.find((t) => t.key === 'kubernetes').term).toBe('Kubernetes');
    });

    it('keeps tokens carrying symbols in one piece', () => {
        const k = keys(extractJobTerms('Requirements\n- Strong C++ and C# with Node.js and CI/CD'));
        expect(k).toEqual(expect.arrayContaining(['c++', 'c#']));
        expect(k.some((x) => x.includes('node.js'))).toBe(true);
    });

    it('does not build a phrase across a bracket or comma', () => {
        const k = keys(extractJobTerms('Requirements\n- Deep understanding of web performance and accessibility (WCAG)'));
        expect(k).not.toContain('accessibility wcag');
    });

    it('keeps one ordering of a phrase seen from both sides of a conjunction', () => {
        const k = keys(extractJobTerms('Requirements\n- Experience with unit testing, end-to-end testing and CI/CD pipelines'));
        expect(k).toContain('end-to-end testing');
        expect(k).not.toContain('testing end-to-end');
    });

    it('caps must-haves so the flag keeps meaning something', () => {
        const tools = ['Kafka', 'Redis', 'Postgres', 'Terraform', 'Ansible', 'Grafana',
            'Elasticsearch', 'Rabbitmq', 'Cassandra', 'Snowflake', 'Airflow', 'Datadog'];
        const shouty = [
            'Platform Engineer',
            'Requirements',
            ...tools.map((t) => `- Strong experience with ${t} is required`),
        ].join('\n');
        const terms = extractJobTerms(shouty, 30);
        const musts = terms.filter((t) => t.priority === 'must');
        expect(terms.length).toBeGreaterThan(6);
        expect(musts.length).toBe(6);
    });

    it('gives the cap to the strongest terms', () => {
        const terms = extractJobTerms(POSTING);
        const musts = terms.filter((t) => t.priority === 'must');
        const nices = terms.filter((t) => t.priority === 'nice');
        if (musts.length && nices.length) {
            expect(Math.min(...musts.map((t) => t.weight))).toBeGreaterThanOrEqual(
                Math.max(...nices.filter((n) => n.weight <= Math.min(...musts.map((m) => m.weight))).map((n) => n.weight), 0)
            );
        }
    });

    it('respects the limit and sorts strongest first', () => {
        const terms = extractJobTerms(POSTING, 4);
        expect(terms).toHaveLength(4);
        const weights = terms.map((t) => t.weight);
        expect([...weights].sort((a, b) => b - a)).toEqual(weights);
    });

    it('returns nothing for an empty or boilerplate-only posting', () => {
        expect(extractJobTerms('')).toEqual([]);
        expect(extractJobTerms('We are an equal opportunity employer.')).toEqual([]);
    });
});

describe('detectJobHeadline', () => {
    it('splits a title from an employer on a dash', () => {
        expect(detectJobHeadline(POSTING)).toEqual({
            title: 'Senior Frontend Engineer',
            company: 'Northwind Software',
        });
    });

    it('handles the "at" form and a bare title', () => {
        expect(detectJobHeadline('Data Analyst at Acme\n\nRequirements')).toEqual({
            title: 'Data Analyst',
            company: 'Acme',
        });
        expect(detectJobHeadline('Product Designer\n\nRequirements')).toEqual({
            title: 'Product Designer',
            company: '',
        });
    });

    it('declines to guess when the first line is prose or boilerplate', () => {
        expect(detectJobHeadline('We are looking for someone great to join our team today.')).toEqual({
            title: '',
            company: '',
        });
        expect(detectJobHeadline('')).toEqual({ title: '', company: '' });
    });
});

describe('resumeSectionTexts', () => {
    it('labels each section so a match can say where it lives', () => {
        const sections = resumeSectionTexts(fullResume());
        const byLabel = Object.fromEntries(sections.map((s) => [s.label, s.text]));
        expect(byLabel.Skills).toContain('typescript');
        expect(byLabel.Experience).toContain('build time');
        expect(byLabel.Publications).toContain('bernoulli');
    });

    it('lowercases and pads for boundary matching', () => {
        for (const s of resumeSectionTexts(fullResume())) {
            expect(s.text).toBe(s.text.toLowerCase());
            expect(s.text.startsWith(' ')).toBe(true);
            expect(s.text.endsWith(' ')).toBe(true);
        }
    });
});

describe('matchJob', () => {
    it('splits terms into matched and missing', () => {
        const match = matchJob(sampleResume(), POSTING);
        expect(keys(match.matched)).toEqual(expect.arrayContaining(['react', 'typescript']));
        expect(keys(match.missing)).toContain('kubernetes');
        expect(match.matched.length + match.missing.length).toBe(match.terms.length);
    });

    it('reports which section already covers a matched term', () => {
        const match = matchJob(sampleResume(), POSTING);
        expect(match.matched.find((t) => t.key === 'react').where).toBeTruthy();
    });

    it('separates missing requirements from missing extras', () => {
        const doc = defaultResume();
        const match = matchJob(doc, POSTING);
        expect(keys(match.criticalMissing)).toContain('react');
        expect(keys(match.criticalMissing)).not.toContain('kubernetes');
        match.criticalMissing.forEach((t) => expect(t.priority).toBe('must'));
    });

    it('weights a missing requirement more heavily than a missing extra', () => {
        const base = defaultResume();
        base.skills = [{ name: 'S', level: '', keywords: [] }];

        const withNice = defaultResume();
        withNice.skills = [{ name: 'S', level: '', keywords: ['Kubernetes'] }];

        const withMust = defaultResume();
        withMust.skills = [{ name: 'S', level: '', keywords: ['React'] }];

        const nice = matchJob(withNice, POSTING).score;
        const must = matchJob(withMust, POSTING).score;
        expect(must).toBeGreaterThan(nice);
    });

    it('scores an empty resume at zero and a matching one highly', () => {
        expect(matchJob(defaultResume(), POSTING).score).toBe(0);
        const strong = matchJob(sampleResume(), POSTING).score;
        expect(strong).toBeGreaterThan(40);
    });

    it('returns an empty result for a blank job description', () => {
        const match = matchJob(sampleResume(), '');
        expect(match).toEqual({
            score: 0,
            terms: [],
            matched: [],
            missing: [],
            criticalMissing: [],
        });
    });

    it('matches on word boundaries, not substrings', () => {
        const doc = defaultResume();
        doc.basics.summary = 'Built a reaction test harness';
        const match = matchJob(doc, 'Requirements\n- Strong React experience');
        expect(keys(match.missing)).toContain('react');
    });

    it('tolerates a plural in the resume', () => {
        const doc = defaultResume();
        doc.skills = [{ name: 'Tools', level: '', keywords: ['Pipelines'] }];
        const match = matchJob(doc, 'Requirements\n- Must have pipeline ownership');
        expect(keys(match.missing)).not.toContain('pipeline');
    });

    it('never exceeds the 0-100 range', () => {
        for (const doc of [defaultResume(), sampleResume(), fullResume()]) {
            const { score } = matchJob(doc, POSTING);
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
        }
    });
});
