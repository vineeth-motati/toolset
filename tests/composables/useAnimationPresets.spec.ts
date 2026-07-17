/**
 * Preset catalog behind the CSS Animation tool (/tools/animation).
 * Structural validation of every preset in every category — a malformed
 * keyframe here renders as a silently-broken animation in the tool.
 */
import { describe, it, expect } from 'vitest';
import { animationPresets } from '@/composables/useAnimationPresets';

type PresetEntry = [string, any];

const allPresets: PresetEntry[] = Object.entries(animationPresets).flatMap(
    ([category, groups]) =>
        Object.entries(groups as Record<string, any>).flatMap(
            ([group, presets]) =>
                Object.entries(presets as Record<string, any>).map(
                    ([name, preset]): PresetEntry => [
                        `${category}.${group}.${name}`,
                        preset,
                    ]
                )
        )
);

describe('animationPresets catalog', () => {
    it('has a non-trivial preset catalog', () => {
        expect(allPresets.length).toBeGreaterThan(20);
    });

    it.each(allPresets)('%s is a well-formed animation', (_id, preset) => {
        expect(preset.animationName).toBeTruthy();
        expect(preset.duration).toBeGreaterThan(0);
        expect(preset.timingFunction).toBeTruthy();
        expect(
            preset.iterationCount === 'infinite' ||
                typeof preset.iterationCount === 'number'
        ).toBe(true);
        expect([
            'normal',
            'alternate',
            'reverse',
            'alternate-reverse',
        ]).toContain(preset.direction);

        expect(Array.isArray(preset.keyframes)).toBe(true);
        expect(preset.keyframes.length).toBeGreaterThan(0);
        for (const keyframe of preset.keyframes) {
            expect(keyframe.percentage).toBeGreaterThanOrEqual(0);
            expect(keyframe.percentage).toBeLessThanOrEqual(100);
            expect(keyframe.properties).toBeTypeOf('object');
            expect(Object.keys(keyframe.properties).length).toBeGreaterThan(0);
        }

        // Keyframes must be ordered for valid CSS generation.
        const percentages = preset.keyframes.map(
            (k: { percentage: number }) => k.percentage
        );
        expect(percentages).toEqual([...percentages].sort((a, b) => a - b));
    });
});
