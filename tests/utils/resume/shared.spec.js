import { describe, it, expect } from 'vitest';
import {
    fmtDate,
    dateRange,
    contentWidth,
    contactRuns,
    buildSections,
    baseDoc,
    SECTION_LABELS,
    PAGE_DIMENSIONS,
} from '@/utils/resume/templates/shared';
import { defaultResume, defaultTheme, SECTION_ORDER } from '@/utils/resume/schema';
import { fullResume } from './fixtures';

describe('fmtDate', () => {
    it.each([
        ['2020-01', 'Jan 2020'],
        ['2020-12-31', 'Dec 2020'],
        ['2020', '2020'],
        ['2020-13', '2020'], // invalid month -> just the year
        ['Present', 'Present'], // free text passes through
        ['', ''],
    ])('formats %s -> %s', (input, expected) => {
        expect(fmtDate(input)).toBe(expected);
    });
});

describe('dateRange', () => {
    it('joins start and end', () => {
        expect(dateRange('2020-01', '2021-06')).toBe('Jan 2020 – Jun 2021');
    });
    it('shows Present for an open end date', () => {
        expect(dateRange('2020-01', '')).toBe('Jan 2020 – Present');
    });
    it('handles end-only and empty', () => {
        expect(dateRange('', '2021')).toBe('2021');
        expect(dateRange('', '')).toBe('');
    });
});

describe('contentWidth', () => {
    it('computes usable width from page size and margins', () => {
        const theme = { ...defaultTheme(), pageSize: 'A4', margins: [40, 40, 40, 40] };
        expect(contentWidth(theme)).toBeCloseTo(PAGE_DIMENSIONS.A4[0] - 80, 2);
    });
    it('reflects LETTER width', () => {
        const theme = { ...defaultTheme(), pageSize: 'LETTER', margins: [50, 40, 30, 40] };
        expect(contentWidth(theme)).toBeCloseTo(PAGE_DIMENSIONS.LETTER[0] - 80, 2);
    });
});

describe('contactRuns', () => {
    it('builds inline runs with an email mailto link and separators', () => {
        const runs = contactRuns(fullResume(), '#123456');
        const emailRun = runs.find((r) => r.link === 'mailto:ada@example.com');
        expect(emailRun).toBeTruthy();
        expect(emailRun.color).toBe('#123456');
        // separators are inserted between entries
        expect(runs.some((r) => typeof r.text === 'string' && r.text.includes('•'))).toBe(true);
        // profiles surface
        expect(JSON.stringify(runs)).toContain('GitHub');
    });
    it('returns an empty array when there is nothing to show', () => {
        expect(contactRuns(defaultResume(), '#000000')).toEqual([]);
    });
});

describe('buildSections', () => {
    const heading = (title) => ({ __heading: title });

    it('emits a heading for every visible, non-empty section, in order', () => {
        const out = buildSections(fullResume(), defaultTheme(), heading);
        const headings = out.filter((n) => n.__heading).map((n) => n.__heading);
        expect(headings).toContain('Experience');
        expect(headings).toContain('Education');
        expect(headings).toContain('Publications'); // custom section
        // custom sections always render last
        expect(headings[headings.length - 1]).toBe('Publications');
        // standard-section order follows sectionsOrder
        expect(headings.indexOf('Experience')).toBeLessThan(headings.indexOf('Education'));
    });

    it('skips hidden and empty sections', () => {
        const d = fullResume();
        d.meta.sectionVisibility.work = false;
        d.education = [];
        const headings = buildSections(d, defaultTheme(), heading)
            .filter((n) => n.__heading)
            .map((n) => n.__heading);
        expect(headings).not.toContain('Experience');
        expect(headings).not.toContain('Education');
        expect(headings).toContain('Skills');
    });

    it('produces nothing for an empty resume', () => {
        expect(buildSections(defaultResume(), defaultTheme(), heading)).toEqual([]);
    });
});

describe('SECTION_LABELS + baseDoc', () => {
    it('has a label for every standard section', () => {
        for (const key of SECTION_ORDER) expect(SECTION_LABELS[key]).toBeTruthy();
    });
    it('baseDoc wires page size, margins and default style', () => {
        const theme = defaultTheme();
        const def = baseDoc(defaultResume('Doc'), theme, [{ text: 'x' }]);
        expect(def.pageSize).toBe(theme.pageSize);
        expect(def.pageMargins).toEqual(theme.margins);
        expect(def.defaultStyle.font).toBe('Roboto');
        expect(def.defaultStyle.fontSize).toBe(theme.fontSize);
        expect(def.content).toHaveLength(1);
    });
});
