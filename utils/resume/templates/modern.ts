/**
 * Modern template — left-aligned accent name, optional photo, accent headings
 * with a light divider. Single column (paginates reliably).
 */
import type { ResumeDoc, ResumeTheme } from '../types';
import { baseDoc, buildSections, contactRuns, contentWidth } from './shared';

function heading(theme: ResumeTheme) {
    return (title: string) => ({
        stack: [
            {
                text: title,
                bold: true,
                fontSize: theme.fontSize + 1.5,
                color: theme.accent,
                characterSpacing: 0.4,
            },
            {
                canvas: [
                    {
                        type: 'line',
                        x1: 0,
                        y1: 2,
                        x2: contentWidth(theme),
                        y2: 2,
                        lineWidth: 0.6,
                        lineColor: '#e5e7eb',
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

    const headerStack: any[] = [
        {
            text: b.name || 'Your Name',
            fontSize: theme.fontSize + 14,
            bold: true,
            color: theme.accent,
        },
    ];
    if (b.label) {
        headerStack.push({
            text: b.label,
            color: '#374151',
            fontSize: theme.fontSize + 2,
            margin: [0, 1, 0, 0],
        });
    }
    if (runs.length) {
        headerStack.push({
            text: runs,
            color: '#4b5563',
            fontSize: theme.fontSize - 0.5,
            margin: [0, 4, 0, 0],
        });
    }

    const header = b.photo
        ? {
              columns: [
                  { stack: headerStack, width: '*' },
                  { image: b.photo, width: 58, height: 58, margin: [8, 0, 0, 0] },
              ],
              columnGap: 8,
          }
        : { stack: headerStack };

    const content: any[] = [header];
    if (b.summary) {
        content.push({ text: b.summary, margin: [0, 8, 0, 0], alignment: 'justify' });
    }
    content.push(...buildSections(doc, theme, heading(theme)));
    return baseDoc(doc, theme, content);
}
