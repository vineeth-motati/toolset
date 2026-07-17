/**
 * Per-tool SEO wiring. Verifies every tool in the catalog produces a
 * complete meta set (title, OG, canonical, JSON-LD) through the stubbed
 * Nuxt head composables.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useToolMeta } from '@/composables/useToolMeta';
import type { Tool } from '@/composables/useTools';
import toolsData from '@/data/tools.json';

const seoMeta = vi.fn();
const head = vi.fn();

beforeEach(() => {
    vi.stubGlobal('useRuntimeConfig', () => ({
        public: { baseUrl: 'https://tools.test' },
    }));
    vi.stubGlobal('useSeoMeta', seoMeta);
    vi.stubGlobal('useHead', head);
});

describe('useToolMeta', () => {
    it('does nothing for an unknown tool', () => {
        useToolMeta(undefined);
        expect(seoMeta).not.toHaveBeenCalled();
        expect(head).not.toHaveBeenCalled();
    });

    it('emits branded title, OG url and canonical for a tool', () => {
        const tool = toolsData.find((t) => t.path === '/tools/notes') as Tool;
        useToolMeta(tool);

        const meta = seoMeta.mock.calls[0][0];
        expect(meta.title).toBe(`${tool.seo.title} · Tools-Set`);
        expect(meta.description).toBe(tool.seo.description);
        expect(meta.ogUrl).toBe('https://tools.test/tools/notes');

        const headArg = head.mock.calls[0][0];
        expect(headArg.link).toEqual([
            { rel: 'canonical', href: 'https://tools.test/tools/notes' },
        ]);
        const jsonLd = JSON.parse(headArg.script[0].innerHTML);
        expect(jsonLd['@type']).toBe('WebApplication');
        expect(jsonLd.name).toBe(tool.name);
        expect(jsonLd.offers.price).toBe('0'); // every tool stays free
    });

    it('falls back to the tool name/description when seo is not configured', () => {
        const bareTool = {
            name: 'Bare Tool',
            path: '/tools/bare',
            description: 'A tool with no seo block',
        } as Tool;
        useToolMeta(bareTool);

        const meta = seoMeta.mock.calls[0][0];
        expect(meta.title).toBe('Bare Tool · Tools-Set');
        expect(meta.description).toBe('A tool with no seo block');
    });

    it.each(toolsData.map((t) => [t.path, t]))(
        '%s produces a complete meta set',
        (_path, tool) => {
            useToolMeta(tool as Tool);
            const meta = seoMeta.mock.calls.at(-1)![0];
            expect(meta.title).toContain('· Tools-Set');
            expect(meta.description).toBeTruthy();
            expect(meta.ogTitle).toBeTruthy();
            expect(meta.twitterCard).toBe('summary');
        }
    );
});
