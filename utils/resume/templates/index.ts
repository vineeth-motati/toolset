/**
 * Template registry. Adding a template = adding one entry here + its build().
 * Each `build(doc, theme)` returns a pdfmake docDefinition (a pure object) —
 * the SAME definition drives both the on-screen preview and the exported PDF,
 * so they can never diverge.
 */
import type { ResumeDoc, ResumeTheme } from '../types';
import { build as classic } from './classic';
import { build as modern } from './modern';
import { build as atsPlain } from './atsPlain';

export interface ResumeTemplate {
    id: string;
    name: string;
    description: string;
    supports: { photo: boolean; atsSafe: boolean };
    build(doc: ResumeDoc, theme: ResumeTheme): any;
}

export const templates: Record<string, ResumeTemplate> = {
    classic: {
        id: 'classic',
        name: 'Classic',
        description: 'Centered header, accent rules — timeless and recruiter-safe.',
        supports: { photo: false, atsSafe: true },
        build: classic,
    },
    modern: {
        id: 'modern',
        name: 'Modern',
        description: 'Left-aligned accent name, optional photo, clean dividers.',
        supports: { photo: true, atsSafe: true },
        build: modern,
    },
    atsPlain: {
        id: 'atsPlain',
        name: 'ATS Plain',
        description: 'No color or graphics — maximum applicant-tracking-system compatibility.',
        supports: { photo: false, atsSafe: true },
        build: atsPlain,
    },
};

export const templateList = (): ResumeTemplate[] => Object.values(templates);

/** Build a docDefinition, falling back to `classic` for an unknown id. */
export function buildDocDefinition(doc: ResumeDoc, theme: ResumeTheme): any {
    const tpl = templates[doc.meta.template] || templates.classic;
    return tpl.build(doc, theme);
}
