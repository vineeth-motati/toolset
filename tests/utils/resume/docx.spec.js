/**
 * DOCX generation (utils/resume/docx.ts). Because the whole generator is pure
 * string building, the OOXML can be asserted directly — no Word, no DOM.
 */
import { describe, it, expect } from 'vitest';
import { buildDocxParts, buildDocumentXml, esc, DOCX_FONT } from '@/utils/resume/docx';
import { defaultResume, defaultTheme } from '@/utils/resume/schema';
import { sampleResume } from '@/utils/resume/sample';
import { fullResume } from './fixtures';

const build = (doc) => buildDocumentXml(doc, doc.meta.theme).xml;

describe('esc', () => {
    it('escapes the XML metacharacters', () => {
        expect(esc('Tom & Jerry <b> "x"')).toBe('Tom &amp; Jerry &lt;b&gt; &quot;x&quot;');
    });

    it('strips control characters XML 1.0 forbids', () => {
        expect(esc('Lead\x0bthe\x00team')).toBe('Leadtheteam');
    });

    it('keeps tabs and newlines, which are legal', () => {
        expect(esc('a\tb\nc')).toBe('a\tb\nc');
    });

    it('handles nullish input', () => {
        expect(esc(null)).toBe('');
        expect(esc(undefined)).toBe('');
    });
});

describe('package structure', () => {
    it('emits every part a minimal .docx needs', () => {
        const parts = buildDocxParts(fullResume(), defaultTheme());
        expect(Object.keys(parts).sort()).toEqual(
            [
                '[Content_Types].xml',
                '_rels/.rels',
                'docProps/core.xml',
                'word/_rels/document.xml.rels',
                'word/document.xml',
                'word/numbering.xml',
                'word/styles.xml',
            ].sort()
        );
    });

    it('declares an XML prolog on every part', () => {
        const parts = buildDocxParts(fullResume(), defaultTheme());
        for (const xml of Object.values(parts)) {
            expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>')).toBe(true);
        }
    });

    it('content types cover document, styles and numbering', () => {
        const ct = buildDocxParts(fullResume(), defaultTheme())['[Content_Types].xml'];
        expect(ct).toContain('/word/document.xml');
        expect(ct).toContain('/word/styles.xml');
        expect(ct).toContain('/word/numbering.xml');
    });

    it('is deterministic — the same resume yields identical parts', () => {
        const a = buildDocxParts(sampleResume(), defaultTheme());
        const b = buildDocxParts(sampleResume(), defaultTheme());
        expect(a).toEqual(b);
    });

    it('produces balanced document/body tags', () => {
        const xml = build(fullResume());
        expect(xml).toContain('<w:body>');
        expect(xml).toContain('</w:body></w:document>');
        // Every opened paragraph is closed.
        expect((xml.match(/<w:p>/g) || []).length).toBe((xml.match(/<\/w:p>/g) || []).length);
        expect((xml.match(/<w:r>/g) || []).length).toBe((xml.match(/<\/w:r>/g) || []).length);
    });
});

describe('styles', () => {
    it('uses a font that exists on the reader machine, not the PDF face', () => {
        const styles = buildDocxParts(fullResume(), defaultTheme())['word/styles.xml'];
        expect(styles).toContain(`w:ascii="${DOCX_FONT}"`);
        expect(styles).not.toContain('Roboto');
    });

    it('registers Heading1 under its built-in name so Word treats it as a heading', () => {
        const styles = buildDocxParts(fullResume(), defaultTheme())['word/styles.xml'];
        expect(styles).toContain('w:styleId="Heading1"');
        expect(styles).toContain('<w:name w:val="heading 1"/>');
    });

    it('converts points to half-points for the body size', () => {
        const theme = { ...defaultTheme(), fontSize: 11 };
        const styles = buildDocxParts(fullResume(), theme)['word/styles.xml'];
        expect(styles).toContain('<w:sz w:val="22"/>');
    });

    it('converts line height to 240ths', () => {
        const theme = { ...defaultTheme(), lineHeight: 1.5 };
        const styles = buildDocxParts(fullResume(), theme)['word/styles.xml'];
        expect(styles).toContain('w:line="360"');
    });
});

