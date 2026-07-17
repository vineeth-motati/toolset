import { describe, it, expect } from 'vitest';
import {
    replaceExtension,
    textResult,
    toXmlName,
    toCellValue,
    toTable,
} from '@/utils/converters/shared';

describe('replaceExtension', () => {
    it('swaps the final extension', () => {
        expect(replaceExtension('data.xml', 'json')).toBe('data.json');
    });

    it('only touches the last extension of dotted names', () => {
        expect(replaceExtension('backup.2024.csv', 'xlsx')).toBe(
            'backup.2024.xlsx'
        );
    });

    it('appends when there is no extension', () => {
        expect(replaceExtension('README', 'txt')).toBe('README.txt');
    });
});

describe('textResult', () => {
    it('returns blob, filename and text', async () => {
        const result = textResult('hello', 'out.txt');
        expect(result.filename).toBe('out.txt');
        expect(result.text).toBe('hello');
        expect(await result.blob.text()).toBe('hello');
        expect(result.blob.type).toBe('text/plain');
    });

    it('honors a custom mime type', () => {
        const result = textResult('{}', 'out.json', 'application/json');
        expect(result.blob.type).toBe('application/json');
    });
});

describe('toXmlName', () => {
    it('replaces spaces and punctuation with underscores', () => {
        expect(toXmlName('First Name')).toBe('First_Name');
        expect(toXmlName('price ($)')).toBe('price____');
    });

    it('prefixes names that start with a digit', () => {
        expect(toXmlName('1st place')).toBe('_1st_place');
    });

    it('keeps already-valid names intact', () => {
        expect(toXmlName('valid_name-1')).toBe('valid_name-1');
    });

    it('stringifies non-string input', () => {
        expect(toXmlName(42)).toBe('_42');
    });
});

describe('toCellValue', () => {
    it('maps null and undefined to empty string', () => {
        expect(toCellValue(null)).toBe('');
        expect(toCellValue(undefined)).toBe('');
    });

    it('JSON-stringifies objects and arrays', () => {
        expect(toCellValue({ a: 1 })).toBe('{"a":1}');
        expect(toCellValue([1, 2])).toBe('[1,2]');
    });

    it('passes primitives through untouched', () => {
        expect(toCellValue('x')).toBe('x');
        expect(toCellValue(0)).toBe(0);
        expect(toCellValue(false)).toBe(false);
    });
});

describe('toTable', () => {
    it('unions headers across non-uniform records', () => {
        const { headers, rows } = toTable([
            { a: 1, b: 2 },
            { b: 3, c: 4 },
        ]);
        expect(headers).toEqual(['a', 'b', 'c']);
        expect(rows).toEqual([
            [1, 2, ''],
            ['', 3, 4],
        ]);
    });

    it('flattens nested values so CSV/Excel never see [object Object]', () => {
        const { rows } = toTable([{ meta: { x: 1 } }]);
        expect(rows[0][0]).toBe('{"x":1}');
    });

    it('handles an empty record set', () => {
        expect(toTable([])).toEqual({ headers: [], rows: [] });
    });
});
