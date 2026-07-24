/**
 * ATS-plain template — no color, no rules, no photo, plain bold uppercase
 * headings. Maximally parseable by strict applicant-tracking systems.
 */
import type { ResumeDoc, ResumeTheme } from '../types';
import { baseDoc, buildSections, contactRuns } from './shared';

function heading(theme: ResumeTheme) {
    return (title: string) => ({
        text: title.toUpperCase(),
        bold: true,
        fontSize: theme.fontSize + 1,
        color: '#000000',
        margin: [0, theme.sectionSpacing, 0, 3],
    });
}

export function build(doc: ResumeDoc, theme: ResumeTheme): any {
    const b = doc.basics;
    // Black links (no accent) for the strictest parsers.
    const runs = contactRuns(doc, '#000000');
    const content: any[] = [
        {
            text: b.name || 'Your Name',
            fontSize: theme.fontSize + 8,
            bold: true,
            color: '#000000',
        },
    ];
    if (b.label) {
        content.push({ text: b.label, margin: [0, 1, 0, 0], color: '#000000' });
    }
    if (runs.length) {
        content.push({
            text: runs,
            fontSize: theme.fontSize - 0.5,
            color: '#000000',
            margin: [0, 3, 0, 0],
        });
    }
    if (b.summary) {
        content.push({ text: b.summary, margin: [0, 8, 0, 0] });
    }
    content.push(...buildSections(doc, theme, heading(theme)));
    return baseDoc(doc, theme, content);
}