describe('page setup', () => {
    it('sizes an A4 page in twips', () => {
        const doc = fullResume();
        doc.meta.theme.pageSize = 'A4';
        expect(build(doc)).toContain('<w:pgSz w:w="11906" w:h="16838"/>');
    });

    it('sizes a US Letter page in twips', () => {
        const doc = fullResume();
        doc.meta.theme.pageSize = 'LETTER';
        expect(build(doc)).toContain('<w:pgSz w:w="12240" w:h="15840"/>');
    });

    it('maps margins [left, top, right, bottom] onto pgMar', () => {
        const doc = fullResume();
        doc.meta.theme.margins = [40, 50, 60, 70];
        const xml = build(doc);
        expect(xml).toContain('w:top="1000"');
        expect(xml).toContain('w:right="1200"');
        expect(xml).toContain('w:bottom="1400"');
        expect(xml).toContain('w:left="800"');
    });

    it('puts sectPr last inside the body', () => {
        const xml = build(fullResume());
        expect(xml.indexOf('<w:sectPr>')).toBeGreaterThan(xml.lastIndexOf('</w:p>'));
    });
});

describe('content', () => {
    it('writes the name, headline and summary', () => {
        const xml = build(fullResume());
        expect(xml).toContain('Ada Lovelace');
        expect(xml).toContain('Software Engineer');
        expect(xml).toContain('Analytical engineer with a decade');
    });

    it('falls back to a placeholder name so the file is never headerless', () => {
        expect(build(defaultResume())).toContain('Your Name');
    });

    it('renders highlights as real numbered bullets, not typed dashes', () => {
        const xml = build(fullResume());
        expect(xml).toContain('<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>');
        expect(xml).toContain('Cut build time by 60%');
    });

    it('defines the bullet numbering the paragraphs reference', () => {
        const numbering = buildDocxParts(fullResume(), defaultTheme())['word/numbering.xml'];
        expect(numbering).toContain('<w:num w:numId="1">');
        expect(numbering).toContain('<w:numFmt w:val="bullet"/>');
    });

    it('uses a real tab element and a right tab stop for dates', () => {
        const xml = build(fullResume());
        expect(xml).toContain('<w:tab/>');
        expect(xml).toContain('<w:tab w:val="right"');
        expect(xml).toContain('Mar 2021 – Present');
    });

    it('emits section headings in document order', () => {
        const doc = fullResume();
        doc.meta.sectionsOrder = ['skills', 'work', 'education', 'projects', 'certificates', 'awards', 'languages', 'interests', 'references'];
        const xml = build(doc);
        expect(xml.indexOf('SKILLS')).toBeLessThan(xml.indexOf('EXPERIENCE'));
    });

    it('omits hidden sections', () => {
        const doc = fullResume();
        doc.meta.sectionVisibility.education = false;
        const xml = build(doc);
        expect(xml).not.toContain('EDUCATION');
        expect(xml).not.toContain('University of London');
    });

    it('omits empty sections', () => {
        const doc = fullResume();
        doc.awards = [];
        expect(build(doc)).not.toContain('AWARDS');
    });

    it('renders custom sections last', () => {
        const xml = build(fullResume());
        expect(xml).toContain('PUBLICATIONS');
        expect(xml).toContain('Notes on the Analytical Engine');
        expect(xml.indexOf('PUBLICATIONS')).toBeGreaterThan(xml.indexOf('EXPERIENCE'));
    });

    it('never embeds the photo — images are what ATS parsers choke on', () => {
        const parts = buildDocxParts(fullResume(), defaultTheme());
        expect(Object.keys(parts).some((p) => p.startsWith('word/media/'))).toBe(false);
        expect(parts['word/document.xml']).not.toContain('data:image');
    });
});

