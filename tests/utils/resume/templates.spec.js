import { describe, it, expect } from 'vitest';
import {
    templates,
    templateList,
    buildDocDefinition,
} from '@/utils/resume/templates';
import { defaultResume } from '@/utils/resume/schema';
import { fullResume } from './fixtures';

// Recursively collect every `text` string from a pdfmake content tree.
function collectText(node, out = []) {
    if (node == null) return out;
    if (typeof node === 'string') return out.push(node), out;
    if (Array.isArray(node)) return node.forEach((n) => collectText(n, out)), out;
    if (typeof node === 'object') {
        if (typeof node.text === 'string') out.push(node.text);
        ['text', 'stack', 'columns', 'ul', 'content'].forEach((k) => {
            if (Array.isArray(node[k])) collectText(node[k], out);
        });
    }
    return out;
}
const flat = (def) => collectText(def.content).join(' | ');

describe('template registry', () => {
    it('exposes at least three templates, each with a build() and metadata', () => {
        expect(templateList().length).toBeGreaterThanOrEqual(3);
        for (const t of templateList()) {
            expect(t.id).toBeTruthy();
            expect(t.name).toBeTruthy();
            expect(typeof t.build).toBe('function');
            expect(t.supports).toHaveProperty('atsSafe');
        }
        expect(templates.classic).toBeTruthy();
        expect(templates.modern).toBeTruthy();
        expect(templates.atsPlain).toBeTruthy();
    });
});

describe('buildDocDefinition — structure', () => {
    it.each(Object.keys(templates))('%s builds a well-formed docDefinition', (id) => {
        const d = fullResume();
        d.meta.template = id;
        const def = buildDocDefinition(d, d.meta.theme);
        expect(def.pageSize).toBe(d.meta.theme.pageSize);
        expect(def.pageMargins).toEqual(d.meta.theme.margins);
        expect(def.defaultStyle.fontSize).toBe(d.meta.theme.fontSize);
        expect(Array.isArray(def.content)).toBe(true);
        expect(def.content.length).toBeGreaterThan(0);
        expect(def.info.title).toBeTruthy();
    });

    it.each(Object.keys(templates))('%s renders the person and all populated sections', (id) => {
        const d = fullResume();
        d.meta.template = id;
        const text = flat(buildDocDefinition(d, d.meta.theme));
        expect(text).toContain('Ada Lovelace');
        expect(text).toContain('Principal Engineer');
        expect(text).toContain('Analytical Engines Ltd');
        expect(text).toContain('University of London');
        expect(text).toContain('TypeScript');
        expect(text).toContain('OpenMetrics');
        expect(text).toContain('CKA');
        expect(text).toContain('Engineer of the Year');
        expect(text).toContain('English');
        expect(text).toContain('Chess');
        expect(text).toContain('Charles Babbage');
        expect(text).toContain('Notes on the Analytical Engine'); // custom-section item
        expect(text).toContain('Cut build time by 60%'); // a highlight bullet
        expect(text).toContain('Mar 2021'); // formatted work date (fixture uses 2021-03)
        expect(text.toLowerCase()).toContain('publications'); // custom heading (case varies by template)
    });

    it('respects page size', () => {
        const d = fullResume();
        d.meta.theme.pageSize = 'LETTER';
        expect(buildDocDefinition(d, d.meta.theme).pageSize).toBe('LETTER');
    });
});

describe('buildDocDefinition — sections behaviour (classic)', () => {
    const build = (d) => flat(buildDocDefinition(d, d.meta.theme));

    it('hides sections toggled off', () => {
        const d = fullResume();
        expect(build(d)).toContain('EXPERIENCE'); // classic uppercases headings
        d.meta.sectionVisibility.work = false;
        expect(build(d)).not.toContain('EXPERIENCE');
    });

    it('renders sections in sectionsOrder', () => {
        const d = fullResume();
        d.meta.sectionsOrder = ['education', 'work', ...d.meta.sectionsOrder.filter((k) => k !== 'education' && k !== 'work')];
        const text = build(d);
        expect(text.indexOf('EDUCATION')).toBeLessThan(text.indexOf('EXPERIENCE'));
    });

    it('skips empty sections and falls back for an unknown template', () => {
        const empty = defaultResume();
        empty.basics.name = 'Nobody';
        empty.meta.template = 'does-not-exist';
        const text = build(empty);
        expect(text).toContain('Nobody');
        expect(text).not.toContain('EXPERIENCE');
    });
});

describe('template-specific rendering', () => {
    it('modern includes the photo image node when present', () => {
        const d = fullResume();
        d.meta.template = 'modern';
        const def = buildDocDefinition(d, d.meta.theme);
        expect(JSON.stringify(def.content)).toContain(d.basics.photo);
    });

    it('classic ignores the photo (single-column, no image)', () => {
        const d = fullResume();
        d.meta.template = 'classic';
        const def = buildDocDefinition(d, d.meta.theme);
        expect(JSON.stringify(def.content)).not.toContain(d.basics.photo);
    });

    it('atsPlain uses black (no accent color) for contact links', () => {
        const d = fullResume();
        d.meta.template = 'atsPlain';
        d.meta.theme.accent = '#ff0000';
        const json = JSON.stringify(buildDocDefinition(d, d.meta.theme).content);
        expect(json).not.toContain('#ff0000');
    });
});
