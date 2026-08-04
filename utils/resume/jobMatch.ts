/**
 * Job-description matching.
 *
 * The first pass at this ranked single words by raw frequency, which surfaces
 * exactly the words a job ad repeats and a recruiter ignores — "experience",
 * "ability", "working" — while missing the terms that decide the screen,
 * because they are two words long ("design systems", "unit testing").
 *
 * This version does four things differently:
 *   1. strips recruiting boilerplate (EEO statements, benefits, "about us")
 *      before counting anything;
 *   2. weights lines under a Requirements/Qualifications heading, and marks
 *      terms near "required" / "must have" / "5+ years" as must-haves;
 *   3. extracts phrases, then drops the single words those phrases already
 *      cover, so "design systems" wins over "design" + "systems";
 *   4. treats mid-sentence capitalisation, embedded symbols and a small
 *      lexicon as the signal for "this is a tool, not prose" — no giant
 *      hand-maintained skill list to keep current.
 *
 * Pure — no DOM, no network. The job description never leaves the tab.
 */
import type { ResumeDoc } from './types';
import { SECTION_LABELS } from './templates/shared';

export type TermPriority = 'must' | 'nice';

export interface JobTerm {
    /** Display form, cased as the job ad wrote it ("TypeScript"). */
    term: string;
    /** Lowercased form used for matching and de-duping. */
    key: string;
    /** Weighted frequency in the job description. */
    weight: number;
    priority: TermPriority;
    matched: boolean;
    /** Which resume section already covers it, when matched. */
    where?: string;
}

export interface JobMatch {
    score: number;
    terms: JobTerm[];
    matched: JobTerm[];
    missing: JobTerm[];
    /** Missing terms the ad marked as required — fix these first. */
    criticalMissing: JobTerm[];
}

/** Lines like these say nothing about the job. */
const BOILERPLATE_RE =
    /(equal opportunity|equal-opportunity|regardless of race|without regard to|diversity and inclusion|we are committed to|reasonable accommodation|background check|drug screen|competitive salary|salary range|compensation package|benefits? (package|include)|401\s?\(?k\)?|health (insurance|care)|dental|paid time off|unlimited pto|parental leave|stock options|about us|who we are|our mission|our values|apply now|join us|click here)/i;