describe('hyperlinks', () => {
    it('registers an external relationship per unique link', () => {
        const { xml, rels } = buildDocumentXml(fullResume(), defaultTheme());
        expect(rels.length).toBeGreaterThan(0);
        rels.forEach((r) => expect(xml).toContain(`<w:hyperlink r:id="${r.id}">`));
    });

    it('marks link relationships External and skips the reserved ids', () => {
        const relsXml = buildDocxParts(fullResume(), defaultTheme())['word/_rels/document.xml.rels'];
        expect(relsXml).toContain('Target="styles.xml"');
        expect(relsXml).toContain('Target="numbering.xml"');
        expect(relsXml).toContain('TargetMode="External"');
        // rId1/rId2 are styles and numbering, so hyperlinks start at rId3.
        expect(relsXml).toContain('Id="rId3"');
    });

    it('mails the email address and reuses an id for a repeated target', () => {
        const doc = defaultResume();
        doc.basics.email = 'ada@example.com';
        doc.basics.url = 'https://ada.dev';
        doc.basics.profiles = [{ network: 'Site', username: 'ada', url: 'https://ada.dev' }];
        const { rels } = buildDocumentXml(doc, doc.meta.theme);
        expect(rels.some((r) => r.target === 'mailto:ada@example.com')).toBe(true);
        expect(rels.filter((r) => r.target === 'https://ada.dev')).toHaveLength(1);
    });

    it('escapes an ampersand in a link target', () => {
        const doc = defaultResume();
        doc.basics.url = 'https://example.com/?a=1&b=2';
        const relsXml = buildDocxParts(doc, doc.meta.theme)['word/_rels/document.xml.rels'];
        expect(relsXml).toContain('a=1&amp;b=2');
        expect(relsXml).not.toMatch(/&(?!amp;|lt;|gt;|quot;)/);
    });
});

describe('templates', () => {
    it('centres the name for Classic and left-aligns it for Modern', () => {
        const classic = fullResume();
        classic.meta.template = 'classic';
        expect(build(classic)).toContain('<w:jc w:val="center"/>');

        const modern = fullResume();
        modern.meta.template = 'modern';
        expect(build(modern)).not.toContain('<w:jc w:val="center"/>');
    });

    it('renders ATS Plain with no colour and no rules', () => {
        const doc = fullResume();
        doc.meta.template = 'atsPlain';
        doc.meta.theme.accent = '#4F46E5';
        const xml = build(doc);
        expect(xml).not.toContain('4F46E5');
        expect(xml).not.toContain('<w:pBdr>');
    });

    it('carries the accent colour into Classic heading rules', () => {
        const doc = fullResume();
        doc.meta.template = 'classic';
        doc.meta.theme.accent = '#0F766E';
        const xml = build(doc);
        expect(xml).toContain('<w:pBdr>');
        expect(xml).toContain('w:color="0F766E"');
    });
});

describe('hostile input', () => {
    it('survives a resume full of XML metacharacters', () => {
        const doc = defaultResume();
        doc.basics.name = 'A <script> & "friends"';
        doc.basics.summary = 'Reduced cost by >50% & <b>shipped</b>';
        doc.work = [
            {
                name: 'X & Y Ltd',
                position: '<Engineer>',
                startDate: '2020',
                endDate: '',
                location: '',
                summary: '',
                highlights: ['Cut "waste" by 30% & grew <revenue>'],
            },
        ];
        const xml = build(doc);
        expect(xml).toContain('A &lt;script&gt; &amp; &quot;friends&quot;');
        // No raw metacharacter survives outside a legitimate entity.
        const text = xml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g).join('');
        expect(text).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;|#)/);
    });

    it('handles a completely empty resume without throwing', () => {
        expect(() => buildDocxParts(defaultResume(), defaultTheme())).not.toThrow();
    });
});
