/**
 * PDF/JSON/text export wiring. pdfmake is DOM/worker-heavy, so it is mocked —
 * these tests verify OUR wiring: the docDefinition handed to pdfmake, the
 * blob types, filenames, and that a download is actually triggered.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const pdf = vi.hoisted(() => {
    const lastDef = { current: null };
    const createPdf = vi.fn((def) => {
        lastDef.current = def;
        return {
            getBlob: () =>
                Promise.resolve(new Blob(['%PDF-1.4 mock'], { type: 'application/pdf' })),
        };
    });
    return { lastDef, createPdf, addVirtualFileSystem: vi.fn() };
});

vi.mock('pdfmake/build/pdfmake', () => ({
    default: { createPdf: pdf.createPdf, addVirtualFileSystem: pdf.addVirtualFileSystem },
}));
vi.mock('pdfmake/build/vfs_fonts', () => ({ default: { fake: true } }));

import {
    toBlob,
    downloadPdf,
    downloadJsonResume,
    downloadPlainText,
} from '@/utils/resume/export';
import { defaultResume } from '@/utils/resume/schema';
import { fullResume } from './fixtures';

let anchors;
let blobs;

beforeEach(() => {
    anchors = [];
    blobs = [];
    URL.createObjectURL = vi.fn((b) => {
        blobs.push(b);
        return `blob:mock/${blobs.length}`;
    });
    URL.revokeObjectURL = vi.fn();
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        const el = realCreate(tag);
        if (String(tag).toLowerCase() === 'a') {
            vi.spyOn(el, 'click').mockImplementation(() => {});
            anchors.push(el);
        }
        return el;
    });
});

describe('toBlob', () => {
    it('hands pdfmake the built docDefinition and returns a PDF blob', async () => {
        const blob = await toBlob(fullResume());
        expect(blob).toBeInstanceOf(Blob);
        expect(blob.type).toBe('application/pdf');
        expect(pdf.createPdf).toHaveBeenCalled();
        const def = pdf.lastDef.current;
        expect(def.pageSize).toBe('A4');
        expect(Array.isArray(def.content)).toBe(true);
        expect(def.content.length).toBeGreaterThan(0);
    });

    it('reflects the chosen page size in the definition', async () => {
        const d = fullResume();
        d.meta.theme.pageSize = 'LETTER';
        await toBlob(d);
        expect(pdf.lastDef.current.pageSize).toBe('LETTER');
    });
});

describe('downloadPdf', () => {
    it('triggers an anchor download with a name-derived .pdf filename', async () => {
        await downloadPdf(fullResume());
        expect(URL.createObjectURL).toHaveBeenCalled();
        const a = anchors.at(-1);
        expect(a.download).toBe('Ada_Lovelace.pdf');
        expect(a.href).toMatch(/^blob:mock\//);
        expect(a.click).toHaveBeenCalledTimes(1);
    });
});

describe('downloadJsonResume', () => {
    it('downloads a JSON Resume blob with a .json filename', async () => {
        downloadJsonResume(fullResume());
        const a = anchors.at(-1);
        expect(a.download).toBe('Ada_Lovelace.json');
        const blob = blobs.at(-1);
        expect(blob.type).toBe('application/json');
        const parsed = JSON.parse(await blob.text());
        expect(parsed.$schema).toContain('jsonresume');
        expect(parsed.basics.name).toBe('Ada Lovelace');
        expect(parsed.work).toHaveLength(2);
    });
});

describe('downloadPlainText', () => {
    it('downloads the provided text with a .txt filename', async () => {
        downloadPlainText(fullResume(), 'HELLO WORLD');
        const a = anchors.at(-1);
        expect(a.download).toBe('Ada_Lovelace.txt');
        const blob = blobs.at(-1);
        expect(blob.type).toContain('text/plain');
        expect(await blob.text()).toBe('HELLO WORLD');
    });
});

describe('filename sanitization', () => {
    it('slugs special characters and collapses runs', () => {
        const d = defaultResume('');
        d.basics.name = 'José Q. Public!!';
        downloadJsonResume(d);
        expect(anchors.at(-1).download).toBe('Jos_Q_Public.json');
    });

    it('falls back to "resume" when there is no name', () => {
        const d = defaultResume('');
        d.basics.name = '';
        downloadJsonResume(d);
        expect(anchors.at(-1).download).toBe('resume.json');
    });
});
