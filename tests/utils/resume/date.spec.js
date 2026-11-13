/**
 * Month/year helpers (utils/resume/date.ts) behind the date pickers. These must
 * round-trip exactly the strings JSON Resume and the templates already use.
 */
import { describe, it, expect } from 'vitest';
import {
    splitMonthValue,
    joinMonthValue,
    displayMonth,
    yearOptions,
    MONTH_OPTIONS,
    MONTH_NAMES,
} from '@/utils/resume/date';

describe('splitMonthValue', () => {
    it('splits year-month, year-month-day and bare years', () => {
        expect(splitMonthValue('2021-03')).toEqual({ year: '2021', month: '03' });
        expect(splitMonthValue('2021-03-15')).toEqual({ year: '2021', month: '03' });
        expect(splitMonthValue('2021')).toEqual({ year: '2021', month: '' });
    });

    it('normalises a single-digit month', () => {
        expect(splitMonthValue('2021-3')).toEqual({ year: '2021', month: '03' });
    });

    it('drops an out-of-range month but keeps the year', () => {
        expect(splitMonthValue('2021-13')).toEqual({ year: '2021', month: '' });
        expect(splitMonthValue('2021-00')).toEqual({ year: '2021', month: '' });
    });

    it('returns empties for junk', () => {
        expect(splitMonthValue('')).toEqual({ year: '', month: '' });
        expect(splitMonthValue('Present')).toEqual({ year: '', month: '' });
        expect(splitMonthValue('last March')).toEqual({ year: '', month: '' });
    });
});

describe('joinMonthValue', () => {
    it('joins a valid year and month', () => {
        expect(joinMonthValue('2021', '03')).toBe('2021-03');
    });

    it('falls back to the year alone when the month is absent or invalid', () => {
        expect(joinMonthValue('2021', '')).toBe('2021');
        expect(joinMonthValue('2021', '13')).toBe('2021');
        expect(joinMonthValue('2021', '3')).toBe('2021'); // unpadded is rejected
    });

    it('returns empty without a four-digit year', () => {
        expect(joinMonthValue('', '03')).toBe('');
        expect(joinMonthValue('21', '03')).toBe('');
    });

    it('round-trips through splitMonthValue', () => {
        for (const v of ['2021-03', '2021', '1998-12']) {
            const { year, month } = splitMonthValue(v);
            expect(joinMonthValue(year, month)).toBe(v);
        }
    });
});

describe('displayMonth', () => {
    it('shows the pending month while no year is stored', () => {
        expect(displayMonth('', '03')).toBe('03');
    });

    it('prefers the stored month once a year exists', () => {
        expect(displayMonth('2021-07', '03')).toBe('07');
    });

    it('shows no month for a year-only value, ignoring a stale pending month', () => {
        // Undo/redo or switching entries can replace the model behind the
        // picker; the stored value must win so a stale month cannot reappear.
        expect(displayMonth('2021', '03')).toBe('');
    });

    it('is empty when nothing is stored and nothing is pending', () => {
        expect(displayMonth('', '')).toBe('');
        expect(displayMonth('', undefined)).toBe('');
    });

    describe('month-before-year regression', () => {
        // Month sits left of year in the picker, so this is the order users
        // actually fill it in. Picking March first used to yield a bare "2021".
        it('keeps the month when it is chosen before the year', () => {
            let model = '';
            let pending = '';

            // User picks March. Not storable yet — no year.
            pending = '03';
            model = joinMonthValue(splitMonthValue(model).year, '03');
            expect(model).toBe('');
            expect(displayMonth(model, pending)).toBe('03'); // still on screen

            // User picks 2021. The parked month gets folded back in.
            model = joinMonthValue('2021', displayMonth(model, pending));
            expect(model).toBe('2021-03');
            expect(displayMonth(model, pending)).toBe('03');
        });

        it('still works in the year-then-month order', () => {
            let model = joinMonthValue('2021', displayMonth('', ''));
            expect(model).toBe('2021');
            model = joinMonthValue(splitMonthValue(model).year, '03');
            expect(model).toBe('2021-03');
        });
    });
});

describe('yearOptions', () => {
    it('runs newest-first and spans the requested range', () => {
        const years = yearOptions(2026, 5, 2);
        expect(years[0]).toBe('2028');
        expect(years[years.length - 1]).toBe('2021');
        expect(years).toHaveLength(8);
    });
});

describe('MONTH_OPTIONS', () => {
    it('has twelve zero-padded values matching the names', () => {
        expect(MONTH_OPTIONS).toHaveLength(12);
        expect(MONTH_OPTIONS[0]).toEqual({ label: 'January', value: '01' });
        expect(MONTH_OPTIONS[11]).toEqual({ label: 'December', value: '12' });
        expect(MONTH_OPTIONS.map((m) => m.label)).toEqual(MONTH_NAMES);
    });
});
