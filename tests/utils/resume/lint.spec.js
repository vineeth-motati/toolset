/**
 * Bullet linting (utils/resume/lint.ts) — the offline "improve it" pass.
 */
import { describe, it, expect } from 'vitest';
import {
    lintBullet,
    bulletHints,
    isActionVerb,
    WEAK_PHRASES,
    FILLER_WORDS,
    BULLET_MAX_CHARS,
} from '@/utils/resume/lint';

describe('isActionVerb', () => {
    it('accepts curated verbs regardless of case', () => {
        expect(isActionVerb('Led')).toBe(true);
        expect(isActionVerb('led')).toBe(true);
        expect(isActionVerb('SHIPPED')).toBe(true);
    });

    it('accepts inflected forms of curated verbs', () => {
        expect(isActionVerb('migrating')).toBe(true); // migrat- stem
        expect(isActionVerb('scaling')).toBe(true); // scal- stem
        expect(isActionVerb('ships')).toBe(true); // ship- stem of "Shipped"
    });

    it('rejects non-verbs and empties', () => {
        expect(isActionVerb('')).toBe(false);
        expect(isActionVerb('responsible')).toBe(false);
        expect(isActionVerb('the')).toBe(false);
    });
});

describe('lintBullet', () => {
    it('flags an empty bullet and scores it zero', () => {
        const l = lintBullet('   ');
        expect(l.empty).toBe(true);
        expect(l.strength).toBe(0);
        expect(bulletHints(l)).toEqual([]);
    });

    it('scores a strong bullet highly', () => {
        const l = lintBullet('Reduced page load time from 4.1s to 1.3s by code-splitting the dashboard');
        expect(l.startsWithVerb).toBe(true);
        expect(l.hasMetric).toBe(true);
        expect(l.hasPronoun).toBe(false);
        expect(l.weakPhrases).toEqual([]);
        expect(l.strength).toBeGreaterThanOrEqual(90);
        expect(bulletHints(l)).toEqual([]);
    });

    it('penalises duty language and reports the phrase', () => {
        const l = lintBullet('Responsible for the maintenance of the reporting dashboard');
        expect(l.weakPhrases).toContain('responsible for');
        expect(l.startsWithVerb).toBe(false);
        expect(l.strength).toBeLessThan(40);
        expect(bulletHints(l)).toContain('Drop "responsible for"');
    });

    it('detects first-person pronouns', () => {
        expect(lintBullet('I built the billing service').hasPronoun).toBe(true);
        expect(lintBullet('We shipped it').hasPronoun).toBe(true);
        // "my" inside another word must not trip it
        expect(lintBullet('Built the mystery service').hasPronoun).toBe(false);
    });

    it('recognises metrics in several shapes', () => {
        expect(lintBullet('Grew revenue by 30%').hasMetric).toBe(true);
        expect(lintBullet('Closed deals worth $1.2M').hasMetric).toBe(true);
        expect(lintBullet('Cut costs 12k per month').hasMetric).toBe(true);
        expect(lintBullet('Improved 3x over baseline').hasMetric).toBe(true);
        expect(lintBullet('Cut load time from 4.1s to 1.3s').hasMetric).toBe(true);
        expect(lintBullet('Mentored 5 engineers').hasMetric).toBe(true); // count of a thing
        expect(lintBullet('Adopted by 3 mid-size companies').hasMetric).toBe(true); // hyphenated
        expect(lintBullet('Shipped 6 internal design systems').hasMetric).toBe(true); // two-word noun
        expect(lintBullet('Improved the onboarding flow overall')).toHaveProperty('hasMetric', false);
    });

    it('does not treat a bare version number as a metric', () => {
        expect(lintBullet('Rebuilt the reporting UI in Vue 3').hasMetric).toBe(false);
    });

    it('flags length at both ends', () => {
        expect(lintBullet('Led the team').tooShort).toBe(true);
        const long = lintBullet(`Led ${'x'.repeat(BULLET_MAX_CHARS)}`);
        expect(long.tooLong).toBe(true);
        expect(bulletHints(long)).toContain('Trim to two lines');
    });

    it('finds filler words on word boundaries only', () => {
        expect(lintBullet('Successfully delivered 4 releases').fillerWords).toContain('successfully');
        // "very" must not match inside "every"
        expect(lintBullet('Shipped every release on time').fillerWords).toEqual([]);
    });

    it('keeps strength within 0-100', () => {
        const awful = lintBullet(
            'I was responsible for various tasks that were basically very successfully done'
        );
        expect(awful.strength).toBeGreaterThanOrEqual(0);
        expect(awful.strength).toBeLessThanOrEqual(100);
    });

    it('counts characters and words on the trimmed text', () => {
        const l = lintBullet('  Built three services  ');
        expect(l.charCount).toBe('Built three services'.length);
        expect(l.wordCount).toBe(3);
    });
});

describe('vocabularies', () => {
    it('are non-empty and lowercase', () => {
        expect(WEAK_PHRASES.length).toBeGreaterThan(5);
        expect(FILLER_WORDS.length).toBeGreaterThan(5);
        for (const p of [...WEAK_PHRASES, ...FILLER_WORDS]) {
            expect(p).toBe(p.toLowerCase());
        }
    });
});

describe('bulletHints', () => {
    it('asks for a verb and a number when both are missing', () => {
        const hints = bulletHints(lintBullet('Maintenance of the internal reporting dashboard'));
        expect(hints).toContain('Start with an action verb');
        expect(hints).toContain('Add a number or %');
    });
});
