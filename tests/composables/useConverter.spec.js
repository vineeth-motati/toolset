/**
 * useConverter orchestrates every converter tool page: local registry
 * dispatch (no API key needed), API fallback, state machine and download.
 */
import { describe, it, expect, vi } from 'vitest';
import { nextTick } from 'vue';
import { useConverter } from '@/composables/useConverter';
import { makeFile } from '../helpers';

const apiMocks = vi.hoisted(() => ({
    convert: vi.fn(),
    convertUrl: vi.fn(),
}));

vi.mock('@/utils/converterApi', () => ({
    default: class MockConverterApi {
        constructor(token) {
            this.token = token;
        }
        convert(...args) {
            return apiMocks.convert(...args);
        }
        convertUrl(...args) {
            return apiMocks.convertUrl(...args);
        }
        getFormattedFileSizeLimit() {
            return '100MB';
        }
    },
}));

describe('API key management', () => {
    it('saves, reports and clears the key (persisted to localStorage)', async () => {
        const converter = useConverter();
        expect(converter.hasApiKey()).toBe(false);
        converter.saveApiKey('secret');
        expect(converter.hasApiKey()).toBe(true);
        // vueuse flushes the storage write on the next tick.
        await nextTick();
        expect(localStorage.getItem('converter_api_key')).toContain('secret');
        converter.clearApiKey();
        expect(converter.hasApiKey()).toBe(false);
    });

    it('reports the file size limit with or without a key', () => {
        const converter = useConverter();
        expect(converter.getFileSizeLimit()).toBe('100MB'); // fallback
        converter.saveApiKey('k');
        expect(converter.getFileSizeLimit()).toBe('100MB'); // from instance
    });
});

describe('convertFile — local registry dispatch', () => {
    it('converts in-browser without an API key', async () => {
        const converter = useConverter();
        const result = await converter.convertFile(
            '/tools/convert/csv-to-json',
            makeFile('a,b\n1,2', 'data.csv')
        );
        expect(JSON.parse(result.text)).toEqual([{ a: 1, b: 2 }]);
        expect(converter.state.progress).toBe('COMPLETE');
        expect(converter.state.error).toBeNull();
        expect(converter.state.isConverting).toBe(false);
        // state is reactive(), so the stored result is a proxy — compare
        // content, not identity.
        expect(converter.state.result.filename).toBe(result.filename);
        expect(converter.state.result.text).toBe(result.text);
        expect(apiMocks.convert).not.toHaveBeenCalled();
    });

    it('records local conversion failures in state and rethrows', async () => {
        const converter = useConverter();
        await expect(
            converter.convertFile(
                '/tools/convert/csv-to-json',
                makeFile('a,b', 'headers-only.csv')
            )
        ).rejects.toThrow(/no data rows/);
        expect(converter.state.progress).toBe('ERROR');
        expect(converter.state.error).toMatch(/no data rows/);
        expect(converter.state.isConverting).toBe(false);
    });
});

describe('convertFile — API dispatch', () => {
    it('requires an API key for non-local converters', async () => {
        const converter = useConverter();
        await expect(
            converter.convertFile(
                '/tools/convert/pdf-to-word',
                makeFile('x', 'doc.pdf')
            )
        ).rejects.toThrow('API key not set');
        expect(converter.state.progress).toBe('ERROR');
    });

    it('delegates to ConverterApi and pipes progress into state', async () => {
        const converter = useConverter();
        converter.saveApiKey('k');
        const apiResult = {
            blob: new Blob(['out']),
            filename: 'doc.txt',
        };
        apiMocks.convert.mockImplementation(
            async (path, file, options, onProgress) => {
                onProgress('UPLOADING');
                return apiResult;
            }
        );

        const file = makeFile('x', 'doc.pdf');
        const result = await converter.convertFile(
            '/tools/convert/pdf-to-word',
            file,
            { deep: true }
        );

        expect(result).toBe(apiResult);
        expect(apiMocks.convert).toHaveBeenCalledWith(
            '/tools/convert/pdf-to-word',
            file,
            { deep: true },
            expect.any(Function)
        );
        expect(converter.state.progress).toBe('COMPLETE');
    });
});

describe('convertUrl', () => {
    it('always goes through the API', async () => {
        const converter = useConverter();
        converter.saveApiKey('k');
        apiMocks.convertUrl.mockResolvedValue({
            blob: new Blob(['pdf']),
            filename: 'site.pdf',
        });
        const result = await converter.convertUrl(
            '/tools/convert/website-to-pdf',
            'https://example.com'
        );
        expect(result.filename).toBe('site.pdf');
        expect(converter.state.progress).toBe('COMPLETE');
    });

    it('records API errors in state', async () => {
        const converter = useConverter();
        converter.saveApiKey('k');
        apiMocks.convertUrl.mockRejectedValue(new Error('boom'));
        await expect(
            converter.convertUrl('/tools/convert/website-to-pdf', 'https://x.y')
        ).rejects.toThrow('boom');
        expect(converter.state.error).toBe('boom');
        expect(converter.state.progress).toBe('ERROR');
    });

    it('pipes API progress callbacks into state', async () => {
        const converter = useConverter();
        converter.saveApiKey('k');
        const seenDuringCallback = [];
        apiMocks.convertUrl.mockImplementation(
            async (path, url, options, onProgress) => {
                onProgress('PREPARING');
                seenDuringCallback.push(converter.state.progress);
                return { blob: new Blob(['pdf']), filename: 'site.pdf' };
            }
        );
        await converter.convertUrl(
            '/tools/convert/website-to-pdf',
            'https://example.com'
        );
        expect(seenDuringCallback).toEqual(['PREPARING']);
    });
});

describe('downloadResult', () => {
    it('is a no-op without a result', () => {
        const converter = useConverter();
        expect(() => converter.downloadResult()).not.toThrow();
    });

    it('creates and cleans up a temporary object-URL link', async () => {
        vi.stubGlobal('URL', {
            ...URL,
            createObjectURL: vi.fn(() => 'blob:fake'),
            revokeObjectURL: vi.fn(),
        });
        // happy-dom would try to navigate to the blob: URL on click.
        const click = vi
            .spyOn(HTMLAnchorElement.prototype, 'click')
            .mockImplementation(() => {});
        const converter = useConverter();
        await converter.convertFile(
            '/tools/convert/csv-to-json',
            makeFile('a,b\n1,2', 'x.csv')
        );
        converter.downloadResult();
        expect(URL.createObjectURL).toHaveBeenCalledOnce();
        expect(click).toHaveBeenCalledOnce();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
        // The temporary <a> must not leak into the document.
        expect(document.querySelector('a[download]')).toBeNull();
    });
});
