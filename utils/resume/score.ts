/**
 * Live resume score — the multi-category read-out the paid builders put front
 * and centre (Rezi's five-category "Rezi Score", Enhancv's "ATS Check").
 *
 * Every issue carries a `target`, so the UI can deep-link straight to the field
 * that needs fixing instead of just nagging. Pure — no DOM, no Nuxt.
 */
import type { ResumeDoc, SectionKey } from './types';
import { lintBullet } from './lint';
import { analyze as analyzeAts } from './ats';
import { templates } from './templates';

export type IssueSeverity = 'error' | 'warning' | 'tip';

export type ScoreCategoryKey =
    | 'completeness'
    | 'impact'
    | 'clarity'
    | 'format'
    | 'ats';

/** Where in the editor an issue lives, so the UI can jump there. */
export interface IssueTarget {
    section: 'basics' | 'design' | SectionKey;
    index?: number;
}

export interface ScoreIssue {
    id: string;
    category: ScoreCategoryKey;
    severity: IssueSeverity;
    message: string;
    fix: string;
    target?: IssueTarget;
}

export interface CategoryResult {
    key: ScoreCategoryKey;
    label: string;
    score: number; // 0-100
    weight: number;
    issues: ScoreIssue[];
}

export interface ResumeScore {
    total: number; // 0-100, weighted
    grade: 'excellent' | 'good' | 'fair' | 'poor';
    categories: CategoryResult[];
    issues: ScoreIssue[]; // flattened, sorted by severity
    stats: ResumeStats;
}

export interface ResumeStats {
    bullets: number;
    quantifiedBullets: number;
    verbLedBullets: number;
    words: number;
    sectionsFilled: number;
}

export interface ScoreContext {
    /** Real page count from the rendered PDF, when the preview knows it. */
    pageCount?: number;
    /** Optional job description — unlocks the keyword-coverage check. */
    jobDescription?: string;
}

const CATEGORY_META: Record<ScoreCategoryKey, { label: string; weight: number }> = {
    completeness: { label: 'Completeness', weight: 25 },
    impact: { label: 'Impact', weight: 25 },
    clarity: { label: 'Clarity', weight: 15 },
    format: { label: 'Format', weight: 20 },
    ats: { label: 'ATS readiness', weight: 15 },
};

/** How much each severity costs its category. */
const PENALTY: Record<IssueSeverity, number> = { error: 30, warning: 12, tip: 4 };

const SEVERITY_RANK: Record<IssueSeverity, number> = { error: 0, warning: 1, tip: 2 };

/** Collect every highlight across work + projects with its origin. */
function allBullets(doc: ResumeDoc) {
    const out: { text: string; section: SectionKey; index: number }[] = [];
    doc.work.forEach((w, index) =>
        w.highlights.forEach((text) => out.push({ text, section: 'work', index }))
    );
    doc.projects.forEach((p, index) =>
        p.highlights.forEach((text) => out.push({ text, section: 'projects', index }))
    );
    return out;
}

function wordCount(doc: ResumeDoc): number {
    const parts: string[] = [doc.basics.summary, doc.basics.label];
    doc.work.forEach((w) => parts.push(w.summary, ...w.highlights));
    doc.projects.forEach((p) => parts.push(p.description, ...p.highlights));
    doc.education.forEach((e) => parts.push(...e.courses));
    doc.skills.forEach((s) => parts.push(...s.keywords));
    doc.awards.forEach((a) => parts.push(a.summary));
    doc.meta.customSections.forEach((cs) =>
        cs.items.forEach((it) => parts.push(it.title, it.description))
    );
    return parts.join(' ').trim().split(/\s+/).filter(Boolean).length;
}

/** "2021-03" / "2021" -> comparable number; unparseable -> null. */
export function dateOrder(value: string): number | null {
    const m = /^(\d{4})(?:-(\d{2}))?/.exec((value || '').trim());
    if (!m) return null;
    return Number(m[1]) * 12 + (m[2] ? Number(m[2]) - 1 : 0);
}

/** True when a date string is either blank or in a shape templates can format. */
export function isParseableDate(value: string): boolean {
    const v = (value || '').trim();
    if (!v) return true;
    if (/^present$/i.test(v)) return true;
    return /^\d{4}(-\d{2}(-\d{2})?)?$/.test(v);
}

