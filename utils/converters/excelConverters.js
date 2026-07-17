/**
 * Excel converters built on exceljs. exceljs is ~1MB, so it's imported
 * dynamically inside each handler — converter pages only pay for it when an
 * Excel conversion actually runs.
 */
import Papa from 'papaparse';
import JSON5 from 'json5';
import { XMLBuilder } from 'fast-xml-parser';
import {
    replaceExtension,
    textResult,
    toXmlName,
    toTable,
    toCellValue,
} from './shared';
import { parseSrt, buildSrt, rowsToCues } from './srtConverters';
import { xmlFileToRecords } from './dataFormats';
import { wrapHtmlDocument } from './docConverters';

const XLSX_MIME =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const loadExcelJS = async () => (await import('exceljs')).default;

// exceljs cell values can be rich objects (formulas, rich text, hyperlinks,
// dates) — normalize everything to primitives.
const normalizeCell = (value) => {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') {
        if (value.richText) return value.richText.map((r) => r.text).join('');
        if (value.result !== undefined) return normalizeCell(value.result);
        if (value.text !== undefined) return normalizeCell(value.text);
        if (value.hyperlink) return value.hyperlink;
        return JSON.stringify(value);
    }
    return value;
};

// First worksheet → array of objects keyed by header row.
const readRecords = async (file) => {
    const ExcelJS = await loadExcelJS();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
        throw new Error('Workbook contains no worksheets');
    }

    const headers = [];
    worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => {
        headers[col - 1] = String(normalizeCell(cell.value)) || `column${col}`;
    });
    if (!headers.length) {
        throw new Error('Worksheet is empty');
    }

    const records = [];
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const record = {};
        headers.forEach((header, i) => {
            record[header] = normalizeCell(row.getCell(i + 1).value);
        });
        records.push(record);
    });

    if (!records.length) {
        throw new Error('Worksheet contains no data rows');
    }
    return records;
};

// Array of objects → xlsx blob.
const writeRecords = async (records, filename) => {
    const ExcelJS = await loadExcelJS();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    const { headers, rows } = toTable(records);
    worksheet.addRow(headers);
    worksheet.getRow(1).font = { bold: true };
    rows.forEach((row) => worksheet.addRow(row));

    const buffer = await workbook.xlsx.writeBuffer();
    return {
        blob: new Blob([buffer], { type: XLSX_MIME }),
        filename,
    };
};

export const excelToJson = async (file) => {
    const records = await readRecords(file);
    const json = JSON.stringify(records, null, 2);
    return textResult(
        json,
        replaceExtension(file.name, 'json'),
        'application/json'
    );
};

export const excelToCsv = async (file) => {
    const records = await readRecords(file);
    const { headers, rows } = toTable(records);
    const csv = Papa.unparse({ fields: headers, data: rows });
    return textResult(csv, replaceExtension(file.name, 'csv'), 'text/csv');
};

export const excelToXml = async (file) => {
    const records = await readRecords(file);
    const rows = records.map((record) => {
        const row = {};
        for (const [key, value] of Object.entries(record)) {
            row[toXmlName(key)] = toCellValue(value);
        }
        return row;
    });
    const builder = new XMLBuilder({ format: true, indentBy: '  ' });
    const xml = builder.build({ root: { row: rows } });
    const output = `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
    return textResult(
        output,
        replaceExtension(file.name, 'xml'),
        'application/xml'
    );
};

const escapeHtml = (value) =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

export const excelToHtml = async (file) => {
    const records = await readRecords(file);
    const { headers, rows } = toTable(records);
    const thead = `<tr>${headers
        .map((h) => `<th>${escapeHtml(h)}</th>`)
        .join('')}</tr>`;
    const tbody = rows
        .map(
            (row) =>
                `<tr>${row
                    .map((cell) => `<td>${escapeHtml(cell)}</td>`)
                    .join('')}</tr>`
        )
        .join('\n');
    const title = file.name.replace(/\.[^.]+$/, '');
    const table = `<table border="1">\n<thead>${thead}</thead>\n<tbody>\n${tbody}\n</tbody>\n</table>`;
    return textResult(
        wrapHtmlDocument(title, table),
        replaceExtension(file.name, 'html'),
        'text/html'
    );
};

export const excelToSrt = async (file) => {
    const records = await readRecords(file);
    const srt = buildSrt(rowsToCues(records));
    return textResult(
        srt,
        replaceExtension(file.name, 'srt'),
        'application/x-subrip'
    );
};

export const jsonToExcel = async (file) => {
    let parsed;
    try {
        parsed = JSON5.parse(await file.text());
    } catch (error) {
        throw new Error(`Invalid JSON: ${error.message}`);
    }
    const records = Array.isArray(parsed) ? parsed : [parsed];
    if (!records.every((r) => r && typeof r === 'object')) {
        throw new Error(
            'Expected a JSON array of objects (or a single object)'
        );
    }
    return writeRecords(records, replaceExtension(file.name, 'xlsx'));
};

export const csvToExcel = async (file) => {
    const parsed = Papa.parse((await file.text()).trim(), {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
    });
    if (!parsed.data.length) {
        throw new Error('CSV file contains no data rows');
    }
    return writeRecords(parsed.data, replaceExtension(file.name, 'xlsx'));
};

export const srtToExcel = async (file) => {
    const cues = parseSrt(await file.text());
    return writeRecords(cues, replaceExtension(file.name, 'xlsx'));
};

export const xmlToExcel = async (file) => {
    const records = await xmlFileToRecords(file);
    return writeRecords(records, replaceExtension(file.name, 'xlsx'));
};
