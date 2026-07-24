/**
 * Shared building blocks for resume templates. Each template supplies its own
 * header + heading style; the section bodies (work, education, ...) are built
 * here once so templates stay small and consistent. Everything returns plain
 * pdfmake content objects — no pdfmake import, so this is unit-testable.
 */
import type { ResumeDoc, ResumeTheme, SectionKey } from '../types';

export const PAGE_DIMENSIONS: Record<string, [number, number]> = {
    A4: [595.28, 841.89],
    LETTER: [612, 792],
};

/** Usable content width in pt for the given page size + margins. */
export function contentWidth(theme: ResumeTheme): number {
    const [w] = PAGE_DIMENSIONS[theme.pageSize] || PAGE_DIMENSIONS.A4;
    return w - theme.margins[0] - theme.margins[2];
}

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** "2020-01-15" | "2020-01" | "2020" -> "Jan 2020"; anything else passes through. */
export function fmtDate(value: string): string {
    if (!value) return '';
    const ym = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(value.trim());
    if (ym) {
        const m = Number(ym[2]);
        return m >= 1 && m <= 12 ? `${MONTHS[m - 1]} ${ym[1]}` : ym[1];
    }
    const y = /^(\d{4})$/.exec(value.trim());
    if (y) return y[1];
    return value;
}

/** "Jan 2020 – Present" style range; empty end -> "Present" when start exists. */
export function dateRange(start: string, end: string): string {
    const s = fmtDate(start);
    const e = end ? fmtDate(end) : s ? 'Present' : '';
    if (s && e) return `${s} – ${e}`;
    return s || e || '';
}

