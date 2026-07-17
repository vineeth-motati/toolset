/**
 * Excel converter tools. These tests exercise the real exceljs engine:
 * writers are verified by re-reading the produced .xlsx, readers are fed
 * workbooks built in the test — including exceljs' rich cell values
 * (rich text, formulas, hyperlinks, dates) that normalizeCell must flatten.
 */
import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import {
    excelToJson,
    excelToCsv,
    excelToXml,
    excelToSrt,
    jsonToExcel,
    csvToExcel,
    srtToExcel,
    xmlToExcel,
} from '@/utils/converters/excelConverters';
import { parseSrt } from '@/utils/converters/srtConverters';
import {
    makeFile,
    SAMPLE_CSV,
    SAMPLE_SRT,
    SAMPLE_XML,
    SAMPLE_JSON_RECORDS,
} from '../helpers';

const XLSX_MIME =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Build an .xlsx File from a header row + data rows (cells may be rich).
const makeExcelFile = async (rows, name = 'input.xlsx') => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Data');
    rows.forEach((row) => sheet.addRow(row));
    const buffer = await workbook.xlsx.writeBuffer();
    return new File([buffer], name, { type: XLSX_MIME });
};

// Re-read a produced .xlsx blob into [headerRow, ...dataRows] arrays.
const readSheet = async (blob) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await blob.arrayBuffer());
    const sheet = workbook.worksheets[0];
    const rows = [];
    sheet.eachRow((row) => {
        rows.push(row.values.slice(1)); // exceljs row.values is 1-indexed
    });
    return { sheet, rows };
};

describe('excelToJson (/tools/convert/excel-to-json)', () => {
    it('converts the first worksheet to records keyed by header row', async () => {
        const file = await makeExcelFile(
            [
                ['name', 'age'],
                ['Alice', 30],
                ['Bob', 25],
            ],
            'people.xlsx'
        );
        const result = await excelToJson(file);
        expect(JSON.parse(result.text)).toEqual([
            { name: 'Alice', age: 30 },
            { name: 'Bob', age: 25 },
        ]);
        expect(result.filename).toBe('people.json');
    });

    it('flattens rich text, formula results, hyperlinks and dates', async () => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Rich');
        sheet.addRow(['rich', 'formula', 'link', 'when']);
        sheet.addRow([
            { richText: [{ text: 'Hel' }, { text: 'lo' }] },
            { formula: 'A1+B1', result: 42 },
            { text: 'site', hyperlink: 'https://example.com' },
            new Date('2026-01-02T03:04:05.000Z'),
        ]);
        const buffer = await workbook.xlsx.writeBuffer();
        const result = await excelToJson(
            new File([buffer], 'rich.xlsx', { type: XLSX_MIME })
        );
        const [record] = JSON.parse(result.text);
        expect(record.rich).toBe('Hello');
        expect(record.formula).toBe(42);
        // normalizeCell prefers the visible label over the target URL.
        expect(record.link).toBe('site');
        expect(record.when).toBe('2026-01-02T03:04:05.000Z');
    });

    it('rejects a worksheet with headers but no data rows', async () => {
        const file = await makeExcelFile([['only', 'headers']]);
        await expect(excelToJson(file)).rejects.toThrow(/no data rows/);
    });
});

describe('excelToCsv (/tools/convert/excel-to-csv)', () => {
    it('emits a header line plus one line per record', async () => {
        const file = await makeExcelFile(
            [
                ['name', 'age'],
                ['Alice', 30],
            ],
            'people.xlsx'
        );
        const result = await excelToCsv(file);
        expect(result.text.trim().split(/\r?\n/)).toEqual([
            'name,age',
            'Alice,30',
        ]);
        expect(result.filename).toBe('people.csv');
    });
});

