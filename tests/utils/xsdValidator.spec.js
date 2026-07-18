/**
 * XML/XSD validation. libxml2-wasm is real here (it runs fine under Node) —
 * these tests exercise actual schema validation end-to-end, plus the
 * degraded well-formedness-only path when no XSD is pasted.
 */
import { describe, it, expect } from 'vitest';
import { validateXmlXsd } from '@/utils/converters/xsdValidator';
import { makeFile } from '../helpers';

const XSD = `<?xml version="1.0"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="person">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="name" type="xs:string"/>
        <xs:element name="age" type="xs:integer"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

const VALID_XML = `<?xml version="1.0"?>
<person><name>Alice</name><age>30</age></person>`;

const INVALID_XML = `<?xml version="1.0"?>
<person><name>Alice</name><age>not-a-number</age></person>`;

describe('validateXmlXsd', () => {
    it('validates conforming XML against a pasted XSD', async () => {
        const result = await validateXmlXsd(makeFile(VALID_XML, 'a.xml'), {
            xsd: XSD,
        });
        expect(result.filename).toBe('a.txt');
        expect(result.text).toContain('✓ Valid');
    });

    it('reports schema violations with line details', async () => {
        const result = await validateXmlXsd(makeFile(INVALID_XML, 'a.xml'), {
            xsd: XSD,
        });
        expect(result.text).toContain('✗ Invalid against schema');
        expect(result.text).toMatch(/line \d+/);
    });

    it('reports non-well-formed XML without needing a schema', async () => {
        const result = await validateXmlXsd(
            makeFile('<person><name>Alice</person>', 'broken.xml'),
            { xsd: XSD }
        );
        expect(result.text).toContain('✗ Not well-formed XML');
    });

    it('reports an uncompilable pasted schema', async () => {
        const result = await validateXmlXsd(makeFile(VALID_XML, 'a.xml'), {
            xsd: '<xs:schema>not really</xs:schema>',
        });
        expect(result.text).toContain('✗ Invalid XSD schema');
    });

    it('degrades to a well-formedness check when no XSD is pasted', async () => {
        const result = await validateXmlXsd(makeFile(VALID_XML, 'a.xml'), {});
        expect(result.text).toContain('✓ Well-formed XML');
        expect(result.text).toContain('only well-formedness was checked');
    });

    it('rejects empty input by filename', async () => {
        await expect(
            validateXmlXsd(makeFile('   ', 'empty.xml'), {})
        ).rejects.toThrow('empty.xml is empty');
    });
});
