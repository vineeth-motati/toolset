import { describe, it, expect } from 'vitest';
import { toPlainText } from '@/utils/resume/plainText';
import { defaultResume } from '@/utils/resume/schema';
import { fullResume } from './fixtures';

describe('toPlainText', () => {
    const text = toPlainText(fullResume());

    it('leads with name, headline and a contact line', () => {
        const lines = text.split('\n');
        expect(lines[0]).toBe('Ada Lovelace');
        expect(lines[1]).toBe('Software Engineer');
        expect(text).toContain('ada@example.com');
        expect(text).toContain('London, England, GB');
        expect(text).toContain('GitHub: ada');
    });

    it('renders upper-cased section headings with an underline rule', () => {
        expect(text).toContain('\nEXPERIENCE\n----------');
        expect(text).toContain('EDUCATION');
        expect(text).toContain('SKILLS');
        expect(text).toContain('PUBLICATIONS'); // custom section
    });

    it('renders work entries with dates and dashed highlight bullets', () => {
        expect(text).toContain('Principal Engineer, Analytical Engines Ltd');
        expect(text).toContain('(Mar 2021 – Present)');
        expect(text).toContain('  - Cut build time by 60%');
    });

    it('lists skills, languages and custom items', () => {
        expect(text).toContain('Languages: TypeScript, Go, Python');
        expect(text).toContain('English (Native)');
        expect(text).toContain('Notes on the Analytical Engine');
    });

    it('excludes hidden sections', () => {
        const d = fullResume();
        d.meta.sectionVisibility.work = false;
        expect(toPlainText(d)).not.toContain('EXPERIENCE');
    });

    it('ends with a trailing newline and stays free of HTML', () => {
        expect(text.endsWith('\n')).toBe(true);
        expect(text).not.toMatch(/<[a-z]/i);
    });

    it('handles an empty resume without throwing', () => {
        expect(() => toPlainText(defaultResume())).not.toThrow();
        expect(toPlainText(defaultResume()).trim()).toBe('');
    });
});
