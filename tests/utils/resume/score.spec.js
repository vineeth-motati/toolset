/**
 * Resume scoring (utils/resume/score.ts) — the multi-category read-out driving
 * the review panel and the nav-rail dial.
 */
import { describe, it, expect } from 'vitest';
import {
    analyzeResume,
    sectionCompleteness,
    basicsCompleteness,
    dateOrder,
    isParseableDate,
} from '@/utils/resume/score';
import { defaultResume } from '@/utils/resume/schema';
import { sampleResume } from '@/utils/resume/sample';
import { fullResume } from './fixtures';

const idsOf = (score) => score.issues.map((i) => i.id);

describe('analyzeResume — shape', () => {
    it('returns all five weighted categories that sum to 100', () => {
        const s = analyzeResume(fullResume());
        expect(s.categories.map((c) => c.key)).toEqual([
            'completeness',
            'impact',
            'clarity',
            'format',
            'ats',
        ]);
        expect(s.categories.reduce((sum, c) => sum + c.weight, 0)).toBe(100);
    });

    it('clamps every score into 0-100', () => {
        for (const doc of [defaultResume(), fullResume(), sampleResume()]) {
            const s = analyzeResume(doc);
            expect(s.total).toBeGreaterThanOrEqual(0);
            expect(s.total).toBeLessThanOrEqual(100);
            s.categories.forEach((c) => {
                expect(c.score).toBeGreaterThanOrEqual(0);
                expect(c.score).toBeLessThanOrEqual(100);
            });
        }
    });

    it('sorts issues errors-first', () => {
        const severities = analyzeResume(defaultResume()).issues.map((i) => i.severity);
        const rank = { error: 0, warning: 1, tip: 2 };
        const sorted = [...severities].sort((a, b) => rank[a] - rank[b]);
        expect(severities).toEqual(sorted);
    });

    it('gives every issue a unique id', () => {
        const ids = idsOf(analyzeResume(defaultResume()));
        expect(new Set(ids).size).toBe(ids.length);
    });
});

describe('analyzeResume — grading', () => {
    it('rates an empty resume poorly', () => {
        const s = analyzeResume(defaultResume());
        expect(s.grade).toBe('poor');
        expect(s.total).toBeLessThan(45);
        expect(idsOf(s)).toEqual(expect.arrayContaining(['no-name', 'no-contact', 'no-history']));
    });

    it('rates the bundled example well', () => {
        const s = analyzeResume(sampleResume());
        expect(s.total).toBeGreaterThanOrEqual(70);
        expect(s.issues.filter((i) => i.severity === 'error')).toHaveLength(0);
    });
});

describe('analyzeResume — completeness checks', () => {
    it('flags a malformed email', () => {
        const d = defaultResume();
        d.basics.email = 'not-an-email';
        expect(idsOf(analyzeResume(d))).toContain('bad-email');
    });

    it('flags a missing phone separately once an email exists', () => {
        const d = defaultResume();
        d.basics.email = 'a@b.co';
        const ids = idsOf(analyzeResume(d));
        expect(ids).toContain('no-phone');
        expect(ids).not.toContain('no-contact');
    });

    it('points each issue at a jumpable target', () => {
        const s = analyzeResume(defaultResume());
        const named = s.issues.find((i) => i.id === 'no-name');
        expect(named.target).toEqual({ section: 'basics' });
    });
});

describe('analyzeResume — impact checks', () => {
    it('flags a role with no bullets and targets its index', () => {
        const d = sampleResume();
        d.work[1].highlights = [];
        const issue = analyzeResume(d).issues.find((i) => i.id === 'work-nobullets-1');
        expect(issue).toBeDefined();
        expect(issue.target).toEqual({ section: 'work', index: 1 });
    });

    it('flags bullets with no numbers', () => {
        const d = sampleResume();
        d.work.forEach((w) => (w.highlights = ['Led the platform team', 'Built the reporting UI']));
        d.projects = [];
        expect(idsOf(analyzeResume(d))).toContain('few-metrics');
    });

    it('flags duty language', () => {
        const d = sampleResume();
        d.work[0].highlights = ['Responsible for the deployment pipeline'];
        expect(idsOf(analyzeResume(d))).toContain('weak-phrases');
    });

    it('flags a verb used to open three or more bullets', () => {
        const d = sampleResume();
        d.work[0].highlights = [
            'Built the billing service handling 4k requests per second',
            'Built the reporting UI used by 300 analysts',
            'Built the design system adopted by 6 teams',
        ];
        expect(idsOf(analyzeResume(d))).toContain('repeated-verbs');
    });
});

