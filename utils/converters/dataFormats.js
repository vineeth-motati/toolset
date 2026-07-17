/**
 * Text-based data format converters: JSON / XML / YAML / CSV / HTML tables.
 * All synchronous parsing, all in-browser.
 */
import Papa from 'papaparse';
import JSON5 from 'json5';
import { load as yamlLoad, dump as yamlDump } from 'js-yaml';
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';
import { replaceExtension, textResult, toXmlName, toTable } from './shared';

// Maps the converter "space" param (shared select in config/converters.js)
// to a fast-xml-parser / JSON.stringify indent value.
const indentFromParam = (space, fallback = 2) => {
    const map = { 0: 0, '1s': 1, '2s': 2, '3s': 3, '4s': 4, '1t': '\t' };
    const indent = map[space];
    return indent === undefined ? fallback : indent;
};

const xmlParser = () =>
    new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        parseTagValue: true,
        trimValues: true,
    });

const xmlBuilder = (indent = 2) =>
    new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        format: indent !== 0,
        indentBy: typeof indent === 'number' ? ' '.repeat(indent) : indent,
    });

const parseXmlFile = async (file) => {
    const text = await file.text();
    const validation = XMLValidator.validate(text);
    if (validation !== true) {
        throw new Error(`Invalid XML: ${validation.err.msg}`);
    }
    return xmlParser().parse(text);
};

const parseJsonInput = async (file) => {
    const text = await file.text();
    try {
        return JSON5.parse(text);
    } catch (error) {
        throw new Error(`Invalid JSON: ${error.message}`);
    }
};

// XML documents don't map 1:1 to row data — find the first array of objects
// in the parsed tree and treat it as the record set.
const findRecordArray = (node) => {
    if (Array.isArray(node)) {
        return node.every((item) => item && typeof item === 'object')
            ? node
            : null;
    }
    if (node && typeof node === 'object') {
        for (const value of Object.values(node)) {
            const found = findRecordArray(value);
            if (found) return found;
        }
    }
    return null;
};

// Shared with the Excel module: XML file → flat record objects.
export const xmlFileToRecords = async (file) => {
    const parsed = await parseXmlFile(file);
    const records = findRecordArray(parsed);
    if (!records) {
        throw new Error(
            'No repeating elements found in XML — nothing to convert to rows'
        );
    }
    return recordsToRows(records);
};

const recordsToRows = (records) => {
    const flat = records.map((record) => {
        const row = {};
        for (const [key, value] of Object.entries(record)) {
            row[key] =
                value && typeof value === 'object'
                    ? JSON.stringify(value)
                    : value;
        }
        return row;
    });
    return flat;
};

export const xmlToJson = async (file, options = {}) => {
    const parsed = await parseXmlFile(file);
    const indent = indentFromParam(options.space);
    const json = JSON.stringify(parsed, null, indent);
    return textResult(
        json,
        replaceExtension(file.name, 'json'),
        'application/json'
    );
};

export const formatJson = async (file) => {
    const parsed = await parseJsonInput(file);
    const json = JSON.stringify(parsed, null, 2);
    return textResult(
        json,
        replaceExtension(file.name, 'json'),
        'application/json'
    );
};

export const validateJson = async (file) => {
    const text = await file.text();
    let report;
    try {
        const parsed = JSON.parse(text);
        const type = Array.isArray(parsed) ? 'array' : typeof parsed;
        const size = Array.isArray(parsed)
            ? `${parsed.length} items`
            : parsed && typeof parsed === 'object'
              ? `${Object.keys(parsed).length} keys`
              : String(parsed);
        report = `✓ Valid JSON\n\nRoot type: ${type}\nSize: ${size}\nCharacters: ${text.length}`;
    } catch (error) {
        report = `✗ Invalid JSON\n\n${error.message}`;
    }
    return textResult(report, replaceExtension(file.name, 'txt'));
};

