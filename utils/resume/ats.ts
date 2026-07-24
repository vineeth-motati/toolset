/**
 * Local, offline ATS keyword checker. Paste a job description and compare its
 * salient keywords against the resume text — entirely in-browser, no network,
 * no AI. Pure — covered by tests/utils/resume/ats.spec.js.
 */
import type { ResumeDoc } from './types';

// Common words that carry no signal for keyword matching.
const STOP_WORDS = new Set(
    (
        'a an and are as at be by for from has have in is it its of on or that the to ' +
        'with will you your we our us they their he she them this these those i me my ' +
        'able about above after all also am any been being both but can cate could did ' +
        'do does doing down during each few more most other some such than then there ' +
        'was were what when where which who whom why would should must may might not no ' +
        'nor only own same so too very s t just don now role work experience team teams ' +
        'ability strong excellent good years year plus etc using use used across within'
    ).split(/\s+/)
);

const WORD_RE = /[a-z][a-z+#.]*[a-z+#]|[a-z]/gi;

function tokenize(text: string): string[] {
    return (text.toLowerCase().match(WORD_RE) || []).map((w) =>
        w.replace(/\.$/, '')
    );
}

/** Extract candidate keywords from a job description, ranked by frequency. */
export function extractKeywords(jobDescription: string, limit = 40): string[] {
    const counts = new Map<string, number>();
    for (const tok of tokenize(jobDescription)) {
        if (tok.length < 2 || STOP_WORDS.has(tok)) continue;
        counts.set(tok, (counts.get(tok) || 0) + 1);
    }
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, limit)
        .map(([w]) => w);
}

/** Flatten all user-entered resume text into one lowercased blob. */
export function resumeText(doc: ResumeDoc): string {
    const parts: string[] = [];
    const b = doc.basics;
    parts.push(b.name, b.label, b.summary);
    b.profiles.forEach((p) => parts.push(p.network, p.username));
    doc.work.forEach((w) =>
        parts.push(w.name, w.position, w.summary, ...w.highlights)
    );
    doc.education.forEach((e) =>
        parts.push(e.institution, e.area, e.studyType, ...e.courses)
    );
    doc.skills.forEach((s) => parts.push(s.name, s.level, ...s.keywords));
    doc.projects.forEach((p) =>
        parts.push(p.name, p.description, ...p.highlights)
    );
    doc.certificates.forEach((c) => parts.push(c.name, c.issuer));
    doc.awards.forEach((a) => parts.push(a.title, a.awarder, a.summary));
    doc.languages.forEach((l) => parts.push(l.language, l.fluency));
    doc.interests.forEach((i) => parts.push(i.name, ...i.keywords));
    doc.meta.customSections.forEach((cs) => {
        parts.push(cs.title);
        cs.items.forEach((it) => parts.push(it.title, it.description));
    });
    return parts.join(' ').toLowerCase();
}

export interface AtsReport {
    score: number; // 0-100 keyword coverage
    matched: string[];
    missing: string[];
    warnings: string[];
}

/** Compare a resume against a job description. */
export function analyze(doc: ResumeDoc, jobDescription: string): AtsReport {
    const keywords = extractKeywords(jobDescription);
    const haystack = ' ' + resumeText(doc) + ' ';
    const matched: string[] = [];
    const missing: string[] = [];
    for (const kw of keywords) {
        // Word-ish boundary match so "react" doesn't match "reaction".
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
        (re.test(haystack) ? matched : missing).push(kw);
    }
    const score = keywords.length
        ? Math.round((matched.length / keywords.length) * 100)
        : 0;

    const warnings: string[] = [];
    if (doc.basics.photo) {
        warnings.push(
            'Photo included — some ATS parsers ignore or choke on images. Use the ATS-plain template for strict systems.'
        );
    }
    if (!doc.basics.email || !doc.basics.phone) {
        warnings.push('Missing email or phone — recruiters need a way to reach you.');
    }
    if (!doc.basics.summary) {
        warnings.push('No summary — a 2–3 line summary helps ATS keyword coverage.');
    }
    if (doc.work.every((w) => w.highlights.length === 0) && doc.work.length) {
        warnings.push('Work entries have no bullet points — add measurable highlights.');
    }
    return { score, matched, missing, warnings };
}
