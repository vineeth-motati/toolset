/**
 * Classic template — centered name, thin accent rule under each heading.
 * Traditional, recruiter-safe, single column (paginates reliably).
 */
import type { ResumeDoc, ResumeTheme } from '../types';
import { baseDoc, buildSections, contactRuns, contentWidth } from './shared';

function heading(theme: ResumeTheme) {
    return (title: string) => ({
        stack: [
            {
                text: title.toUpperCase(),
                bold: true,
                fontSize: theme.fontSize + 1.5,
                color: '#111827',
                characterSpacing: 0.5,
            },
            {
                canvas: [
                    {
                        type: 'line',
                        x1: 0,
                        y1: 1,
                        x2: contentWidth(theme),
                        y2: 1,
                        lineWidth: 0.8,
                        lineColor: theme.accent,
                    },
                ],
            },
        ],
        margin: [0, theme.sectionSpacing, 0, 4],
    });
}

export function build(doc: ResumeDoc, theme: ResumeTheme): any {
    const b = doc.basics;
    const runs = contactRuns(doc, theme.accent);
    const content: any[] = [
        {
            text: b.name || 'Your Name',
            fontSize: theme.fontSize + 12,
            bold: true,
            alignment: 'center',
            color: '#111827',
        },
    ];
    if (b.label) {
        content.push({
            text: b.label,
            alignment: 'center',
            color: theme.accent,
            fontSize: theme.fontSize + 2,
            margin: [0, 2, 0, 0],
        });
    }
    if (runs.length) {
        content.push({
            text: runs,
            alignment: 'center',
            color: '#4b5563',
            fontSize: theme.fontSize - 0.5,
            margin: [0, 5, 0, 0],
        });
    }
    if (b.summary) {
        content.push({ text: b.summary, alignment: 'justify', margin: [0, 8, 0, 0] });
    }
    content.push(...buildSections(doc, theme, heading(theme)));
    return baseDoc(doc, theme, content);
}
