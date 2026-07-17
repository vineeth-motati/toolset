/**
 * Subtitle tools: SRT parsing/building primitives plus the three SRT
 * converter tools (srt-to-csv, srt-to-text, csv-to-srt).
 */
import { describe, it, expect } from 'vitest';
import Papa from 'papaparse';
import {
    parseSrt,
    buildSrt,
    rowsToCues,
    srtToCsv,
    srtToText,
    csvToSrt,
} from '@/utils/converters/srtConverters';
import { makeFile, SAMPLE_SRT } from '../helpers';

describe('parseSrt', () => {
    it('parses indexed cues with multi-line text', () => {
        const cues = parseSrt(SAMPLE_SRT);
        expect(cues).toHaveLength(2);
        expect(cues[0]).toEqual({
            index: 1,
            start: '00:00:01,000',
            end: '00:00:04,000',
            text: 'Hello world',
        });
        expect(cues[1].text).toBe('Second line\nwith two rows');
    });

    it('accepts cues without index lines (seen in the wild)', () => {
        const srt = '00:00:01,000 --> 00:00:02,000\nNo index here';
        const cues = parseSrt(srt);
        expect(cues).toHaveLength(1);
        expect(cues[0].index).toBe(1);
    });

    it('handles CRLF line endings, BOM and dot milliseconds', () => {
        const srt =
            '﻿1\r\n00:00:01.000 --> 00:00:02.000\r\nWindows style\r\n';
        const cues = parseSrt(srt);
        expect(cues[0].start).toBe('00:00:01.000');
        expect(cues[0].text).toBe('Windows style');
    });

    it('skips blocks without a time line and renumbers sequentially', () => {
        const srt = `garbage block

2
00:00:05,000 --> 00:00:06,000
Kept`;
        const cues = parseSrt(srt);
        expect(cues).toHaveLength(1);
        expect(cues[0].index).toBe(1);
    });

    it('throws when no cues are found', () => {
        expect(() => parseSrt('not a subtitle file')).toThrow(
            /No subtitle cues/
        );
    });
});

describe('buildSrt', () => {
    it('renders numbered blocks and renumbers from 1', () => {
        const srt = buildSrt([
            { start: '00:00:01,000', end: '00:00:02,000', text: 'A' },
            { start: '00:00:03,000', end: '00:00:04,000', text: 'B' },
        ]);
        expect(srt).toBe(
            '1\n00:00:01,000 --> 00:00:02,000\nA\n\n' +
                '2\n00:00:03,000 --> 00:00:04,000\nB\n'
        );
    });

    it('round-trips with parseSrt', () => {
        const cues = parseSrt(SAMPLE_SRT);
        expect(parseSrt(buildSrt(cues))).toEqual(cues);
    });
});

describe('rowsToCues', () => {
    it('matches columns case-insensitively and ignores punctuation', () => {
        const cues = rowsToCues([
            { 'Start Time': '00:00:01,000', END: '00:00:02,000', Caption: 'Hi' },
        ]);
        expect(cues[0]).toEqual({
            start: '00:00:01,000',
            end: '00:00:02,000',
            text: 'Hi',
        });
    });

    it('throws when a required column is missing', () => {
        expect(() => rowsToCues([{ start: 'x', end: 'y' }])).toThrow(
            /Missing required columns/
        );
    });

    it('stringifies missing text cells to empty, not "undefined"', () => {
        const cues = rowsToCues([
            { start: '00:00:01,000', end: '00:00:02,000', text: undefined },
        ]);
        expect(cues[0].text).toBe('');
    });
});

describe('srtToCsv (/tools/convert/srt-to-csv)', () => {
    it('produces one CSV row per cue', async () => {
        const result = await srtToCsv(makeFile(SAMPLE_SRT, 'movie.srt'));
        const parsed = Papa.parse(result.text, { header: true });
        expect(parsed.data).toHaveLength(2);
        expect(parsed.data[0].text).toBe('Hello world');
        expect(parsed.data[0].start).toBe('00:00:01,000');
        expect(result.filename).toBe('movie.csv');
        expect(result.blob.type).toBe('text/csv');
    });
});

describe('srtToText (/tools/convert/srt-to-text)', () => {
    it('strips timing and keeps only the dialogue', async () => {
        const result = await srtToText(makeFile(SAMPLE_SRT, 'movie.srt'));
        expect(result.text).toBe('Hello world\nSecond line\nwith two rows');
        expect(result.filename).toBe('movie.txt');
    });
});

describe('csvToSrt (/tools/convert/csv-to-srt)', () => {
    it('builds a valid SRT from start/end/text columns', async () => {
        const csv = [
            'start,end,text',
            '"00:00:01,000","00:00:04,000",Hello',
            '"00:00:05,000","00:00:06,000",World',
        ].join('\n');
        const result = await csvToSrt(makeFile(csv, 'subs.csv'));
        expect(result.filename).toBe('subs.srt');
        expect(result.blob.type).toBe('application/x-subrip');
        const cues = parseSrt(result.text);
        expect(cues).toHaveLength(2);
        expect(cues[1].text).toBe('World');
    });

    it('rejects an empty CSV', async () => {
        await expect(csvToSrt(makeFile('', 'e.csv'))).rejects.toThrow(
            /no data rows/
        );
    });
});
