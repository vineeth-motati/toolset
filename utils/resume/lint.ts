/**
 * Bullet-level writing checks. Pure string analysis — the "Improve it" pass the
 * paid builders charge for, running offline in the browser.
 *
 * Everything here is deliberately mechanical (no AI): a bullet is strong when it
 * starts with an action verb, carries a number, and fits on one or two lines.
 */
import { ACTION_VERBS } from './content';

/**
 * Every inflected form we recognise. The curated list is written in the past
 * tense ("Scaled"), but bullets legitimately use other forms ("scaling"), so
 * both sides are expanded to their stems and compared — matching "scal" against
 * "scal" rather than "scaled" against "scaling".
 */
function inflections(word: string): string[] {
    const w = word.toLowerCase();
    const out = new Set<string>([w]);
    if (w.endsWith('ed')) {
        out.add(w.slice(0, -2));
        out.add(w.slice(0, -1));
        if (/([a-z])\1ed$/.test(w)) out.add(w.slice(0, -3)); // shipped -> ship
    }
    if (w.endsWith('ing')) {
        out.add(w.slice(0, -3));
        out.add(`${w.slice(0, -3)}e`);
        if (/([a-z])\1ing$/.test(w)) out.add(w.slice(0, -4));
    }
    if (w.endsWith('s') && !w.endsWith('ss')) out.add(w.slice(0, -1));
    // Guard against "led" collapsing to "l".
    return [...out].filter((s) => s.length >= 3 || s === w);
}

const VERB_FORMS = new Set(ACTION_VERBS.flatMap(inflections));

/** Phrases that describe duties instead of results. */
export const WEAK_PHRASES: string[] = [
    'responsible for',
    'duties included',
    'tasked with',
    'helped with',
    'worked on',
    'assisted with',
    'in charge of',
    'participated in',
    'involved in',
    'various tasks',
    'team player',
    'hard worker',
    'go-getter',
    'think outside the box',
    'detail oriented',
    'detail-oriented',
    'results oriented',
    'results-oriented',
    'self-starter',
    'proven track record',
];

/** Hedges that dilute an achievement. */
export const FILLER_WORDS: string[] = [
    'basically',
    'really',
    'very',
    'quite',
    'somewhat',
    'successfully',
    'effectively',
    'actively',
    'various',
    'several',
    'numerous',
];

/**
 * Matches "30%", "$1.2M", "12k", "3x", "4.1s", "90+", "400k-line" and a count of
 * something ("5 engineers"). A bare number with no unit and no thing being
 * counted ("Vue 3", "promoted 2 to senior") does not qualify on its own — the
 * check exists to push for a measured outcome, not to reward any stray digit.
 */
const METRIC_RE =
    /(\$\s?\d|\d+[.,]\d+|\b\d{2,}\b|\d+\s*(?:%|\+|k|m|bn?|x|s|ms|hrs?|hours?|days?|weeks?|months?|years?)\b|\b\d+\s+(?:[a-z][a-z-]*\s+){0,2}[a-z][a-z-]*s\b)/i;

/** First-person pronouns have no place on a resume. */
const PRONOUN_RE = /\b(i|me|my|mine|myself|we|our|ours)\b/i;

/** Soft cap — roughly two printed lines at 10pt on A4. */
export const BULLET_MAX_CHARS = 200;
export const BULLET_MIN_CHARS = 30;

export interface BulletLint {
    /** Text was blank/whitespace — callers usually skip these. */
    empty: boolean;
    startsWithVerb: boolean;
    /** Lowercased first word, for repeated-verb detection. */
    firstWord: string;
    hasMetric: boolean;
    hasPronoun: boolean;
    tooLong: boolean;
    tooShort: boolean;
    weakPhrases: string[];
    fillerWords: string[];
    charCount: number;
    wordCount: number;
    /** 0–100, for the inline strength meter. */
    strength: number;
}

function firstWordOf(text: string): string {
    const m = /^[^a-z]*([a-z][a-z'-]*)/i.exec(text);
    return m ? m[1].toLowerCase() : '';
}

/**
 * Treat a word as an action verb if any of its inflected forms matches any
 * inflected form of a curated verb ("migrated", "scaling", "ships").
 */
export function isActionVerb(word: string): boolean {
    if (!word) return false;
    return inflections(word).some((form) => VERB_FORMS.has(form));
}

function findAll(haystack: string, needles: string[]): string[] {
    const lower = haystack.toLowerCase();
    return needles.filter((n) =>
        // Word boundary on both ends so "very" doesn't match "every".
        new RegExp(`(^|[^a-z])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`, 'i').test(
            lower
        )
    );
}

/** Analyse one bullet / highlight line. */
export function lintBullet(text: string): BulletLint {
    const trimmed = (text || '').trim();
    const empty = trimmed.length === 0;
    const firstWord = firstWordOf(trimmed);
    const weakPhrases = empty ? [] : findAll(trimmed, WEAK_PHRASES);
    const fillerWords = empty ? [] : findAll(trimmed, FILLER_WORDS);
    const startsWithVerb = !empty && isActionVerb(firstWord);
    const hasMetric = !empty && METRIC_RE.test(trimmed);
    const hasPronoun = !empty && PRONOUN_RE.test(trimmed);
    const charCount = trimmed.length;
    const wordCount = empty ? 0 : trimmed.split(/\s+/).length;
    const tooLong = charCount > BULLET_MAX_CHARS;
    const tooShort = !empty && charCount < BULLET_MIN_CHARS;

    let strength = 0;
    if (!empty) {
        strength = 40;
        if (startsWithVerb) strength += 25;
        if (hasMetric) strength += 25;
        if (!tooLong && !tooShort) strength += 10;
        strength -= weakPhrases.length * 20;
        strength -= fillerWords.length * 8;
        strength -= hasPronoun ? 15 : 0;
        strength = Math.max(0, Math.min(100, strength));
    }

    return {
        empty,
        startsWithVerb,
        firstWord,
        hasMetric,
        hasPronoun,
        tooLong,
        tooShort,
        weakPhrases,
        fillerWords,
        charCount,
        wordCount,
        strength,
    };
}

/** Short, human hints for the inline chips under a bullet. */
export function bulletHints(lint: BulletLint): string[] {
    if (lint.empty) return [];
    const hints: string[] = [];
    if (!lint.startsWithVerb) hints.push('Start with an action verb');
    if (!lint.hasMetric) hints.push('Add a number or %');
    if (lint.weakPhrases.length) hints.push(`Drop "${lint.weakPhrases[0]}"`);
    if (lint.hasPronoun) hints.push('Remove "I"/"we"');
    if (lint.fillerWords.length) hints.push(`Cut "${lint.fillerWords[0]}"`);
    if (lint.tooLong) hints.push('Trim to two lines');
    else if (lint.tooShort) hints.push('Too thin — add the outcome');
    return hints;
}