export const jsonToXml = async (file) => {
    const parsed = await parseJsonInput(file);
    // XML needs a single root element; arrays get wrapped in <root><item>.
    const wrapped = Array.isArray(parsed)
        ? { root: { item: parsed } }
        : { root: parsed };
    const xml = xmlBuilder().build(wrapped);
    const output = `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
    return textResult(
        output,
        replaceExtension(file.name, 'xml'),
        'application/xml'
    );
};

export const jsonToCsv = async (file) => {
    const parsed = await parseJsonInput(file);
    const records = Array.isArray(parsed) ? parsed : [parsed];
    if (!records.length) {
        throw new Error('JSON contains no records to convert');
    }
    if (!records.every((r) => r && typeof r === 'object')) {
        throw new Error(
            'Expected a JSON array of objects (or a single object)'
        );
    }
    const csv = Papa.unparse(recordsToRows(records));
    return textResult(csv, replaceExtension(file.name, 'csv'), 'text/csv');
};

export const csvToJson = async (file) => {
    const text = await file.text();
    const parsed = Papa.parse(text.trim(), {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
    });
    const fatalError = parsed.errors.find((e) => e.type !== 'FieldMismatch');
    if (fatalError) {
        throw new Error(`Invalid CSV: ${fatalError.message}`);
    }
    if (!parsed.data.length) {
        throw new Error('CSV file contains no data rows');
    }
    const json = JSON.stringify(parsed.data, null, 2);
    return textResult(
        json,
        replaceExtension(file.name, 'json'),
        'application/json'
    );
};

export const yamlToJson = async (file) => {
    const text = await file.text();
    let parsed;
    try {
        parsed = yamlLoad(text);
    } catch (error) {
        throw new Error(`Invalid YAML: ${error.message}`);
    }
    const json = JSON.stringify(parsed, null, 2);
    return textResult(
        json,
        replaceExtension(file.name, 'json'),
        'application/json'
    );
};

export const jsonToYaml = async (file) => {
    const parsed = await parseJsonInput(file);
    const output = yamlDump(parsed, { indent: 2, lineWidth: 120 });
    return textResult(output, replaceExtension(file.name, 'yaml'));
};

export const csvToXml = async (file) => {
    const text = await file.text();
    const parsed = Papa.parse(text.trim(), {
        header: true,
        skipEmptyLines: true,
    });
    if (!parsed.data.length) {
        throw new Error('CSV file contains no data rows');
    }
    const rows = parsed.data.map((row) => {
        const record = {};
        for (const [key, value] of Object.entries(row)) {
            record[toXmlName(key)] = value;
        }
        return record;
    });
    const xml = xmlBuilder().build({ root: { row: rows } });
    const output = `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
    return textResult(
        output,
        replaceExtension(file.name, 'xml'),
        'application/xml'
    );
};

export const xmlToCsv = async (file) => {
    const records = await xmlFileToRecords(file);
    const { headers, rows } = toTable(records);
    const csv = Papa.unparse({ fields: headers, data: rows });
    return textResult(csv, replaceExtension(file.name, 'csv'), 'text/csv');
};

export const fixXmlEscaping = async (file) => {
    const text = await file.text();
    // Escape bare ampersands that aren't already part of an entity — the most
    // common cause of broken XML exports.
    const escaped = text.replace(
        /&(?!(?:[a-zA-Z][a-zA-Z0-9]*|#\d+|#x[0-9a-fA-F]+);)/g,
        '&amp;'
    );
    if (XMLValidator.validate(escaped) !== true) {
        // Couldn't fully repair — return the escaped version so the user
        // still gets the ampersand fix.
        return textResult(escaped, file.name, 'application/xml');
    }
    const pretty = xmlBuilder().build(xmlParser().parse(escaped));
    const output = `<?xml version="1.0" encoding="UTF-8"?>\n${pretty}`;
    return textResult(output, file.name, 'application/xml');
};

export const htmlTableToCsv = async (file) => {
    const text = await file.text();
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const table = doc.querySelector('table');
    if (!table) {
        throw new Error('No <table> element found in the HTML file');
    }
    const rows = [...table.querySelectorAll('tr')].map((tr) =>
        [...tr.querySelectorAll('th,td')].map((cell) =>
            cell.textContent.trim()
        )
    );
    if (!rows.length) {
        throw new Error('Table contains no rows');
    }
    const csv = Papa.unparse(rows);
    return textResult(csv, replaceExtension(file.name, 'csv'), 'text/csv');
};