describe('analyzeResume — clarity checks', () => {
    it('flags an overlong summary', () => {
        const d = sampleResume();
        d.basics.summary = 'word '.repeat(80);
        expect(idsOf(analyzeResume(d))).toContain('summary-long');
    });

    it('flags pronouns in bullets', () => {
        const d = sampleResume();
        d.work[0].highlights = ['I shipped the billing service in 6 weeks'];
        expect(idsOf(analyzeResume(d))).toContain('pronouns');
    });
});

describe('analyzeResume — format checks', () => {
    it('flags a resume over two pages when the page count is known', () => {
        const s = analyzeResume(sampleResume(), { pageCount: 3 });
        expect(idsOf(s)).toContain('too-long');
        expect(s.issues.find((i) => i.id === 'too-long').target).toEqual({ section: 'design' });
    });

    it('says nothing about length when the page count is unknown', () => {
        expect(idsOf(analyzeResume(sampleResume()))).not.toContain('too-long');
    });

    it('flags a missing start date and an unparseable one', () => {
        const d = sampleResume();
        d.work[0].startDate = '';
        d.work[1].startDate = 'sometime in 2018';
        const ids = idsOf(analyzeResume(d));
        expect(ids).toContain('work-nodate-0');
        expect(ids).toContain('work-baddate-1');
    });

    it('flags a range that ends before it starts', () => {
        const d = sampleResume();
        d.work[1].startDate = '2021-02';
        d.work[1].endDate = '2018-06';
        expect(idsOf(analyzeResume(d))).toContain('work-reversed-1');
    });

    it('flags a tiny font size', () => {
        const d = sampleResume();
        d.meta.theme.fontSize = 8;
        expect(idsOf(analyzeResume(d))).toContain('font-small');
    });
});

describe('analyzeResume — ATS checks', () => {
    it('flags a photo', () => {
        expect(idsOf(analyzeResume(fullResume()))).toContain('photo');
    });

    it('reports weak keyword coverage against a job description', () => {
        const d = sampleResume();
        const jd = 'Seeking a Kubernetes and Terraform platform engineer with Golang and Kafka experience.';
        const ids = idsOf(analyzeResume(d, { jobDescription: jd }));
        expect(ids).toContain('jd-coverage');
    });

    it('stays quiet about keywords when no job description is given', () => {
        const ids = idsOf(analyzeResume(sampleResume()));
        expect(ids).not.toContain('jd-coverage');
        expect(ids).not.toContain('jd-coverage-mid');
    });
});

describe('stats', () => {
    it('counts bullets across work and projects', () => {
        const { stats } = analyzeResume(sampleResume());
        // 4 + 3 work bullets, 2 project bullets
        expect(stats.bullets).toBe(9);
        expect(stats.quantifiedBullets).toBeGreaterThan(0);
        expect(stats.verbLedBullets).toBeGreaterThan(0);
        expect(stats.words).toBeGreaterThan(50);
        expect(stats.sectionsFilled).toBeGreaterThan(3);
    });

    it('reports zeros for an empty resume without dividing by zero', () => {
        const { stats } = analyzeResume(defaultResume());
        expect(stats.bullets).toBe(0);
        expect(stats.quantifiedBullets).toBe(0);
        expect(stats.sectionsFilled).toBe(0);
    });
});

describe('date helpers', () => {
    it('orders year-month values', () => {
        expect(dateOrder('2021-03')).toBeGreaterThan(dateOrder('2021-01'));
        expect(dateOrder('2021')).toBeLessThan(dateOrder('2022'));
        expect(dateOrder('')).toBeNull();
        expect(dateOrder('Present')).toBeNull();
    });

    it('accepts the shapes templates can format', () => {
        expect(isParseableDate('')).toBe(true);
        expect(isParseableDate('2021')).toBe(true);
        expect(isParseableDate('2021-03')).toBe(true);
        expect(isParseableDate('2021-03-15')).toBe(true);
        expect(isParseableDate('Present')).toBe(true);
        expect(isParseableDate('March 2021')).toBe(false);
    });
});

describe('completeness helpers', () => {
    it('reports basics completeness from 0 to 100', () => {
        expect(basicsCompleteness(defaultResume())).toBe(0);
        expect(basicsCompleteness(sampleResume())).toBe(100);
    });

    it('reports 0 for an empty section and 100 when every entry has content', () => {
        expect(sectionCompleteness(defaultResume(), 'work')).toBe(0);
        expect(sectionCompleteness(sampleResume(), 'work')).toBe(100);
    });

    it('reports a partial score when some entries are blank', () => {
        const d = sampleResume();
        d.work.push({ name: '', position: '', startDate: '', endDate: '', location: '', summary: '', highlights: [] });
        expect(sectionCompleteness(d, 'work')).toBe(67);
    });
});
