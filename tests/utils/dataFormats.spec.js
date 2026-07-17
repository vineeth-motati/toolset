/**
 * Functional tests for every text-based converter tool:
 * XML/JSON/YAML/CSV/HTML-table conversions, JSON formatting/validation
 * and XML escaping repair.
 */
import { describe, it, expect } from 'vitest';
import { XMLValidator } from 'fast-xml-parser';
import {
    xmlToJson,
    formatJson,
    validateJson,
    jsonToXml,
    jsonToCsv,
    csvToJson,
    yamlToJson,
    jsonToYaml,
    csvToXml,
    xmlToCsv,
    fixXmlEscaping,
    htmlTableToCsv,
    xmlFileToRecords,
} from '@/utils/converters/dataFormats';
import {
    makeFile,
    SAMPLE_CSV,
    SAMPLE_XML,
    SAMPLE_JSON_RECORDS,
} from '../helpers';

describe('xmlToJson (/tools/convert/xml-to-json)', () => {
    it('converts elements and attributes to JSON', async () => {
        const xml = '<user id="7"><name>Alice</name></user>';
        const result = await xmlToJson(makeFile(xml, 'user.xml'));
        const parsed = JSON.parse(result.text);
        expect(parsed.user.name).toBe('Alice');
        expect(parsed.user['@_id']).toBe('7');
        expect(result.filename).toBe('user.json');
        expect(result.blob.type).toBe('application/json');
    });

    it('honors the shared indentation param', async () => {
        const xml = '<a><b>1</b></a>';
        const compact = await xmlToJson(makeFile(xml, 'a.xml'), { space: 0 });
        expect(compact.text).not.toContain('\n');
        const tabs = await xmlToJson(makeFile(xml, 'a.xml'), { space: '1t' });
        expect(tabs.text).toContain('\t');
    });

    it('rejects malformed XML with a clear error', async () => {
        await expect(
            xmlToJson(makeFile('<a><b></a>', 'bad.xml'))
        ).rejects.toThrow(/Invalid XML/);
    });
});

describe('formatJson (/tools/convert/format-json)', () => {
    it('pretty-prints minified JSON', async () => {
        const result = await formatJson(
            makeFile('{"a":1,"b":[2,3]}', 'min.json')
        );
        expect(result.text).toBe(
            JSON.stringify({ a: 1, b: [2, 3] }, null, 2)
        );
        expect(result.filename).toBe('min.json');
    });

    it('accepts lenient JSON5 input (trailing commas, single quotes)', async () => {
        const result = await formatJson(
            makeFile("{a: 'x', b: 2,}", 'loose.json')
        );
        expect(JSON.parse(result.text)).toEqual({ a: 'x', b: 2 });
    });

    it('rejects invalid JSON with a clear error', async () => {
        await expect(formatJson(makeFile('{a:', 'bad.json'))).rejects.toThrow(
            /Invalid JSON/
        );
    });
});

describe('validateJson (/tools/convert/validate-json)', () => {
    it('reports valid objects with key count', async () => {
        const result = await validateJson(makeFile('{"a":1,"b":2}', 'x.json'));
        expect(result.text).toContain('✓ Valid JSON');
        expect(result.text).toContain('Root type: object');
        expect(result.text).toContain('2 keys');
        expect(result.filename).toBe('x.txt');
    });

    it('reports valid arrays with item count', async () => {
        const result = await validateJson(makeFile('[1,2,3]', 'x.json'));
        expect(result.text).toContain('Root type: array');
        expect(result.text).toContain('3 items');
    });

    it('reports invalid input without throwing — validation is the product', async () => {
        const result = await validateJson(makeFile('{oops}', 'x.json'));
        expect(result.text).toContain('✗ Invalid JSON');
    });

    it('reports primitive and null roots by their string value, not key/item counts', async () => {
        const number = await validateJson(makeFile('42', 'n.json'));
        expect(number.text).toContain('Root type: number');
        expect(number.text).toContain('Size: 42');

        const nullRoot = await validateJson(makeFile('null', 'z.json'));
        expect(nullRoot.text).toContain('Root type: object');
        expect(nullRoot.text).toContain('Size: null');
    });
});