export function analyzeResume(
    doc: ResumeDoc,
    context: ScoreContext = {}
): ResumeScore {
    const issues: ScoreIssue[] = [];
    const add = (
        category: ScoreCategoryKey,
        severity: IssueSeverity,
        id: string,
        message: string,
        fix: string,
        target?: IssueTarget
    ) => issues.push({ id, category, severity, message, fix, target });

    const b = doc.basics;
    const bullets = allBullets(doc);
    const lints = bullets.map((x) => ({ ...x, lint: lintBullet(x.text) }));
    const real = lints.filter((x) => !x.lint.empty);

    // ---------------------------------------------------------------- completeness
    if (!b.name.trim()) {
        add('completeness', 'error', 'no-name', 'No name', 'Add your full name — it becomes the PDF filename and the header.', { section: 'basics' });
    }
    if (!b.email.trim() && !b.phone.trim()) {
        add('completeness', 'error', 'no-contact', 'No way to contact you', 'Add at least an email address.', { section: 'basics' });
    } else {
        if (!b.email.trim()) add('completeness', 'warning', 'no-email', 'No email address', 'Recruiters reply by email far more often than they call.', { section: 'basics' });
        if (!b.phone.trim()) add('completeness', 'warning', 'no-phone', 'No phone number', 'Add a phone number — many ATS forms require one.', { section: 'basics' });
    }
    if (b.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(b.email.trim())) {
        add('completeness', 'error', 'bad-email', 'Email address looks malformed', 'Check the address — a typo here loses you the interview.', { section: 'basics' });
    }
    if (!b.label.trim()) {
        add('completeness', 'warning', 'no-headline', 'No headline', 'Add a target title like "Senior Frontend Engineer" under your name.', { section: 'basics' });
    }
    if (!b.summary.trim()) {
        add('completeness', 'warning', 'no-summary', 'No professional summary', 'Two or three lines up top frame everything a recruiter reads next.', { section: 'basics' });
    }
    if (!doc.work.length && !doc.projects.length && !doc.education.length) {
        add('completeness', 'error', 'no-history', 'No experience, projects or education', 'Add at least one of these — a resume needs a body.', { section: 'work' });
    }
    if (!doc.skills.length) {
        add('completeness', 'warning', 'no-skills', 'No skills listed', 'Skills are the first thing keyword scanners look for.', { section: 'skills' });
    }
    if (!b.location.city.trim() && !b.location.countryCode.trim()) {
        add('completeness', 'tip', 'no-location', 'No location', 'Add a city — many searches filter on it.', { section: 'basics' });
    }
    if (!b.profiles.length && !b.url.trim()) {
        add('completeness', 'tip', 'no-links', 'No LinkedIn, GitHub or site', 'Add at least one profile link.', { section: 'basics' });
    }
    doc.work.forEach((w, i) => {
        if (!w.position.trim() || !w.name.trim()) {
            add('completeness', 'warning', `work-title-${i}`, `Role ${i + 1} is missing a title or company`, 'Both are needed for a parser to build your history.', { section: 'work', index: i });
        }
    });

    // ---------------------------------------------------------------------- impact
    doc.work.forEach((w, i) => {
        const filled = w.highlights.filter((h) => h.trim()).length;
        if (!filled && (w.position.trim() || w.name.trim())) {
            add('impact', 'warning', `work-nobullets-${i}`, `"${w.position || w.name}" has no bullet points`, 'Add 3–5 achievement bullets — a role with none reads as filler.', { section: 'work', index: i });
        }
    });
    if (real.length) {
        const quantified = real.filter((x) => x.lint.hasMetric);
        const ratio = quantified.length / real.length;
        if (ratio < 0.3) {
            add('impact', 'warning', 'few-metrics', `Only ${quantified.length} of ${real.length} bullets carry a number`, 'Aim for half. "Cut build time 40%" beats "improved build time".', { section: 'work' });
        } else if (ratio < 0.5) {
            add('impact', 'tip', 'more-metrics', 'Under half your bullets are quantified', 'Add a metric to a few more — numbers are what get remembered.', { section: 'work' });
        }

        const noVerb = real.filter((x) => !x.lint.startsWithVerb);
        if (noVerb.length > real.length * 0.3) {
            add('impact', 'warning', 'weak-openers', `${noVerb.length} bullets don't open with an action verb`, 'Lead with Led, Built, Shipped, Reduced…', { section: noVerb[0].section, index: noVerb[0].index });
        }

        const weak = real.filter((x) => x.lint.weakPhrases.length);
        if (weak.length) {
            add('impact', 'warning', 'weak-phrases', `${weak.length} bullet${weak.length > 1 ? 's use' : ' uses'} duty language ("${weak[0].lint.weakPhrases[0]}")`, 'Describe the result, not the assignment.', { section: weak[0].section, index: weak[0].index });
        }

        // Same opening verb three or more times reads as copy-paste.
        const verbCounts = new Map<string, number>();
        real.forEach((x) => {
            if (x.lint.startsWithVerb) {
                verbCounts.set(x.lint.firstWord, (verbCounts.get(x.lint.firstWord) || 0) + 1);
            }
        });
        const repeated = [...verbCounts.entries()].filter(([, n]) => n >= 3);
        if (repeated.length) {
            add('impact', 'tip', 'repeated-verbs', `"${repeated[0][0]}" opens ${repeated[0][1]} bullets`, 'Vary your verbs so each achievement lands differently.', { section: 'work' });
        }
    }

    // --------------------------------------------------------------------- clarity
    const summaryWords = b.summary.trim() ? b.summary.trim().split(/\s+/).length : 0;
    if (summaryWords > 0 && summaryWords < 15) {
        add('clarity', 'tip', 'summary-short', 'Summary is very short', 'Two or three full sentences give a recruiter something to hold on to.', { section: 'basics' });
    }
    if (summaryWords > 70) {
        add('clarity', 'warning', 'summary-long', `Summary runs ${summaryWords} words`, 'Cut to 40–60. It is a hook, not a cover letter.', { section: 'basics' });
    }
    const pronounBullets = real.filter((x) => x.lint.hasPronoun);
    if (pronounBullets.length) {
        add('clarity', 'warning', 'pronouns', `${pronounBullets.length} bullet${pronounBullets.length > 1 ? 's use' : ' uses'} "I" or "we"`, 'Resume bullets are written without pronouns.', { section: pronounBullets[0].section, index: pronounBullets[0].index });
    }
    const longBullets = real.filter((x) => x.lint.tooLong);
    if (longBullets.length) {
        add('clarity', 'tip', 'long-bullets', `${longBullets.length} bullet${longBullets.length > 1 ? 's run' : ' runs'} past two lines`, 'Split or trim — long bullets get skimmed past.', { section: longBullets[0].section, index: longBullets[0].index });
    }
    if (PRONOUN_IN_SUMMARY(b.summary)) {
        add('clarity', 'tip', 'summary-pronoun', 'Summary uses first person', 'Drop "I am a…" — start with the role itself.', { section: 'basics' });
    }

    // ---------------------------------------------------------------------- format
    const pages = context.pageCount;
    if (pages && pages > 2) {
        add('format', 'warning', 'too-long', `${pages} pages`, 'Two pages is the practical ceiling. Cut the oldest roles first.', { section: 'design' });
    }
    if (pages === 1 && wordCount(doc) < 180 && doc.work.length > 1) {
        add('format', 'tip', 'sparse-page', 'Page looks sparse', 'Add detail to your recent roles, or raise the font size in Design.', { section: 'design' });
    }
    doc.work.forEach((w, i) => {
        if ((w.position.trim() || w.name.trim()) && !w.startDate.trim()) {
            add('format', 'warning', `work-nodate-${i}`, `"${w.position || w.name}" has no start date`, 'Parsers build your timeline from dates — never leave them blank.', { section: 'work', index: i });
        }
        if (!isParseableDate(w.startDate) || !isParseableDate(w.endDate)) {
            add('format', 'warning', `work-baddate-${i}`, `"${w.position || w.name}" has an unrecognised date`, 'Use the month picker so the PDF renders "Mar 2021".', { section: 'work', index: i });
        }
        const s = dateOrder(w.startDate);
        const e = dateOrder(w.endDate);
        if (s !== null && e !== null && e < s) {
            add('format', 'warning', `work-reversed-${i}`, `"${w.position || w.name}" ends before it starts`, 'Swap the start and end dates.', { section: 'work', index: i });
        }
        const filled = w.highlights.filter((h) => h.trim()).length;
        if (filled > 6) {
            add('format', 'tip', `work-manybullets-${i}`, `"${w.position || w.name}" has ${filled} bullets`, 'Keep the best 4–6. Depth beats volume.', { section: 'work', index: i });
        }
    });
    doc.education.forEach((e, i) => {
        if (!isParseableDate(e.startDate) || !isParseableDate(e.endDate)) {
            add('format', 'tip', `edu-baddate-${i}`, `"${e.institution || 'Education entry'}" has an unrecognised date`, 'Use the month picker.', { section: 'education', index: i });
        }
    });
    const t = doc.meta.theme;
    if (t.fontSize < 9) {
        add('format', 'tip', 'font-small', `Body text is ${t.fontSize}pt`, 'Below 9pt is hard to read on paper. Cut content instead.', { section: 'design' });
    }
    if (Math.min(...t.margins) < 24) {
        add('format', 'tip', 'margins-tight', 'Margins are very tight', 'Keep at least 24pt so nothing is lost when printed.', { section: 'design' });
    }

    // ------------------------------------------------------------------------- ats
    const tpl = templates[doc.meta.template];
    if (b.photo) {
        add('ats', 'warning', 'photo', 'Resume includes a photo', 'Many US/UK parsers drop images — and some screens discard the file. Remove it unless the market expects one.', { section: 'design' });
    }
    if (tpl && !tpl.supports.atsSafe) {
        add('ats', 'warning', 'template-risky', `The ${tpl.name} template is not parse-safe`, 'Switch to a single-column, ATS-safe template.', { section: 'design' });
    }
    if (!doc.skills.length) {
        add('ats', 'warning', 'ats-no-skills', 'No skills section for keyword matching', 'Group your skills — this is the highest-signal block for scanners.', { section: 'skills' });
    }
    const jd = (context.jobDescription || '').trim();
    if (jd) {
        const report = analyzeAts(doc, jd);
        if (report.score < 50) {
            add('ats', 'warning', 'jd-coverage', `Only ${report.score}% keyword coverage for this job`, `Work in the missing terms — starting with ${report.missing.slice(0, 3).join(', ')}.`, { section: 'skills' });
        } else if (report.score < 70) {
            add('ats', 'tip', 'jd-coverage-mid', `${report.score}% keyword coverage for this job`, `Adding ${report.missing.slice(0, 3).join(', ')} would push it higher.`, { section: 'skills' });
        }
    }

    // --------------------------------------------------------------------- scoring
    // A category with nothing to assess scores 0, not 100. Without this an empty
    // resume comes out "good": there are no bullets to criticise, so Impact and
    // Clarity would both be flawless by default.
    const assessable: Record<ScoreCategoryKey, boolean> = {
        completeness: true,
        impact: real.length > 0,
        clarity: !!b.summary.trim() || real.length > 0,
        format: doc.work.length > 0 || doc.education.length > 0 || doc.projects.length > 0,
        ats: true,
    };

    const categories: CategoryResult[] = (
        Object.keys(CATEGORY_META) as ScoreCategoryKey[]
    ).map((key) => {
        const own = issues.filter((i) => i.category === key);
        const penalty = own.reduce((sum, i) => sum + PENALTY[i.severity], 0);
        return {
            key,
            label: CATEGORY_META[key].label,
            weight: CATEGORY_META[key].weight,
            score: assessable[key] ? Math.max(0, Math.min(100, 100 - penalty)) : 0,
            issues: own.sort((a, z) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[z.severity]),
        };
    });

    const totalWeight = categories.reduce((s, c) => s + c.weight, 0);
    const total = Math.round(
        categories.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight
    );

    return {
        total,
        grade: total >= 85 ? 'excellent' : total >= 70 ? 'good' : total >= 45 ? 'fair' : 'poor',
        categories,
        issues: [...issues].sort(
            (a, z) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[z.severity]
        ),
        stats: {
            bullets: real.length,
            quantifiedBullets: real.filter((x) => x.lint.hasMetric).length,
            verbLedBullets: real.filter((x) => x.lint.startsWithVerb).length,
            words: wordCount(doc),
            sectionsFilled: (
                ['work', 'education', 'skills', 'projects', 'certificates', 'awards', 'languages', 'interests', 'references'] as SectionKey[]
            ).filter((k) => doc[k].length).length,
        },
    };
}

function PRONOUN_IN_SUMMARY(summary: string): boolean {
    return /\b(i|i'm|i've|my|me)\b/i.test(summary || '');
}

/** Per-section completeness for the nav rail dots. */
export function sectionCompleteness(doc: ResumeDoc, key: SectionKey): number {
    const items = doc[key] as any[];
    if (!items.length) return 0;
    const filled = items.filter((it) =>
        Object.values(it).some((v) =>
            Array.isArray(v) ? v.some((x) => String(x).trim()) : String(v ?? '').trim()
        )
    ).length;
    return Math.round((filled / items.length) * 100);
}

/** Completeness of the personal-details block, 0–100. */
export function basicsCompleteness(doc: ResumeDoc): number {
    const b = doc.basics;
    const checks = [
        !!b.name.trim(),
        !!b.label.trim(),
        !!b.email.trim(),
        !!b.phone.trim(),
        !!(b.location.city.trim() || b.location.countryCode.trim()),
        !!b.summary.trim(),
        !!(b.profiles.length || b.url.trim()),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