describe('excelToXml (/tools/convert/excel-to-xml)', () => {
    it('sanitizes header names into valid XML elements', async () => {
        const file = await makeExcelFile(
            [
                ['Full Name', 'Age'],
                ['Alice', 30],
            ],
            'people.xlsx'
        );
        const result = await excelToXml(file);
        expect(result.text).toContain('<Full_Name>Alice</Full_Name>');
        expect(result.text).toMatch(/^<\?xml version="1.0"/);
        expect(result.filename).toBe('people.xml');
    });
});

describe('excelToSrt (/tools/convert/excel-to-srt)', () => {
    it('builds subtitles from start/end/text columns', async () => {
        const file = await makeExcelFile(
            [
                ['start', 'end', 'text'],
                ['00:00:01,000', '00:00:04,000', 'Hello'],
            ],
            'subs.xlsx'
        );
        const result = await excelToSrt(file);
        const cues = parseSrt(result.text);
        expect(cues).toHaveLength(1);
        expect(cues[0].text).toBe('Hello');
        expect(result.filename).toBe('subs.srt');
    });
});

describe('jsonToExcel (/tools/convert/json-to-excel)', () => {
    it('writes records with a bold header row on Sheet1', async () => {
        const result = await jsonToExcel(
            makeFile(JSON.stringify(SAMPLE_JSON_RECORDS), 'people.json')
        );
        expect(result.filename).toBe('people.xlsx');
        expect(result.blob.type).toBe(XLSX_MIME);
        const { sheet, rows } = await readSheet(result.blob);
        expect(sheet.name).toBe('Sheet1');
        expect(sheet.getRow(1).font.bold).toBe(true);
        expect(rows[0]).toEqual(['name', 'age', 'city']);
        expect(rows[1]).toEqual(['Alice', 30, 'Paris']);
    });

    it('accepts a single object and rejects primitive arrays', async () => {
        const single = await jsonToExcel(makeFile('{"a":1}', 'one.json'));
        const { rows } = await readSheet(single.blob);
        expect(rows).toEqual([['a'], [1]]);
        await expect(
            jsonToExcel(makeFile('[1,2,3]', 'bad.json'))
        ).rejects.toThrow(/array of objects/);
        await expect(
            jsonToExcel(makeFile('not json', 'bad.json'))
        ).rejects.toThrow(/Invalid JSON/);
    });
});

describe('csvToExcel (/tools/convert/csv-to-excel)', () => {
    it('round-trips CSV rows into a worksheet', async () => {
        const result = await csvToExcel(makeFile(SAMPLE_CSV, 'people.csv'));
        expect(result.filename).toBe('people.xlsx');
        const { rows } = await readSheet(result.blob);
        expect(rows[0]).toEqual(['name', 'age', 'city']);
        expect(rows[2]).toEqual(['Bob', 25, 'Lyon']);
    });

    it('rejects an empty CSV', async () => {
        await expect(csvToExcel(makeFile('', 'e.csv'))).rejects.toThrow(
            /no data rows/
        );
    });
});

describe('srtToExcel (/tools/convert/srt-to-excel)', () => {
    it('writes one row per cue with index/start/end/text columns', async () => {
        const result = await srtToExcel(makeFile(SAMPLE_SRT, 'movie.srt'));
        expect(result.filename).toBe('movie.xlsx');
        const { rows } = await readSheet(result.blob);
        expect(rows[0]).toEqual(['index', 'start', 'end', 'text']);
        expect(rows[1]).toEqual([
            1,
            '00:00:01,000',
            '00:00:04,000',
            'Hello world',
        ]);
    });
});

describe('xmlToExcel (/tools/convert/xml-to-excel)', () => {
    it('tabulates repeating XML elements into a worksheet', async () => {
        const result = await xmlToExcel(makeFile(SAMPLE_XML, 'people.xml'));
        expect(result.filename).toBe('people.xlsx');
        const { rows } = await readSheet(result.blob);
        expect(rows[0]).toEqual(['name', 'age']);
        expect(rows[1]).toEqual(['Alice', 30]);
    });
});
