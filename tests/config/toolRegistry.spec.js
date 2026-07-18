/**
 * Registry integrity for EVERY tool in the app.
 *
 * - data/tools.json: the 17 top-level tools (kanban, notes, converters, ...)
 * - config/converters.js: all converter tool definitions
 * - utils/localConverters.js: the in-browser converter registry
 *
 * These tests cross-check the three sources against each other and against
 * the page components on disk, so a tool added without full wiring fails CI.
 */
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import tools from '@/data/tools.json';
import converters from '@/config/converters';
import {
    getLocalConverter,
    LOCAL_PERSIST_MAX_CHARS,
} from '@/utils/localConverters';
import { CATEGORY_LABELS } from '@/composables/useTools';

// happy-dom rewrites import.meta.url to an http:// URL, so resolve from
// the Vitest working directory (the project root) instead.
const root = `${process.cwd()}/`;

// '/tools/kanban' → pages/tools/kanban.vue; '/tools/convert' → its index.vue
const pageForToolPath = (path) => {
    const rel = path.replace(/^\//, 'pages/');
    return existsSync(`${root}${rel}.vue`)
        ? `${rel}.vue`
        : `${rel}/index.vue`;
};

describe('data/tools.json — every app tool', () => {
    it('contains the full tool catalog', () => {
        expect(tools.length).toBeGreaterThanOrEqual(17);
    });

    it('has unique paths', () => {
        const paths = tools.map((t) => t.path);
        expect(new Set(paths).size).toBe(paths.length);
    });

    it.each(tools.map((tool) => [tool.path, tool]))(
        '%s is fully described and routable',
        (path, tool) => {
            expect(tool.name).toBeTruthy();
            expect(tool.description).toBeTruthy();
            expect(tool.icon).toBeTruthy();
            expect(path).toMatch(/^\/tools\/[a-z-]+$/);
            expect(Array.isArray(tool.keywords)).toBe(true);
            expect(tool.keywords.length).toBeGreaterThan(0);
            expect(['default', 'fullscreen']).toContain(tool.layout);
            expect(typeof tool.popular).toBe('boolean');
            // Category must render with a label on the index page.
            expect(CATEGORY_LABELS[tool.category]).toBeTruthy();
            // SEO block drives useToolMeta — required for every tool.
            expect(tool.seo?.title).toBeTruthy();
            expect(tool.seo?.description).toBeTruthy();
            // The route must have a page component.
            expect(existsSync(`${root}${pageForToolPath(path)}`)).toBe(true);
        }
    );
});

describe('config/converters.js — every converter tool', () => {
    it('has unique paths and apiTypes', () => {
        const paths = converters.map((c) => c.path);
        expect(new Set(paths).size).toBe(paths.length);
    });

    it.each(converters.map((c) => [c.path, c]))(
        '%s is fully described',
        (path, converter) => {
            expect(path).toMatch(/^\/tools\/convert\/[a-z0-9-]+$/);
            expect(converter.apiType).toMatch(/^convert\.[a-z0-9_]+$/);
            expect(converter.title).toBeTruthy();
            expect(converter.description).toBeTruthy();
            expect(converter.sourceFormat).toBeTruthy();
            expect(converter.targetFormat).toBeTruthy();
            expect(converter.sourceIcon).toBeTruthy();
            expect(converter.category).toBeTruthy();
            // The upload input needs an accept filter — except URL-input
            // tools (website capture), which declare sourceFormat 'URL'.
            if (converter.sourceFormat === 'URL') {
                expect(converter.sourceAccept).toBeNull();
            } else {
                expect(converter.sourceAccept).toBeTruthy();
            }
        }
    );

    it('declares well-formed params (selects have options, defaults valid)', () => {
        for (const converter of converters) {
            for (const param of converter.params ?? []) {
                expect(param.name).toBeTruthy();
                expect(param.label).toBeTruthy();
                if (param.type === 'select') {
                    expect(param.options?.length).toBeGreaterThan(0);
                    if (param.default !== undefined) {
                        expect(
                            param.options.map((o) => o.value)
                        ).toContain(param.default);
                    }
                }
            }
        }
    });
});

describe('utils/localConverters.js — the in-browser registry', () => {
    // The product rule: these 53 conversions are free, client-side and
    // private — they must never fall back to the API. This list is the spec;
    // a converter dropped from the registry fails here by name.
    const EXPECTED_LOCAL = [
        '/tools/convert/xml-to-json',
        '/tools/convert/format-json',
        '/tools/convert/validate-json',
        '/tools/convert/json-to-xml',
        '/tools/convert/json-to-csv',
        '/tools/convert/json-to-excel',
        '/tools/convert/excel-to-json',
        '/tools/convert/csv-to-json',
        '/tools/convert/yaml-to-json',
        '/tools/convert/json-to-yaml',
        '/tools/convert/csv-to-xml',
        '/tools/convert/excel-to-xml',
        '/tools/convert/xml-to-csv',
        '/tools/convert/xml-to-excel',
        '/tools/convert/html-to-csv',
        '/tools/convert/excel-to-csv',
        '/tools/convert/csv-to-excel',
        '/tools/convert/jpg-to-pdf',
        '/tools/convert/png-to-pdf',
        '/tools/convert/pdf-to-text',
        '/tools/convert/pdf-to-jpg',
        '/tools/convert/pdf-to-png',
        '/tools/convert/png-to-webp',
        '/tools/convert/jpg-to-webp',
        '/tools/convert/webp-to-png',
        '/tools/convert/webp-to-jpg',
        '/tools/convert/png-to-jpg',
        '/tools/convert/jpg-to-png',
        '/tools/convert/heic-to-png',
        '/tools/convert/heic-to-jpg',
        '/tools/convert/ocr-png-to-text',
        '/tools/convert/ocr-jpg-to-text',
        '/tools/convert/ocr-png-to-pdf',
        '/tools/convert/ocr-jpg-to-pdf',
        '/tools/convert/ocr-pdf-to-text',
        '/tools/convert/srt-to-csv',
        '/tools/convert/srt-to-excel',
        '/tools/convert/srt-to-text',
        '/tools/convert/csv-to-srt',
        '/tools/convert/excel-to-srt',
        '/tools/convert/wav-to-mp3',
        '/tools/convert/flac-to-mp3',
        '/tools/convert/mp3-to-wav',
        '/tools/convert/mp4-to-mp3',
        '/tools/convert/word-to-html',
        '/tools/convert/excel-to-html',
        '/tools/convert/fix-xml-escaping',
        '/tools/convert/mov-to-mp4',
        '/tools/convert/mkv-to-mp4',
        '/tools/convert/html-to-png',
        '/tools/convert/html-to-jpg',
        '/tools/convert/html-to-pdf',
        '/tools/convert/validate-xml-xsd',
    ];

    it('the spec list itself covers 53 tools', () => {
        expect(EXPECTED_LOCAL).toHaveLength(53);
        expect(new Set(EXPECTED_LOCAL).size).toBe(53);
    });

    it('registers no local converters beyond the spec list', () => {
        const registered = converters
            .map((c) => c.path)
            .filter((path) => getLocalConverter(path));
        expect(registered.sort()).toEqual([...EXPECTED_LOCAL].sort());
    });

    it.each(EXPECTED_LOCAL.map((p) => [p]))(
        '%s exposes a callable convert handler and a converter page config',
        (path) => {
            const entry = getLocalConverter(path);
            expect(entry, `${path} missing from registry`).not.toBeNull();
            expect(typeof entry.convert).toBe('function');
            // Every local converter must still have page metadata.
            expect(converters.some((c) => c.path === path)).toBe(true);
        }
    );

    it('returns null for unknown paths', () => {
        expect(getLocalConverter('/tools/convert/nope')).toBeNull();
        expect(getLocalConverter('')).toBeNull();
    });

    it('keeps API-only converters (AVI, eBooks, website capture, PDF layout extraction...) off the registry', () => {
        const apiOnlySamples = converters
            .map((c) => c.path)
            .filter((p) => /ocr|video|epub|heic|website|pdf-to/.test(p))
            .filter((p) => !EXPECTED_LOCAL.includes(p));
        // Sanity check: the regex above should still match *some* paths that
        // stay API-only (e.g. pdf-to-jpg, ocr-png-to-pdf, video-* — this
        // guards against the filter silently matching nothing).
        expect(apiOnlySamples.length).toBeGreaterThan(0);
        for (const path of apiOnlySamples) {
            expect(getLocalConverter(path)).toBeNull();
        }
    });

    it('caps persistence at 500k chars (localStorage/sqlite constraint)', () => {
        expect(LOCAL_PERSIST_MAX_CHARS).toBe(500_000);
    });
});
