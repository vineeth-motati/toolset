/**
 * Formula engine behind the Sheets tool (/tools/sheets): cell reference
 * math and formula evaluation via mathjs.
 */
import { describe, it, expect, vi } from 'vitest';
import { useSheetsFormulas } from '@/composables/useSheetsFormulas';

const { evaluateFormula, getCellReference, parseCellReference } =
    useSheetsFormulas();

describe('getCellReference', () => {
    it('maps 0-based coordinates to A1 notation', () => {
        expect(getCellReference(0, 0)).toBe('A1');
        expect(getCellReference(2, 9)).toBe('C10');
        expect(getCellReference(25, 0)).toBe('Z1');
    });

    it('rolls over to double letters past column Z', () => {
        expect(getCellReference(26, 0)).toBe('AA1');
        expect(getCellReference(27, 0)).toBe('AB1');
        expect(getCellReference(51, 0)).toBe('AZ1');
        expect(getCellReference(52, 0)).toBe('BA1');
    });
});

describe('parseCellReference', () => {
    it('parses single and double letter columns', () => {
        expect(parseCellReference('A1')).toEqual({ col: 0, row: 0 });
        expect(parseCellReference('Z9')).toEqual({ col: 25, row: 8 });
        expect(parseCellReference('AA10')).toEqual({ col: 26, row: 9 });
    });

    it('returns null for non-references', () => {
        expect(parseCellReference('hello')).toBeNull();
        expect(parseCellReference('123')).toBeNull();
    });

    it('round-trips with getCellReference', () => {
        for (const [col, row] of [
            [0, 0],
            [25, 3],
            [26, 7],
            [51, 99],
            [702, 0], // AAA1 — triple letters
        ]) {
            expect(parseCellReference(getCellReference(col, row))).toEqual({
                col,
                row,
            });
        }
    });
});

describe('evaluateFormula', () => {
    const cells: Record<string, unknown> = {
        A1: 10,
        A2: 5,
        B1: 'hello',
    };
    const getCellValue = (ref: string) => cells[ref];

    it('substitutes numeric cell references before evaluating', () => {
        expect(evaluateFormula('A1 + A2', getCellValue)).toBe(15);
        expect(evaluateFormula('A1 * 2 - A2', getCellValue)).toBe(15);
    });

    it('supports mathjs functions', () => {
        expect(evaluateFormula('sqrt(A1 + 6)', getCellValue)).toBe(4);
        expect(evaluateFormula('max(A1, A2, 3)', getCellValue)).toBe(10);
    });

    it('quotes non-numeric cell values as strings', () => {
        expect(evaluateFormula('B1', getCellValue)).toBe('hello');
    });

    it('returns #ERROR! instead of throwing on bad formulas', () => {
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        expect(evaluateFormula('A1 +* 2', getCellValue)).toBe('#ERROR!');
        expect(consoleError).toHaveBeenCalled();
    });
});
