/**
 * Render a resume as clean, ATS-friendly plain text (handy for pasting into
 * web application forms). Pure — no DOM.
 */
import { dateRange, fmtDate, SECTION_LABELS } from './templates/shared';
import type { ResumeDoc, SectionKey } from './types';

const rule = (title: string) => `\n${title.toUpperCase()}\n${'-'.repeat(title.length)}`;

export function toPlainText(doc: ResumeDoc): string {
    const b = doc.basics;
    const lines: string[] = [];
    if (b.name) lines.push(b.name);
    if (b.label) lines.push(b.label);
    const contact = [
        b.email,
        b.phone,
        [b.location.city, b.location.region, b.location.countryCode].filter(Boolean).join(', '),
        b.url,
        ...b.profiles.map((p) => `${p.network}: ${p.username || p.url}`.trim()),
    ].filter(Boolean);
    if (contact.length) lines.push(contact.join(' | '));
    if (b.summary) lines.push('', b.summary);

    const render: Record<SectionKey, () => string[]> = {
        work: () =>
            doc.work.flatMap((w) => [
                `${[w.position, w.name].filter(Boolean).join(', ')}  (${dateRange(w.startDate, w.endDate)})`,
                ...(w.summary ? [w.summary] : []),
                ...w.highlights.filter(Boolean).map((h) => `  - ${h}`),
            ]),
        education: () =>
            doc.education.map((e) =>
                `${e.institution} — ${[e.studyType, e.area].filter(Boolean).join(', ')}  (${dateRange(e.startDate, e.endDate)})`.trim()
            ),
        skills: () =>
            doc.skills.map((s) => `${s.name ? s.name + ': ' : ''}${s.keywords.join(', ')}`),
        projects: () =>
            doc.projects.flatMap((p) => [
                `${p.name}${p.url ? ' — ' + p.url : ''}`,
                ...(p.description ? [p.description] : []),
                ...p.highlights.filter(Boolean).map((h) => `  - ${h}`),
            ]),
        certificates: () =>
            doc.certificates.map((c) => `${c.name} — ${c.issuer} ${c.date ? '(' + fmtDate(c.date) + ')' : ''}`.trim()),
        awards: () => doc.awards.map((a) => `${a.title} — ${a.awarder} ${a.date ? '(' + fmtDate(a.date) + ')' : ''}`.trim()),
        languages: () => [doc.languages.map((l) => `${l.language}${l.fluency ? ' (' + l.fluency + ')' : ''}`).join(', ')],
        interests: () => [doc.interests.map((i) => [i.name, ...i.keywords].filter(Boolean).join(': ')).join(', ')],
        references: () => doc.references.map((r) => `${r.name}${r.reference ? ' — ' + r.reference : ''}`),
    };

    const hasContent = (k: SectionKey) => (doc[k] as any[]).length > 0;

    for (const key of doc.meta.sectionsOrder) {
        if (doc.meta.sectionVisibility[key] === false || !hasContent(key)) continue;
        const body = render[key]().filter(Boolean);
        if (!body.length) continue;
        lines.push(rule(SECTION_LABELS[key]), ...body);
    }

    for (const cs of doc.meta.customSections) {
        const items = cs.items.filter((it) => it.title || it.description);
        if (!items.length) continue;
        lines.push(rule(cs.title || 'Section'));
        for (const it of items) {
            if (it.title) lines.push(it.title);
            if (it.description) lines.push(it.description);
        }
    }

    return lines.join('\n').trim() + '\n';
}
