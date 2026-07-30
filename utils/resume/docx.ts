/**
 * DOCX export, hand-built as WordprocessingML.
 *
 * A .docx is a ZIP of XML parts, and fflate is already a dependency (see
 * utils/converters/pdfConverters.js), so this needs no new package — and the
 * whole generator stays a pure string function, testable without a DOM or a
 * Word install.
 *
 * The output is deliberately plain: single column, real heading styles, a
 * right tab stop for dates, genuine bullet numbering. That is the shape
 * applicant-tracking systems parse most reliably — the same reason the ATS
 * Plain PDF template exists. No text boxes, no tables, no images.
 *
 * Nothing here reads the clock, so the same resume always produces byte-equal
 * parts.
 */
import {
    dateRange,
    fmtDate,
    SECTION_LABELS,
    PAGE_DIMENSIONS,
    visibleSections,
    visibleCustomSections,
} from './templates/shared';
import type { ResumeDoc, ResumeTheme, SectionKey } from './types';

/** Word measures lengths in twips (1/20 pt) and font sizes in half-points. */
const twip = (pt: number): number => Math.round(pt * 20);
const halfPt = (pt: number): number => Math.max(2, Math.round(pt * 2));
/** Border widths are in eighths of a point. */
const eighthPt = (pt: number): number => Math.max(2, Math.round(pt * 8));
const hex = (color: string): string => color.replace('#', '').toUpperCase();

/**
 * XML text escape. Also drops control characters that XML 1.0 forbids outright
 * — a stray \x0b pasted from a PDF would otherwise make Word reject the file.
 */
