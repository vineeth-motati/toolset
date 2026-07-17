/**
 * Word document converter. mammoth is lazily imported and mocked — the
 * tests verify OUR wiring: arrayBuffer handoff, HTML document wrapping,
 * filename/mime, and the friendly error path.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { wordToHtml } from '@/utils/converters/docConverters';
import { makeFile } from '../helpers';

const mammothMock = vi.hoisted(() => ({ convertToHtml: vi.fn() }));
vi.mock('mammoth', () => mammothMock);

afterEach(() => {
    mammothMock.convertToHtml.mockReset();
});

describe('wordToHtml (/tools/convert/word-to-html)', () => {
    it('wraps the mammoth fragment in a standalone HTML document', async () => {
        mammothMock.convertToHtml.mockResolvedValue({
            value: '<h1>Report</h1><p>Body text.</p>',
            messages: [],
        });

        const result = await wordToHtml(makeFile('docx-bytes', 'report.docx'));

        expect(mammothMock.convertToHtml).toHaveBeenCalledWith({
            arrayBuffer: expect.any(ArrayBuffer),
        });
        expect(result.filename).toBe('report.html');
        expect(result.blob.type).toBe('text/html');
        expect(result.text).toContain('<!DOCTYPE html>');
        expect(result.text).toContain('<title>report</title>');
        expect(result.text).toContain('<h1>Report</h1><p>Body text.</p>');
    });

    it('reports unreadable documents by filename', async () => {
        mammothMock.convertToHtml.mockRejectedValue(new Error('not a zip'));
        await expect(
            wordToHtml(makeFile('junk', 'broken.docx'))
        ).rejects.toThrow('Could not read broken.docx');
    });
});