/** Headings after which the real requirements usually live. */
const REQUIREMENT_HEADING_RE =
    /^\s*(what you|you (will|'ll) (need|have|bring)|requirements?|qualifications?|must[- ]haves?|skills?|experience|we're looking for|about you|responsibilities|the role|your background)\b/i;

/** Signals that a term on this line is non-negotiable. */
const MUST_RE =
    /\b(must have|must be|required|require[sd]?|essential|mandatory|minimum|at least|\d+\+?\s*years?|strong|expert|deep|extensive|proficien\w*|advanced)\b/i;

/**
 * Ceiling on must-haves. Job ads routinely open every bullet with
 * "Strong…" / "Deep…" / "5+ years…", and a list where thirteen of fifteen
 * items are flagged required tells the reader nothing. Past this many, the
 * lower-weighted terms are demoted so the flag keeps meaning something.
 */
const MAX_MUST_HAVES = 6;

/**
 * Punctuation that ends a phrase. Split on this before pairing words, or
 * "accessibility (WCAG)" yields the phantom phrase "accessibility WCAG".
 * Solidus is deliberately absent — it lives inside CI/CD and TCP/IP.
 */
const CLAUSE_SPLIT_RE = /[,;:()[\]"“”]|\s+[-–—]\s+|\.\s+/;

/**
 * Common lowercase skills that capitalisation alone would miss. This is also
 * the gate for single words: a lone token has to look like a term (named tool,
 * embedded symbol, or listed here) to survive, which is what keeps "reusable",
 * "applications" and "building" out of the gap list. Multi-word requirements
 * still get through as phrases.
 */
const SKILL_LEXICON = new Set([
    'accessibility', 'agile', 'algorithms', 'analytics', 'api', 'apis',
    'architecture', 'automation', 'backend', 'caching', 'ci', 'cd', 'cloud',
    'compliance', 'component', 'components', 'containers', 'crm', 'css', 'data',
    'database', 'debugging', 'deployment', 'design', 'devops', 'distributed',
    'documentation', 'e2e', 'encryption', 'etl', 'forecasting', 'framework',
    'frameworks', 'frontend', 'fullstack', 'git', 'governance', 'html',
    'infrastructure', 'integration', 'latency', 'library', 'libraries', 'linux',
    'localization', 'logging', 'microservices', 'migration', 'ml', 'mobile',
    'monitoring', 'networking', 'observability', 'onboarding', 'orchestration',
    'performance', 'pipeline', 'pipelines', 'prototyping', 'query',
    'refactoring', 'reliability', 'reporting', 'research', 'responsive', 'rest',
    'roadmap', 'scalability', 'scaling', 'schema', 'scripting', 'security',
    'seo', 'serverless', 'sharding', 'sql', 'staging', 'streaming', 'telemetry',
    'testing', 'throughput', 'tooling', 'typing', 'ui', 'ux', 'validation',
    'virtualization', 'visualization', 'wcag', 'workflow',
]);

/** Words that carry no hiring signal even when a job ad repeats them. */
const STOP_WORDS = new Set(
    (
        'a an and are as at be by for from has have in is it its of on or that the to ' +
        'with will you your we our us they their he she them this these those i me my ' +
        'able about above after all also am any been being both but can could did do ' +
        'does doing down during each few more most other some such than then there was ' +
        'were what when where which who whom why would should must may might not no nor ' +
        'only own same so too very s t just don now if into over under out up off per ' +
        'role work working experience experienced team teams ability strong excellent ' +
        'good great years year plus etc using use used across within including include ' +
        'well help helping ensure ensuring provide providing support supporting new ' +
        'looking seeking candidate candidates applicant ideal successful opportunity ' +
        'company companies business organisation organization environment fast paced ' +
        'dynamic exciting passionate motivated driven self starter world class cutting ' +
        'edge best practices day one every all levels level senior junior mid staff ' +
        'lead principal manager management position job title full time part remote ' +
        'hybrid onsite office location salary benefits apply application please note ' +
        'plus bonus preferred desirable nice required requirement qualifications ' +
        'responsibilities duties tasks skills skill knowledge understanding familiarity ' +
        'proficiency expertise proven track record demonstrated hands on ' +
        // The words that mark a requirement are not themselves requirements —
        // without these, "Deep understanding of X" contributes the term "deep".
        'deep expert extensive advanced proficient essential mandatory minimum ' +
        'background solid comfortable adept versed competent thorough sound ' +
        'exposure equivalent relevant related similar various multiple several'
    ).split(/\s+/)
);

/** Keeps "c++", "c#", "node.js", "ci/cd", ".net" in one piece. */
const TOKEN_RE = /[a-z][a-z0-9+#./-]*[a-z0-9+#]|[a-z]/gi;

const tidy = (token: string): string =>
    token.toLowerCase().replace(/^[-.]+|[-.]+$/g, '');

interface JobLine {
    text: string;
    weight: number;
    must: boolean;
}

/**
 * Short, unpunctuated, unbulleted opening line — the shape of a job title.
 * A posting that opens straight into a bullet list must not lose its first item.
 */
const isHeadlineLine = (text: string): boolean =>
    text.length < 80 && !/[.!?]/.test(text) && !/^[-*•●‣▪]\s+/.test(text);

/**
 * Split a job description into weighted lines, dropping boilerplate. Lines
 * under a requirements heading — and bulleted lines anywhere — count for more.
 */
export function jobLines(jobDescription: string): JobLine[] {
    const out: JobLine[] = [];
    let inRequirements = false;
    let seenContent = false;

    for (const raw of (jobDescription || '').split(/\r?\n/)) {
        const text = raw.trim();
        if (!text) continue;
        if (BOILERPLATE_RE.test(text)) continue;

        // The first short line is usually the posting's own headline — "Senior
        // Frontend Engineer — Northwind Software". The role and the employer
        // are not things to add to a resume's skills, so they never become
        // terms. A posting that opens straight into "Requirements" is not a
        // headline, and must still register as a heading below.
        if (!seenContent) {
            seenContent = true;
            if (isHeadlineLine(text) && !REQUIREMENT_HEADING_RE.test(text)) continue;
        }

        if (REQUIREMENT_HEADING_RE.test(text)) {
            inRequirements = true;
            // A bare heading carries no terms of its own.
            if (text.length < 40) continue;
        } else if (/^[A-Z][A-Za-z ]{2,30}:?$/.test(text) && text.length < 32) {
            // Some other short heading — requirements section has ended.
            inRequirements = false;
        }

        const bulleted = /^[-*•●‣▪]\s+/.test(text);
        let weight = 1;
        if (inRequirements) weight += 1;
        if (bulleted) weight += 0.5;

        out.push({
            text: text.replace(/^[-*•●‣▪]\s+/, ''),
            weight,
            must: MUST_RE.test(text),
        });
    }
    return out;
}

/**
 * The role and employer from a posting's headline, when it has the usual shape
 * ("Senior Frontend Engineer — Northwind Software", "Data Analyst at Acme").
 * Used to prefill the Role/Company fields; both may come back empty.
 */
export function detectJobHeadline(jobDescription: string): {
    title: string;
    company: string;
} {
    for (const raw of (jobDescription || '').split(/\r?\n/)) {
        const text = raw.trim();
        if (!text) continue;
        if (BOILERPLATE_RE.test(text)) return { title: '', company: '' };
        // Same guard as jobLines: a heading is not a job title.
        if (!isHeadlineLine(text) || REQUIREMENT_HEADING_RE.test(text)) {
            return { title: '', company: '' };
        }
        const split = text.split(/\s+[—–|]\s+|\s+at\s+/i);
        return {
            title: (split[0] ?? '').trim(),
            company: (split[1] ?? '').trim(),
        };
    }
    return { title: '', company: '' };
}

/**
 * Tokens the job ad treats as names rather than prose: capitalised away from
 * the start of a sentence, ALL-CAPS, or carrying a symbol (C++, CI/CD).
 */
function signalTokens(jobDescription: string): Set<string> {
    const signals = new Set<string>();
    for (const sentence of (jobDescription || '').split(/(?<=[.!?:;\n])\s+/)) {
        const words = sentence.trim().split(/\s+/);
        words.forEach((word, i) => {
            const clean = word.replace(/^[^A-Za-z0-9+#.]+|[^A-Za-z0-9+#/.]+$/g, '');
            if (!clean) return;
            const hasSymbol = /[+#/]|\.[a-z]/i.test(clean);
            const allCaps = clean.length > 1 && clean === clean.toUpperCase() && /[A-Z]/.test(clean);
            const innerCaps = /^[A-Za-z][a-z]+[A-Z]/.test(clean); // TypeScript, GitHub
            const midCapital = i > 0 && /^[A-Z][a-z]{2,}$/.test(clean);
            if (hasSymbol || allCaps || innerCaps || midCapital) signals.add(tidy(clean));
        });
    }
    return signals;
}

/** First casing the job ad used for a term, so chips read "TypeScript". */
function displayForms(jobDescription: string): Map<string, string> {
    const forms = new Map<string, string>();
    const words = (jobDescription || '').split(/\s+/);
    for (let i = 0; i < words.length; i++) {
        const clean = words[i].replace(/^[^A-Za-z0-9+#.]+|[^A-Za-z0-9+#/.]+$/g, '');
        if (!clean) continue;
        const key = tidy(clean);
        if (key && !forms.has(key)) forms.set(key, clean);
        // Also record two- and three-word forms, for phrase chips.
        const next = words[i + 1]?.replace(/^[^A-Za-z0-9+#.]+|[^A-Za-z0-9+#/.]+$/g, '');
        if (!next) continue;
        const pairKey = `${key} ${tidy(next)}`;
        if (!forms.has(pairKey)) forms.set(pairKey, `${clean} ${next}`);

        const third = words[i + 2]?.replace(/^[^A-Za-z0-9+#.]+|[^A-Za-z0-9+#/.]+$/g, '');
        if (!third) continue;
        const tripleKey = `${pairKey} ${tidy(third)}`;
        if (!forms.has(tripleKey)) forms.set(tripleKey, `${clean} ${next} ${third}`);
    }
    return forms;
}

interface Tally {
    weight: number;
    must: boolean;
}

/**
 * Rank the terms a job description is actually asking for, strongest first.
 * `limit` caps the result so the UI stays scannable.
 */
export function extractJobTerms(jobDescription: string, limit = 24): JobTerm[] {
    const lines = jobLines(jobDescription);
    if (!lines.length) return [];

    const signals = signalTokens(jobDescription);
    const forms = displayForms(jobDescription);
    const unigrams = new Map<string, Tally>();
    const bigrams = new Map<string, Tally>();
    const trigrams = new Map<string, Tally>();

    const bump = (map: Map<string, Tally>, key: string, line: JobLine) => {
        const cur = map.get(key) ?? { weight: 0, must: false };
        cur.weight += line.weight;
        cur.must = cur.must || line.must;
        map.set(key, cur);
    };

    const isSignal = (token: string) => signals.has(token) || SKILL_LEXICON.has(token);

    for (const line of lines) {
        // Pair words only within a clause, so a phrase never straddles a comma
        // or a bracket.
        for (const clause of line.text.split(CLAUSE_SPLIT_RE)) {
            const tokens = (clause.match(TOKEN_RE) || [])
                .map(tidy)
                .filter((t) => t.length > 1);

            tokens.forEach((token, i) => {
                if (!STOP_WORDS.has(token)) bump(unigrams, token, line);
                const next = tokens[i + 1];
                if (!next) return;
                // A phrase is worth tracking when it is not two stop-words and
                // at least one half looks like a real term.
                if (STOP_WORDS.has(token) || STOP_WORDS.has(next)) return;
                if (!isSignal(token) && !isSignal(next)) return;
                bump(bigrams, `${token} ${next}`, line);

                const third = tokens[i + 2];
                if (third && !STOP_WORDS.has(third)) {
                    bump(trigrams, `${token} ${next} ${third}`, line);
                }
            });
        }
    }

    // Keep phrases that either repeat or name two real things.
    const kept = [...bigrams.entries()].filter(([key, t]) => {
        const [a, b] = key.split(' ');
        return t.weight >= 2.5 || (isSignal(a) && isSignal(b));
    });

    // "end-to-end testing" and "testing end-to-end" are the same requirement
    // seen from either side of a conjunction. Keep the heavier ordering only.
    const byWordSet = new Map<string, [string, Tally]>();
    for (const entry of kept) {
        const id = entry[0].split(' ').sort().join(' ');
        const seen = byWordSet.get(id);
        if (!seen || entry[1].weight > seen[1].weight) byWordSet.set(id, entry);
    }
    let phrases = [...byWordSet.values()];

    // "reusable component" + "component libraries" are two halves of one
    // requirement. Where a trigram actually occurred and both of its halves
    // survived, promote it and retire them.
    const keptKeys = new Set(phrases.map(([key]) => key));
    for (const [tri, tally] of trigrams) {
        const parts = tri.split(' ');
        const left = `${parts[0]} ${parts[1]}`;
        const right = `${parts[1]} ${parts[2]}`;
        if (!keptKeys.has(left) || !keptKeys.has(right)) continue;
        phrases = phrases.filter(([key]) => key !== left && key !== right);
        phrases.push([tri, tally]);
    }

    // A single word already covered by a kept phrase is noise.
    const covered = new Set<string>();
    phrases.forEach(([key]) => key.split(' ').forEach((w) => covered.add(w)));

    const scored: { key: string; weight: number; must: boolean }[] = [
        ...phrases.map(([key, t]) => ({ key, weight: t.weight * 1.6, must: t.must })),
        ...[...unigrams.entries()]
            // A bare word only counts if it looks like a term in its own right.
            // Demoting generic nouns instead of dropping them still let
            // "applications", "reusable" and "communication" reach the list.
            .filter(([key]) => !covered.has(key) && isSignal(key))
            .map(([key, t]) => ({ key, weight: t.weight * 1.5, must: t.must })),
    ];

    const ranked = scored
        .sort((a, b) => b.weight - a.weight || a.key.localeCompare(b.key))
        .slice(0, limit);

    // Flag must-haves strongest-first, then stop — see MAX_MUST_HAVES.
    let mustBudget = MAX_MUST_HAVES;
    return ranked.map((t) => {
        const wantsMust = t.must || t.weight >= 4;
        const priority: TermPriority = wantsMust && mustBudget > 0 ? 'must' : 'nice';
        if (priority === 'must') mustBudget--;
        return {
            term: forms.get(t.key) ?? t.key,
            key: t.key,
            weight: Math.round(t.weight * 10) / 10,
            priority,
            matched: false,
        };
    });
}

/** Resume text split by section, so a match can say where it already lives. */
export function resumeSectionTexts(doc: ResumeDoc): { label: string; text: string }[] {
    const b = doc.basics;
    const out: { label: string; text: string }[] = [
        {
            label: 'Personal details',
            text: [b.label, b.summary, ...b.profiles.map((p) => p.network)].join(' '),
        },
        {
            label: SECTION_LABELS.work,
            text: doc.work
                .map((w) => [w.position, w.name, w.summary, ...w.highlights].join(' '))
                .join(' '),
        },
        {
            label: SECTION_LABELS.education,
            text: doc.education
                .map((e) => [e.institution, e.area, e.studyType, ...e.courses].join(' '))
                .join(' '),
        },
        {
            label: SECTION_LABELS.skills,
            text: doc.skills.map((s) => [s.name, ...s.keywords].join(' ')).join(' '),
        },
        {
            label: SECTION_LABELS.projects,
            text: doc.projects
                .map((p) => [p.name, p.description, ...p.highlights].join(' '))
                .join(' '),
        },
        {
            label: SECTION_LABELS.certificates,
            text: doc.certificates.map((c) => [c.name, c.issuer].join(' ')).join(' '),
        },
        {
            label: SECTION_LABELS.awards,
            text: doc.awards.map((a) => [a.title, a.awarder, a.summary].join(' ')).join(' '),
        },
        {
            label: SECTION_LABELS.languages,
            text: doc.languages.map((l) => [l.language, l.fluency].join(' ')).join(' '),
        },
        {
            label: SECTION_LABELS.interests,
            text: doc.interests.map((i) => [i.name, ...i.keywords].join(' ')).join(' '),
        },
        ...doc.meta.customSections.map((cs) => ({
            label: cs.title || 'Custom section',
            text: cs.items.map((it) => [it.title, it.description].join(' ')).join(' '),
        })),
    ];
    return out.map((s) => ({ ...s, text: ` ${s.text.toLowerCase()} ` }));
}

const escapeRe = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Word-boundary match that tolerates a trailing plural. */
function contains(haystack: string, key: string): boolean {
    const re = new RegExp(`(^|[^a-z0-9])${escapeRe(key)}(e?s)?([^a-z0-9]|$)`, 'i');
    return re.test(haystack);
}

/** Compare a resume against a job description. */
export function matchJob(doc: ResumeDoc, jobDescription: string): JobMatch {
    const terms = extractJobTerms(jobDescription);
    if (!terms.length) {
        return { score: 0, terms: [], matched: [], missing: [], criticalMissing: [] };
    }

    const sections = resumeSectionTexts(doc);
    for (const term of terms) {
        const hit = sections.find((s) => contains(s.text, term.key));
        term.matched = !!hit;
        term.where = hit?.label;
    }

    // A must-have counts for three times a nice-to-have.
    const weightOf = (t: JobTerm) => (t.priority === 'must' ? 3 : 1);
    const total = terms.reduce((sum, t) => sum + weightOf(t), 0);
    const hit = terms.filter((t) => t.matched).reduce((sum, t) => sum + weightOf(t), 0);

    const matched = terms.filter((t) => t.matched);
    const missing = terms.filter((t) => !t.matched);

    return {
        score: total ? Math.round((hit / total) * 100) : 0,
        terms,
        matched,
        missing,
        criticalMissing: missing.filter((t) => t.priority === 'must'),
    };
}
