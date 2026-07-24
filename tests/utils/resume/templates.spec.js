import { describe, it, expect } from 'vitest';
import {
    templates,
    templateList,
    buildDocDefinition,
} from '@/utils/resume/templates';
import { defaultResume } from '@/utils/resume/schema';

// Recursively collect every `text` string from a pdfmake content tree.
function collectText(node, out = []) {
    if (node == null) return out;
    if (typeof node === 'string') {
        out.push(node);
        return out;
    }
    if (Array.isArray(node)) {
        node.forEach((n) => collectText(n, out));
        return out;
    }
    if (typeof node === 'object') {
        if (typeof node.text === 'string') out.push(node.text);
        ['text', 'stack', 'columns', 'ul', 'content'].forEach((k) => {
            if (Array.isArray(node[k])) collectText(node[k], out);
        });
    }
    return out;
}

function populated() {
    const d = defaultResume();
    d.basics.name = 'Jane Doe';
    d.work.push({ name: 'Acme', position: 'Engineer', startDate: '2020-01', endDate: '2023-06', location: '', summary: 'Did things', highlights: ['Shipped X'] });
    d.education.push({ institution: 'MIT', area: 'CS', studyType: 'B.Sc.', startDate: '2016', endDate: '2020', score: '', courses: [] });
    d.skills.push({ name: 'Languages', level: '', keywords: ['TypeScript'] });
    return d;
}

describe('template registry', () => {
    it('exposes at least three templates', () => {
        expect(templateList().length).toBeGreaterThanOrEqual(3);
        expect(templates.classic).toBeTruthy();
    });
});

describe('buildDocDefinition', () => {
    it.each(Object.keys(templates))('%s builds a well-formed docDefinition', (id) => {
        const d = populated();
        d.meta.template = id;
        const def = buildDocDefinition(d, d.meta.theme);
        expect(def.pageSize).toBe(d.meta.theme.pageSize);
        expect(def.pageMargins).toEqual(d.meta.theme.margins);
        expect(def.defaultStyle.fontSize).toBe(d.meta.theme.fontSize);
        expect(Array.isArray(def.content)).toBe(true);
        expect(def.content.length).toBeGreaterThan(0);
        expect(collectText(def.content)).toContain('Jane Doe');
    });

    it('respects page size', () => {
        const d = populated();
        d.meta.theme.pageSize = 'LETTER';
        expect(buildDocDefinition(d, d.meta.theme).pageSize).toBe('LETTER');
    });

    it('hides sections toggled off', () => {
        const d = populated();
        d.meta.template = 'classic'; // uppercases headings
        const withWork = collectText(buildDocDefinition(d, d.meta.theme));
        expect(withWork).toContain('EXPERIENCE');

        d.meta.sectionVisibility.work = false;
        const withoutWork = collectText(buildDocDefinition(d, d.meta.theme));
        expect(withoutWork).not.toContain('EXPERIENCE');
    });

    it('renders sections in sectionsOrder', () => {
        const d = populated();
        d.meta.template = 'classic';
        d.meta.sectionsOrder = ['education', 'work', 'skills', 'projects', 'certificates', 'awards', 'languages', 'interests', 'references'];
        const text = collectText(buildDocDefinition(d, d.meta.theme));
        expect(text.indexOf('EDUCATION')).toBeLessThan(text.indexOf('EXPERIENCE'));
    });

    it('skips empty sections and falls back for an unknown template', () => {
        const empty = defaultResume();
        empty.basics.name = 'Nobody';
        empty.meta.template = 'does-not-exist';
        const def = buildDocDefinition(empty, empty.meta.theme);
        const text = collectText(def.content);
        expect(text).toContain('Nobody');
        expect(text).not.toContain('EXPERIENCE');
    });
});
