/**
 * ConverterApi drives every converter tool that is NOT in the local
 * registry (OCR, video, eBooks, PDF parsing, ...). fetch is stubbed to
 * simulate the ConversionTools upload → task → poll → download pipeline.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ConverterApi, { FILE_SIZE_LIMIT } from '@/utils/converterApi';
import converters from '@/config/converters';
import { makeFile } from '../helpers';

const jsonResponse = (data) => ({
    ok: true,
    json: async () => data,
    blob: async () => new Blob(['result'], { type: 'text/plain' }),
});

describe('ConverterApi construction', () => {
    it('maps every configured converter path to its API type', () => {
        const api = new ConverterApi('token');
        for (const converter of converters) {
            expect(api.getConversionType(converter.path)).toBe(
                converter.apiType
            );
        }
    });

    it('reports the file size limit as bytes and formatted', () => {
        const api = new ConverterApi('token');
        expect(api.getFileSizeLimit()).toBe(FILE_SIZE_LIMIT);
        expect(api.getFormattedFileSizeLimit()).toBe('100MB');
    });
});

describe('getTargetExtension', () => {
    const api = new ConverterApi('token');

    it('derives the extension from the converter target format', () => {
        expect(api.getTargetExtension('convert.json_to_excel')).toBe('xlsx');
        expect(api.getTargetExtension('convert.csv_to_json')).toBe('json');
    });

    it('strips qualifiers like "(Searchable)" from target formats', () => {
        // ocr_pdf converters advertise e.g. "PDF (Searchable)".
        const ocr = converters.find((c) =>
            c.targetFormat.includes('(')
        );
        if (ocr) {
            const ext = api.getTargetExtension(ocr.apiType);
            expect(ext).not.toContain('(');
        }
    });

    it('falls back to txt for unknown types', () => {
        expect(api.getTargetExtension('convert.made_up')).toBe('txt');
    });

    it('falls back to txt when a known converter has no extension mapping', () => {
        // "Validation Result" (validate-json, validate-xml-xsd) has no
        // entry in the PDF/JSON/CSV/... formatToExt table.
        expect(api.getTargetExtension('convert.validate_json')).toBe('txt');
    });
});

describe('convert — full pipeline', () => {
    let api;

    beforeEach(() => {
        api = new ConverterApi('secret-token');
    });

    it('uploads, polls to SUCCESS, downloads and renames the file', async () => {
        const fetchMock = vi
            .fn()
            // 1. upload
            .mockResolvedValueOnce(jsonResponse({ file_id: 'file-1' }))
            // 2. create task
            .mockResolvedValueOnce(jsonResponse({ task_id: 'task-1' }))
            // 3. poll status
            .mockResolvedValueOnce(
                jsonResponse({ status: 'SUCCESS', file_id: 'file-2' })
            )
            // 4. download
            .mockResolvedValueOnce(jsonResponse({}));
        vi.stubGlobal('fetch', fetchMock);

        const progress = [];
        const result = await api.convert(
            '/tools/convert/csv-to-json',
            makeFile('a,b\n1,2', 'data.csv'),
            { some_option: true },
            (p) => progress.push(p)
        );

        expect(result.filename).toBe('data.json');
        expect(await result.blob.text()).toBe('result');
        expect(progress).toEqual([
            'UPLOADING',
            'PREPARING',
            'SUCCESS',
            'DOWNLOADING',
        ]);

        // Auth header on every call; options forwarded into the task body.
        for (const [, init] of fetchMock.mock.calls) {
            expect(init.headers.Authorization).toBe('Bearer secret-token');
        }
        const taskBody = JSON.parse(fetchMock.mock.calls[1][1].body);
        expect(taskBody).toEqual({
            type: 'convert.csv_to_json',
            options: { file_id: 'file-1', some_option: true },
        });
    });

    it('keeps polling while the task is PENDING/RUNNING', async () => {
        vi.useFakeTimers();
        try {
            const fetchMock = vi
                .fn()
                .mockResolvedValueOnce(jsonResponse({ file_id: 'f' }))
                .mockResolvedValueOnce(jsonResponse({ task_id: 't' }))
                .mockResolvedValueOnce(jsonResponse({ status: 'PENDING' }))
                .mockResolvedValueOnce(jsonResponse({ status: 'RUNNING' }))
                .mockResolvedValueOnce(
                    jsonResponse({ status: 'SUCCESS', file_id: 'f2' })
                )
                .mockResolvedValueOnce(jsonResponse({}));
            vi.stubGlobal('fetch', fetchMock);

            const promise = api.convert(
                '/tools/convert/csv-to-json',
                makeFile('a\n1', 'x.csv')
            );
            // Each pending poll schedules a 2s setTimeout; drain them all.
            await vi.runAllTimersAsync();
            const result = await promise;
            expect(result.filename).toBe('x.json');
            expect(fetchMock).toHaveBeenCalledTimes(6);
        } finally {
            vi.useRealTimers();
        }
    });

    it('rejects unknown converter paths without touching the network', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        await expect(
            api.convert('/tools/convert/unknown', makeFile('x', 'x.txt'))
        ).rejects.toThrow(/Unsupported conversion type/);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('surfaces upload errors from the API', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(jsonResponse({ error: 'quota exceeded' }))
        );
        await expect(
            api.convert('/tools/convert/csv-to-json', makeFile('x', 'x.csv'))
        ).rejects.toThrow(/File upload failed: quota exceeded/);
    });

    it('surfaces task-creation errors from the API', async () => {
        vi.stubGlobal(
            'fetch',
            vi
                .fn()
                .mockResolvedValueOnce(jsonResponse({ file_id: 'f' }))
                .mockResolvedValueOnce(
                    jsonResponse({ error: 'invalid options' })
                )
        );
        await expect(
            api.convert('/tools/convert/csv-to-json', makeFile('x', 'x.csv'))
        ).rejects.toThrow(/Conversion task creation failed: invalid options/);
    });

    it('surfaces network failures during status polling', async () => {
        vi.stubGlobal(
            'fetch',
            vi
                .fn()
                .mockResolvedValueOnce(jsonResponse({ file_id: 'f' }))
                .mockResolvedValueOnce(jsonResponse({ task_id: 't' }))
                .mockRejectedValueOnce(new Error('network blip'))
        );
        await expect(
            api.convert('/tools/convert/csv-to-json', makeFile('x', 'x.csv'))
        ).rejects.toThrow(/Task status check failed: network blip/);
    });

    it('rejects when a poll response carries an error without a status', async () => {
        vi.stubGlobal(
            'fetch',
            vi
                .fn()
                .mockResolvedValueOnce(jsonResponse({ file_id: 'f' }))
                .mockResolvedValueOnce(jsonResponse({ task_id: 't' }))
                .mockResolvedValueOnce(jsonResponse({ error: 'task vanished' }))
        );
        await expect(
            api.convert('/tools/convert/csv-to-json', makeFile('x', 'x.csv'))
        ).rejects.toThrow(/Conversion failed: task vanished/);
    });

    it('rejects when the conversion task errors', async () => {
        vi.stubGlobal(
            'fetch',
            vi
                .fn()
                .mockResolvedValueOnce(jsonResponse({ file_id: 'f' }))
                .mockResolvedValueOnce(jsonResponse({ task_id: 't' }))
                .mockResolvedValueOnce(jsonResponse({ status: 'ERROR' }))
        );
        await expect(
            api.convert('/tools/convert/csv-to-json', makeFile('x', 'x.csv'))
        ).rejects.toThrow('Conversion task failed');
    });

    it('rejects on unknown task status', async () => {
        vi.stubGlobal(
            'fetch',
            vi
                .fn()
                .mockResolvedValueOnce(jsonResponse({ file_id: 'f' }))
                .mockResolvedValueOnce(jsonResponse({ task_id: 't' }))
                .mockResolvedValueOnce(jsonResponse({ status: 'WAT' }))
        );
        await expect(
            api.convert('/tools/convert/csv-to-json', makeFile('x', 'x.csv'))
        ).rejects.toThrow(/Unknown task status: WAT/);
    });

    it('surfaces download HTTP failures', async () => {
        vi.stubGlobal(
            'fetch',
            vi
                .fn()
                .mockResolvedValueOnce(jsonResponse({ file_id: 'f' }))
                .mockResolvedValueOnce(jsonResponse({ task_id: 't' }))
                .mockResolvedValueOnce(
                    jsonResponse({ status: 'SUCCESS', file_id: 'f2' })
                )
                .mockResolvedValueOnce({ ok: false, status: 500 })
        );
        await expect(
            api.convert('/tools/convert/csv-to-json', makeFile('x', 'x.csv'))
        ).rejects.toThrow(/File download failed.*500/);
    });
});

describe('convertUrl — URL-based pipeline', () => {
    it('skips upload and names the result after the hostname', async () => {
        const api = new ConverterApi('token');
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(jsonResponse({ task_id: 't' }))
            .mockResolvedValueOnce(
                jsonResponse({ status: 'SUCCESS', file_id: 'f' })
            )
            .mockResolvedValueOnce(jsonResponse({}));
        vi.stubGlobal('fetch', fetchMock);

        const target = converters.find((c) => c.apiType.startsWith('convert.website'));
        const path = target ? target.path : '/tools/convert/csv-to-json';
        const result = await api.convertUrl(path, 'https://my.site.dev/page');

        expect(result.filename).toMatch(/^my_site_dev\./);
        const taskBody = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(taskBody.options.url).toBe('https://my.site.dev/page');
    });

    it('rejects unknown converter paths without touching the network', async () => {
        const api = new ConverterApi('token');
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        await expect(
            api.convertUrl('/tools/convert/unknown', 'https://x.y')
        ).rejects.toThrow(/Unsupported conversion type/);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('reports progress through the URL pipeline', async () => {
        const api = new ConverterApi('token');
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(jsonResponse({ task_id: 't' }))
            .mockResolvedValueOnce(
                jsonResponse({ status: 'SUCCESS', file_id: 'f' })
            )
            .mockResolvedValueOnce(jsonResponse({}));
        vi.stubGlobal('fetch', fetchMock);

        const progress = [];
        await api.convertUrl(
            '/tools/convert/csv-to-json',
            'https://my.site.dev/page',
            {},
            (p) => progress.push(p)
        );
        expect(progress).toEqual(['PREPARING', 'SUCCESS', 'DOWNLOADING']);
    });
});