describe('jsonToXml (/tools/convert/json-to-xml)', () => {
    it('wraps an object in a root element and emits a declaration', async () => {
        const result = await jsonToXml(makeFile('{"name":"Alice"}', 'a.json'));
        expect(result.text).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/);
        expect(result.text).toContain('<name>Alice</name>');
        expect(XMLValidator.validate(result.text)).toBe(true);
        expect(result.filename).toBe('a.xml');
    });

    it('wraps arrays in <root><item> so output stays single-rooted', async () => {
        const result = await jsonToXml(makeFile('[{"a":1},{"a":2}]', 'a.json'));
        expect(result.text).toContain('<item>');
        expect(XMLValidator.validate(result.text)).toBe(true);
    });
});

describe('jsonToCsv (/tools/convert/json-to-csv)', () => {
    it('converts an array of objects to CSV rows', async () => {
        const result = await jsonToCsv(
            makeFile(JSON.stringify(SAMPLE_JSON_RECORDS), 'people.json')
        );
        const [header, ...rows] = result.text.split(/\r?\n/);
        expect(header).toBe('name,age,city');
        expect(rows).toHaveLength(2);
        expect(rows[0]).toContain('Alice');
        expect(result.filename).toBe('people.csv');
    });

    it('accepts a single object as a one-row CSV', async () => {
        const result = await jsonToCsv(makeFile('{"a":1}', 'one.json'));
        expect(result.text.split(/\r?\n/)).toEqual(['a', '1']);
    });

    it('stringifies nested values instead of emitting [object Object]', async () => {
        const result = await jsonToCsv(
            makeFile('[{"meta":{"x":1}}]', 'n.json')
        );
        expect(result.text).not.toContain('[object Object]');
        expect(result.text).toContain('{""x"":1}');
    });

    it('rejects empty arrays and arrays of primitives', async () => {
        await expect(jsonToCsv(makeFile('[]', 'e.json'))).rejects.toThrow(
            /no records/
        );
        await expect(jsonToCsv(makeFile('[1,2]', 'p.json'))).rejects.toThrow(
            /array of objects/
        );
    });
});

describe('csvToJson (/tools/convert/csv-to-json)', () => {
    it('converts rows to objects with dynamic typing', async () => {
        const result = await csvToJson(makeFile(SAMPLE_CSV, 'people.csv'));
        const parsed = JSON.parse(result.text);
        expect(parsed).toEqual(SAMPLE_JSON_RECORDS);
        expect(result.filename).toBe('people.json');
    });

    it('rejects a header-only CSV as having no data rows', async () => {
        await expect(csvToJson(makeFile('a,b', 'empty.csv'))).rejects.toThrow(
            /no data rows/
        );
    });

    it('rejects an empty file as invalid CSV (no delimiter detectable)', async () => {
        await expect(csvToJson(makeFile('', 'empty.csv'))).rejects.toThrow(
            /Invalid CSV/
        );
    });
});

describe('yamlToJson (/tools/convert/yaml-to-json)', () => {
    it('converts nested YAML to JSON', async () => {
        const yaml = 'name: Alice\ntags:\n  - a\n  - b\n';
        const result = await yamlToJson(makeFile(yaml, 'cfg.yaml'));
        expect(JSON.parse(result.text)).toEqual({
            name: 'Alice',
            tags: ['a', 'b'],
        });
        expect(result.filename).toBe('cfg.json');
    });

    it('rejects malformed YAML with a clear error', async () => {
        await expect(
            yamlToJson(makeFile('a: [unclosed', 'bad.yaml'))
        ).rejects.toThrow(/Invalid YAML/);
    });
});

describe('jsonToYaml (/tools/convert/json-to-yaml)', () => {
    it('round-trips through yamlToJson', async () => {
        const result = await jsonToYaml(
            makeFile(JSON.stringify(SAMPLE_JSON_RECORDS), 'people.json')
        );
        expect(result.filename).toBe('people.yaml');
        const back = await yamlToJson(makeFile(result.text, 'people.yaml'));
        expect(JSON.parse(back.text)).toEqual(SAMPLE_JSON_RECORDS);
    });

    it('accepts JSON5 input', async () => {
        const result = await jsonToYaml(makeFile('{a: 1,}', 'loose.json'));
        expect(result.text).toContain('a: 1');
    });
});