/** Contact/location/profile links as an array of pdfmake inline text runs. */
export function contactRuns(doc: ResumeDoc, accent: string): any[] {
    const b = doc.basics;
    const runs: any[] = [];
    const push = (text: string, link?: string) => {
        if (!text) return;
        if (runs.length) runs.push({ text: '  •  ', color: '#9ca3af' });
        runs.push(link ? { text, link, color: accent } : { text });
    };
    const loc = [b.location.city, b.location.region, b.location.countryCode]
        .filter(Boolean)
        .join(', ');
    push(b.email, b.email ? `mailto:${b.email}` : undefined);
    push(b.phone);
    push(loc);
    if (b.url) push(b.url.replace(/^https?:\/\//, ''), b.url);
    b.profiles.forEach((p) => {
        const label = p.username || p.network;
        if (label) push(`${p.network}: ${p.username}`.replace(/^:\s*/, ''), p.url || undefined);
    });
    return runs;
}

type HeadingFn = (title: string) => any;

function bulletList(items: string[], theme: ResumeTheme): any | null {
    const clean = items.filter((h) => h && h.trim());
    if (!clean.length) return null;
    return {
        ul: clean,
        margin: [0, 2, 0, 0],
    };
}

/** Build the ordered, visible, non-empty section bodies for a resume. */
export function buildSections(
    doc: ResumeDoc,
    theme: ResumeTheme,
    heading: HeadingFn
): any[] {
    const out: any[] = [];
    const accent = theme.accent;

    const entryHeader = (left: string, right: string, sub?: string) => {
        const rows: any[] = [
            {
                columns: [
                    { text: left, bold: true },
                    right
                        ? { text: right, alignment: 'right', color: '#6b7280', width: 'auto' }
                        : {},
                ],
                columnGap: 8,
            },
        ];
        if (sub) rows.push({ text: sub, italics: true, color: '#4b5563', margin: [0, 1, 0, 0] });
        return rows;
    };

    const builders: Record<SectionKey, () => any[]> = {
        work: () =>
            doc.work.flatMap((w) => {
                const title = [w.position, w.name].filter(Boolean).join(' · ');
                const block: any[] = entryHeader(title, dateRange(w.startDate, w.endDate), w.location);
                if (w.summary) block.push({ text: w.summary, margin: [0, 2, 0, 0] });
                const ul = bulletList(w.highlights, theme);
                if (ul) block.push(ul);
                return [{ stack: block, margin: [0, 0, 0, 6] }];
            }),
        education: () =>
            doc.education.flatMap((e) => {
                const title = [e.institution].filter(Boolean).join('');
                const deg = [e.studyType, e.area].filter(Boolean).join(', ');
                const block: any[] = entryHeader(title, dateRange(e.startDate, e.endDate), deg);
                if (e.score) block.push({ text: `Score: ${e.score}`, margin: [0, 1, 0, 0] });
                const ul = bulletList(e.courses, theme);
                if (ul) block.push(ul);
                return [{ stack: block, margin: [0, 0, 0, 6] }];
            }),
        skills: () =>
            doc.skills.map((s) => {
                const kw = s.keywords.filter(Boolean).join(', ');
                const line = s.name
                    ? [{ text: `${s.name}: `, bold: true }, { text: kw }]
                    : [{ text: kw }];
                return { text: line, margin: [0, 0, 0, 3] };
            }),
        projects: () =>
            doc.projects.flatMap((p) => {
                const block: any[] = entryHeader(
                    p.name,
                    p.url ? p.url.replace(/^https?:\/\//, '') : ''
                );
                if (p.url) block[0].columns[1] = { text: p.url.replace(/^https?:\/\//, ''), link: p.url, color: accent, alignment: 'right', width: 'auto' };
                if (p.description) block.push({ text: p.description, margin: [0, 2, 0, 0] });
                const ul = bulletList(p.highlights, theme);
                if (ul) block.push(ul);
                return [{ stack: block, margin: [0, 0, 0, 6] }];
            }),
        certificates: () =>
            doc.certificates.map((c) => ({
                columns: [
                    { text: [{ text: c.name, bold: true }, c.issuer ? { text: ` — ${c.issuer}` } : {}] },
                    c.date ? { text: fmtDate(c.date), alignment: 'right', color: '#6b7280', width: 'auto' } : {},
                ],
                margin: [0, 0, 0, 3],
            })),
        awards: () =>
            doc.awards.flatMap((a) => {
                const block: any[] = entryHeader(a.title, fmtDate(a.date), a.awarder);
                if (a.summary) block.push({ text: a.summary, margin: [0, 2, 0, 0] });
                return [{ stack: block, margin: [0, 0, 0, 6] }];
            }),
        languages: () => {
            const line = doc.languages
                .map((l) => (l.fluency ? `${l.language} (${l.fluency})` : l.language))
                .filter(Boolean)
                .join('   •   ');
            return line ? [{ text: line }] : [];
        },
        interests: () => {
            const line = doc.interests
                .map((i) => [i.name, ...i.keywords].filter(Boolean).join(': '))
                .filter(Boolean)
                .join('   •   ');
            return line ? [{ text: line }] : [];
        },
        references: () =>
            doc.references.map((r) => ({
                text: [{ text: r.name, bold: true }, r.reference ? { text: ` — ${r.reference}` } : {}],
                margin: [0, 0, 0, 3],
            })),
    };

    const hasContent: Record<SectionKey, boolean> = {
        work: doc.work.length > 0,
        education: doc.education.length > 0,
        skills: doc.skills.length > 0,
        projects: doc.projects.length > 0,
        certificates: doc.certificates.length > 0,
        awards: doc.awards.length > 0,
        languages: doc.languages.length > 0,
        interests: doc.interests.length > 0,
        references: doc.references.length > 0,
    };

    for (const key of doc.meta.sectionsOrder) {
        if (doc.meta.sectionVisibility[key] === false) continue;
        if (!hasContent[key]) continue;
        const body = builders[key]();
        if (!body.length) continue;
        out.push(heading(SECTION_LABELS[key]));
        out.push(...body);
    }

    // Custom sections always render last, in their stored order.
    for (const cs of doc.meta.customSections) {
        const items = cs.items.filter((it) => it.title || it.description);
        if (!items.length) continue;
        out.push(heading(cs.title || 'Section'));
        for (const it of items) {
            const block: any[] = [];
            if (it.title) block.push({ text: it.title, bold: true });
            if (it.description) block.push({ text: it.description, margin: [0, 1, 0, 0] });
            out.push({ stack: block, margin: [0, 0, 0, 6] });
        }
    }

    return out;
}

export const SECTION_LABELS: Record<SectionKey, string> = {
    work: 'Experience',
    education: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    certificates: 'Certificates',
    awards: 'Awards',
    languages: 'Languages',
    interests: 'Interests',
    references: 'References',
};

/** Base docDefinition shell shared by all templates. */
export function baseDoc(doc: ResumeDoc, theme: ResumeTheme, content: any[]): any {
    return {
        pageSize: theme.pageSize,
        pageMargins: theme.margins,
        info: { title: doc.name || doc.basics.name || 'Resume' },
        defaultStyle: {
            font: 'Roboto',
            fontSize: theme.fontSize,
            lineHeight: theme.lineHeight,
            color: '#1f2937',
        },
        content,
    };
}
