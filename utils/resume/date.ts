/**
 * Month/year helpers for the date pickers. The stored format stays exactly what
 * JSON Resume and templates/shared.ts already expect ("2021-03" or "2021"), so
 * swapping free-text inputs for pickers changes the UI only — not the data.
 */

export const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

export interface MonthYear {
    year: string; // '' | '2021'
    month: string; // '' | '01'..'12'
}

/** "2021-03-15" | "2021-03" | "2021" | junk -> { year, month }. */
export function splitMonthValue(value: string): MonthYear {
    const m = /^(\d{4})(?:-(\d{1,2}))?/.exec((value || '').trim());
    if (!m) return { year: '', month: '' };
    const month = m[2] ? String(Number(m[2])).padStart(2, '0') : '';
    return {
        year: m[1],
        month: month >= '01' && month <= '12' ? month : '',
    };
}

/** Inverse of splitMonthValue. A month without a year is not representable. */
export function joinMonthValue(year: string, month: string): string {
    const y = (year || '').trim();
    if (!/^\d{4}$/.test(y)) return '';
    const mo = (month || '').trim();
    return /^(0[1-9]|1[0-2])$/.test(mo) ? `${y}-${mo}` : y;
}

/** Descending year list for the picker — future years allow expected grad dates. */
export function yearOptions(currentYear: number, back = 45, forward = 6): string[] {
    const out: string[] = [];
    for (let y = currentYear + forward; y >= currentYear - back; y--) out.push(String(y));
    return out;
}

export const MONTH_OPTIONS = MONTH_NAMES.map((label, i) => ({
    label,
    value: String(i + 1).padStart(2, '0'),
}));