export function esc(value: string): string {
    return String(value ?? '')
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const W_NS =
    'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';

/**
 * Roboto (the PDF face) is not installed on most machines that will open this
 * file, and Word substitutes missing fonts unpredictably. Calibri is present
 * everywhere Word is, and LibreOffice/Google Docs substitute it cleanly.
 */
export const DOCX_FONT = 'Calibri';

interface Run {
    text: string;
    bold?: boolean;
    italic?: boolean;
    color?: string;
    /** Absolute size in points; defaults to the theme body size. */
    size?: number;
    link?: string;
    caps?: boolean;
    /** Extra letter-spacing in points, for the heading treatments. */
    spacing?: number;
    /** Emits a real <w:tab/>. A literal "\t" in <w:t> is just whitespace. */
    tab?: boolean;
}

interface ParaOptions {
    align?: 'left' | 'center' | 'right';
    /** Space above, in points. */
    before?: number;
    /** Space below, in points. */
    after?: number;
    /** Right tab stop position, in twips — used for the date column. */
    rightTab?: number;
    bullet?: boolean;
    style?: string;
    border?: { color: string; width: number };
    lineHeight?: number;
}

/** Collects external hyperlink relationships as runs are emitted. */
class RelStore {
    private links: { id: string; target: string }[] = [];
    /** Fixed ids 1 and 2 belong to styles.xml and numbering.xml. */
    private next = 3;

    add(target: string): string {
        const existing = this.links.find((l) => l.target === target);
        if (existing) return existing.id;
        const id = `rId${this.next++}`;
        this.links.push({ id, target });
        return id;
    }

    all() {
        return this.links;
    }
}

function runXml(run: Run, theme: ResumeTheme, rels: RelStore): string {
    const props: string[] = [];
    if (run.bold) props.push('<w:b/>');
    if (run.italic) props.push('<w:i/>');
    if (run.caps) props.push('<w:caps/>');
    if (run.color) props.push(`<w:color w:val="${hex(run.color)}"/>`);
    if (run.spacing) props.push(`<w:spacing w:val="${twip(run.spacing)}"/>`);
    const size = halfPt(run.size ?? theme.fontSize);
    props.push(`<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>`);
    if (run.link) props.push('<w:rStyle w:val="Hyperlink"/>');

    // xml:space="preserve" keeps the separator spaces in the contact line.
    const content = run.tab
        ? '<w:tab/>'
        : `<w:t xml:space="preserve">${esc(run.text)}</w:t>`;
    const body = `<w:r><w:rPr>${props.join('')}</w:rPr>${content}</w:r>`;

    if (!run.link) return body;
    return `<w:hyperlink r:id="${rels.add(run.link)}">${body}</w:hyperlink>`;
}

function paraXml(
    runs: Run[],
    theme: ResumeTheme,
    rels: RelStore,
    opts: ParaOptions = {}
): string {
    const p: string[] = [];
    if (opts.style) p.push(`<w:pStyle w:val="${opts.style}"/>`);
    if (opts.bullet) {
        p.push('<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>');
        p.push('<w:ind w:left="360" w:hanging="180"/>');
    }
    if (opts.border) {
        p.push(
            `<w:pBdr><w:bottom w:val="single" w:sz="${eighthPt(opts.border.width)}"` +
                ` w:space="1" w:color="${hex(opts.border.color)}"/></w:pBdr>`
        );
    }
    if (opts.align && opts.align !== 'left') {
        p.push(`<w:jc w:val="${opts.align}"/>`);
    }
    if (opts.rightTab) {
        p.push(`<w:tabs><w:tab w:val="right" w:pos="${opts.rightTab}"/></w:tabs>`);
    }
    const line = Math.round(240 * (opts.lineHeight ?? theme.lineHeight));
    p.push(
        `<w:spacing w:before="${twip(opts.before ?? 0)}"` +
            ` w:after="${twip(opts.after ?? 0)}"` +
            ` w:line="${line}" w:lineRule="auto"/>`
    );

    const content = runs.map((r) => runXml(r, theme, rels)).join('');
    return `<w:p><w:pPr>${p.join('')}</w:pPr>${content}</w:p>`;
}

/** Per-template look, mirroring the three pdfmake templates. */
function templateStyle(doc: ResumeDoc, theme: ResumeTheme) {
    const plain = doc.meta.template === 'atsPlain';
    const modern = doc.meta.template === 'modern';
    return {
        plain,
        nameAlign: (doc.meta.template === 'classic' ? 'center' : 'left') as 'center' | 'left',
        nameColor: plain ? '#000000' : modern ? theme.accent : '#111827',
        nameSize: theme.fontSize + (modern ? 14 : plain ? 8 : 12),
        headingColor: plain ? '#000000' : modern ? theme.accent : '#111827',
        headingCaps: !modern,
        headingBorder: plain
            ? null
            : modern
              ? { color: '#E5E7EB', width: 0.6 }
              : { color: theme.accent, width: 0.8 },
        linkColor: plain ? '#000000' : theme.accent,
        mutedColor: plain ? '#000000' : '#6B7280',
        subtleColor: plain ? '#000000' : '#4B5563',
    };
}

/** Contact line runs — mirrors contactRuns() in templates/shared.ts. */
function contactRuns(doc: ResumeDoc, linkColor: string): Run[] {
    const b = doc.basics;
    const runs: Run[] = [];
    const push = (text: string, link?: string) => {
        if (!text) return;
        if (runs.length) runs.push({ text: '  •  ', color: '#9CA3AF' });
        runs.push(link ? { text, link, color: linkColor } : { text });
    };
    const loc = [b.location.city, b.location.region, b.location.countryCode]
        .filter(Boolean)
        .join(', ');
    push(b.email, b.email ? `mailto:${b.email}` : undefined);
    push(b.phone);
    push(loc);
    if (b.url) push(b.url.replace(/^https?:\/\//, ''), b.url);
    b.profiles.forEach((p) => {
        const label = `${p.network}: ${p.username}`.replace(/^:\s*/, '').trim();
        if (p.username || p.network) push(label, p.url || undefined);
    });
    return runs;
}

/** Build word/document.xml plus the hyperlink relationships it needs. */
export function buildDocumentXml(
    doc: ResumeDoc,
    theme: ResumeTheme
): { xml: string; rels: { id: string; target: string }[] } {
    const rels = new RelStore();
    const s = templateStyle(doc, theme);
    const b = doc.basics;
    const [pageW, pageH] = PAGE_DIMENSIONS[theme.pageSize] || PAGE_DIMENSIONS.A4;
    const contentWidth = twip(pageW - theme.margins[0] - theme.margins[2]);
    const body: string[] = [];

    const para = (runs: Run[], opts?: ParaOptions) =>
        body.push(paraXml(runs, theme, rels, opts));

    // --- header ---
    para([{ text: b.name || 'Your Name', bold: true, size: s.nameSize, color: s.nameColor }], {
        align: s.nameAlign,
        style: 'Title',
    });
    if (b.label) {
        para([{ text: b.label, size: theme.fontSize + 2, color: s.plain ? '#000000' : s.subtleColor }], {
            align: s.nameAlign,
            before: 1,
        });
    }
    const contact = contactRuns(doc, s.linkColor);
    if (contact.length) {
        para(
            contact.map((r) => ({ ...r, size: theme.fontSize - 0.5, color: r.color ?? s.subtleColor })),
            { align: s.nameAlign, before: 3 }
        );
    }
    if (b.summary) para([{ text: b.summary }], { before: 8 });

    // --- section machinery ---
    const heading = (title: string) =>
        para(
            [
                {
                    text: s.headingCaps ? title.toUpperCase() : title,
                    bold: true,
                    size: theme.fontSize + 1.5,
                    color: s.headingColor,
                    spacing: 0.25,
                },
            ],
            {
                style: 'Heading1',
                before: theme.sectionSpacing,
                after: 2,
                border: s.headingBorder ?? undefined,
                lineHeight: 1,
            }
        );

    /** Title on the left, date flushed right via a tab stop. */
    const entryHeader = (left: string, right: string, sub?: string) => {
        const runs: Run[] = [{ text: left, bold: true }];
        if (right) {
            runs.push({ text: '', tab: true }, { text: right, color: s.mutedColor });
        }
        para(runs, { rightTab: contentWidth, before: 4 });
        if (sub) para([{ text: sub, italic: true, color: s.subtleColor }], { before: 1 });
    };

    const bullets = (items: string[]) =>
        items
            .filter((h) => h && h.trim())
            .forEach((h) => para([{ text: h.trim() }], { bullet: true, before: 1 }));

    const builders: Record<SectionKey, () => void> = {
        work: () =>
            doc.work.forEach((w) => {
                entryHeader(
                    [w.position, w.name].filter(Boolean).join(' · '),
                    dateRange(w.startDate, w.endDate),
                    w.location
                );
                if (w.summary) para([{ text: w.summary }], { before: 2 });
                bullets(w.highlights);
            }),
        education: () =>
            doc.education.forEach((e) => {
                entryHeader(
                    e.institution,
                    dateRange(e.startDate, e.endDate),
                    [e.studyType, e.area].filter(Boolean).join(', ')
                );
                if (e.score) para([{ text: `Score: ${e.score}` }], { before: 1 });
                bullets(e.courses);
            }),
        skills: () =>
            doc.skills.forEach((sk) => {
                const kw = sk.keywords.filter(Boolean).join(', ');
                const runs: Run[] = sk.name
                    ? [{ text: `${sk.name}: `, bold: true }, { text: kw }]
                    : [{ text: kw }];
                para(runs, { before: 2 });
            }),
        projects: () =>
            doc.projects.forEach((p) => {
                const url = p.url ? p.url.replace(/^https?:\/\//, '') : '';
                const runs: Run[] = [{ text: p.name, bold: true }];
                if (url) {
                    runs.push({ text: '', tab: true }, { text: url, link: p.url, color: s.linkColor });
                }
                para(runs, { rightTab: contentWidth, before: 4 });
                if (p.description) para([{ text: p.description }], { before: 2 });
                bullets(p.highlights);
            }),
        certificates: () =>
            doc.certificates.forEach((c) => {
                const runs: Run[] = [{ text: c.name, bold: true }];
                if (c.issuer) runs.push({ text: ` — ${c.issuer}` });
                if (c.date) runs.push({ text: '', tab: true }, { text: fmtDate(c.date), color: s.mutedColor });
                para(runs, { rightTab: contentWidth, before: 2 });
            }),
        awards: () =>
            doc.awards.forEach((a) => {
                entryHeader(a.title, fmtDate(a.date), a.awarder);
                if (a.summary) para([{ text: a.summary }], { before: 2 });
            }),
        languages: () => {
            const line = doc.languages
                .map((l) => (l.fluency ? `${l.language} (${l.fluency})` : l.language))
                .filter(Boolean)
                .join('   •   ');
            if (line) para([{ text: line }], { before: 2 });
        },
        interests: () => {
            const line = doc.interests
                .map((i) => [i.name, ...i.keywords].filter(Boolean).join(': '))
                .filter(Boolean)
                .join('   •   ');
            if (line) para([{ text: line }], { before: 2 });
        },
        references: () =>
            doc.references.forEach((r) => {
                const runs: Run[] = [{ text: r.name, bold: true }];
                if (r.reference) runs.push({ text: ` — ${r.reference}` });
                para(runs, { before: 2 });
            }),
    };

    for (const key of visibleSections(doc)) {
        heading(SECTION_LABELS[key]);
        builders[key]();
    }
    for (const cs of visibleCustomSections(doc)) {
        heading(cs.title || 'Section');
        for (const it of cs.items) {
            if (it.title) para([{ text: it.title, bold: true }], { before: 4 });
            if (it.description) para([{ text: it.description }], { before: 1 });
        }
    }

    const sectPr =
        `<w:sectPr><w:pgSz w:w="${Math.round(twip(pageW))}" w:h="${Math.round(twip(pageH))}"/>` +
        `<w:pgMar w:top="${twip(theme.margins[1])}" w:right="${twip(theme.margins[2])}"` +
        ` w:bottom="${twip(theme.margins[3])}" w:left="${twip(theme.margins[0])}"` +
        ' w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>';

    return {
        xml: `${XML_HEADER}<w:document ${W_NS}><w:body>${body.join('')}${sectPr}</w:body></w:document>`,
        rels: rels.all(),
    };
}

function stylesXml(theme: ResumeTheme): string {
    const size = halfPt(theme.fontSize);
    const line = Math.round(240 * theme.lineHeight);
    return (
        `${XML_HEADER}<w:styles ${W_NS}>` +
        '<w:docDefaults><w:rPrDefault><w:rPr>' +
        `<w:rFonts w:ascii="${DOCX_FONT}" w:hAnsi="${DOCX_FONT}" w:cs="${DOCX_FONT}"/>` +
        `<w:sz w:val="${size}"/><w:szCs w:val="${size}"/><w:color w:val="1F2937"/>` +
        '</w:rPr></w:rPrDefault><w:pPrDefault><w:pPr>' +
        `<w:spacing w:after="0" w:line="${line}" w:lineRule="auto"/>` +
        '</w:pPr></w:pPrDefault></w:docDefaults>' +
        // The w:name values matter: Word only treats a style as a real heading
        // (outline level, navigation pane, and what ATS parsers key off) when
        // the built-in name matches.
        '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
        '<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/>' +
        '<w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:outlineLvl w:val="0"/></w:pPr></w:style>' +
        '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/>' +
        '<w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>' +
        '<w:pPr><w:keepNext/><w:outlineLvl w:val="0"/></w:pPr></w:style>' +
        '<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/>' +
        '<w:rPr><w:u w:val="single"/></w:rPr></w:style>' +
        '</w:styles>'
    );
}

const NUMBERING_XML =
    `${XML_HEADER}<w:numbering ${W_NS}>` +
    '<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/>' +
    '<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/>' +
    '<w:lvlText w:val="•"/><w:lvlJc w:val="left"/>' +
    '<w:pPr><w:ind w:left="360" w:hanging="180"/></w:pPr></w:lvl></w:abstractNum>' +
    '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>' +
    '</w:numbering>';

const CONTENT_TYPES_XML =
    `${XML_HEADER}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
    '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>' +
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
    '</Types>';

const ROOT_RELS_XML =
    `${XML_HEADER}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
    '</Relationships>';

function documentRelsXml(links: { id: string; target: string }[]): string {
    const base =
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>';
    const external = links
        .map(
            (l) =>
                `<Relationship Id="${l.id}"` +
                ' Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink"' +
                ` Target="${esc(l.target)}" TargetMode="External"/>`
        )
        .join('');
    return (
        `${XML_HEADER}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        base +
        external +
        '</Relationships>'
    );
}

function corePropsXml(doc: ResumeDoc): string {
    const title = doc.basics.name ? `${doc.basics.name} — Resume` : doc.name || 'Resume';
    return (
        `${XML_HEADER}<cp:coreProperties` +
        ' xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"' +
        ' xmlns:dc="http://purl.org/dc/elements/1.1/">' +
        `<dc:title>${esc(title)}</dc:title>` +
        `<dc:creator>${esc(doc.basics.name || '')}</dc:creator>` +
        `<cp:lastModifiedBy>${esc(doc.basics.name || '')}</cp:lastModifiedBy>` +
        '</cp:coreProperties>'
    );
}

/**
 * Every part of the .docx package, as path -> XML string. Deterministic: the
 * same resume always yields identical bytes.
 */
export function buildDocxParts(
    doc: ResumeDoc,
    theme: ResumeTheme
): Record<string, string> {
    const { xml, rels } = buildDocumentXml(doc, theme);
    return {
        '[Content_Types].xml': CONTENT_TYPES_XML,
        '_rels/.rels': ROOT_RELS_XML,
        'docProps/core.xml': corePropsXml(doc),
        'word/document.xml': xml,
        'word/styles.xml': stylesXml(theme),
        'word/numbering.xml': NUMBERING_XML,
        'word/_rels/document.xml.rels': documentRelsXml(rels),
    };
}