describe('csvToXml (/tools/convert/csv-to-xml)', () => {
    it('emits one <row> per record with sanitized element names', async () => {
        const csv = 'Full Name,Age\nAlice,30';
        const result = await csvToXml(makeFile(csv, 'people.csv'));
        expect(result.text).toContain('<Full_Name>Alice</Full_Name>');
        expect(XMLValidator.validate(result.text)).toBe(true);
        expect(result.filename).toBe('people.xml');
    });

    it('rejects a CSV with no data rows', async () => {
        await expect(csvToXml(makeFile('', 'e.csv'))).rejects.toThrow(
            /no data rows/
        );
    });
});

describe('xmlToCsv (/tools/convert/xml-to-csv)', () => {
    it('finds the repeating element set and tabulates it', async () => {
        const result = await xmlToCsv(makeFile(SAMPLE_XML, 'people.xml'));
        const [header, ...rows] = result.text.trim().split(/\r?\n/);
        expect(header).toBe('name,age');
        expect(rows).toEqual(['Alice,30', 'Bob,25']);
        expect(result.filename).toBe('people.csv');
    });

    it('rejects XML without repeating elements', async () => {
        await expect(
            xmlToCsv(makeFile('<root><only>1</only></root>', 'x.xml'))
        ).rejects.toThrow(/No repeating elements/);
    });

    it('skips a repeating element whose values are primitives, not records', async () => {
        // <nums> repeats, but its parsed value is an array of numbers, not
        // objects — findRecordArray must reject it and keep searching
        // (finding nothing else here, so it still reports "no repeating").
        await expect(
            xmlToCsv(
                makeFile('<root><nums>1</nums><nums>2</nums></root>', 'x.xml')
            )
        ).rejects.toThrow(/No repeating elements/);
    });
});

describe('xmlFileToRecords (shared XML → rows pipeline)', () => {
    it('flattens nested children to JSON strings', async () => {
        const xml =
            '<root><row><name>A</name><meta><x>1</x></meta></row>' +
            '<row><name>B</name><meta><x>2</x></meta></row></root>';
        const records = await xmlFileToRecords(makeFile(xml, 'n.xml'));
        expect(records[0].name).toBe('A');
        expect(JSON.parse(records[0].meta)).toEqual({ x: 1 });
    });
});

describe('fixXmlEscaping (/tools/convert/fix-xml-escaping)', () => {
    it('escapes bare ampersands and returns valid, pretty-printed XML', async () => {
        const xml = '<a>Fish & Chips &amp; more</a>';
        const result = await fixXmlEscaping(makeFile(xml, 'menu.xml'));
        expect(result.text).toContain('Fish &amp; Chips');
        // The pre-existing entity must not end up double-escaped.
        expect(result.text).not.toContain('&amp;amp;');
        expect(XMLValidator.validate(result.text)).toBe(true);
        expect(result.filename).toBe('menu.xml');
    });

    it('leaves character-reference entities untouched (raw escape path)', async () => {
        // Mismatched tags keep the XML broken, so only the regex step runs —
        // this pins the entity-detection behavior without the pretty-printer
        // re-encoding numeric references.
        const result = await fixXmlEscaping(
            makeFile('<a>Fish & Chips &amp; &#38; &#x26;</b>', 'broken.xml')
        );
        expect(result.text).toContain('Fish &amp; Chips');
        expect(result.text).toContain('&amp; &#38; &#x26;');
        expect(result.text).not.toContain('&amp;amp;');
        expect(result.text).toContain('</b>');
    });
});

describe('htmlTableToCsv (/tools/convert/html-to-csv)', () => {
    it('extracts th/td cells with trimmed text', async () => {
        const html = `<html><body><table>
            <tr><th> Name </th><th>Age</th></tr>
            <tr><td>Alice</td><td> 30 </td></tr>
        </table></body></html>`;
        const result = await htmlTableToCsv(makeFile(html, 'page.html'));
        expect(result.text.split(/\r?\n/)).toEqual(['Name,Age', 'Alice,30']);
        expect(result.filename).toBe('page.csv');
    });

    it('rejects HTML without a table', async () => {
        await expect(
            htmlTableToCsv(makeFile('<p>no table</p>', 'p.html'))
        ).rejects.toThrow(/No <table>/);
    });

    it('rejects a table with no rows at all', async () => {
        const html = '<html><body><table></table></body></html>';
        await expect(
            htmlTableToCsv(makeFile(html, 'empty.html'))
        ).rejects.toThrow(/Table contains no rows/);
    });
});
