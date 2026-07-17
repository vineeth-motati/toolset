/**
 * SRT subtitle converters. SRT is plain text — parsing is a simple
 * block-splitting exercise.
 */
import Papa from 'papaparse';
import { replaceExtension, textResult } from './shared';

const TIME_LINE = /^(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/;

export const parseSrt = (text) => {
    const blocks = text
        .replace(/^﻿/, '')
        .trim()
        .split(/\r?\n\s*\r?\n/);
    const cues = [];

    for (const block of blocks) {
        const lines = block.split(/\r?\n/).map((line) => line.trim());
        // Index line is optional in the wild; the time line is the anchor.
        const timeLineIdx = lines.findIndex((line) => TIME_LINE.test(line));
        if (timeLineIdx === -1) continue;

        const [, start, end] = lines[timeLineIdx].match(TIME_LINE);
        cues.push({
            index: cues.length + 1,
            start,
            end,
            text: lines.slice(timeLineIdx + 1).join('\n'),
        });
    }

    if (!cues.length) {
        throw new Error('No subtitle cues found — is this a valid SRT file?');
    }
    return cues;
};

export const buildSrt = (cues) =>
    cues
        .map(
            (cue, i) => `${i + 1}\n${cue.start} --> ${cue.end}\n${cue.text}`
        )
        .join('\n\n') + '\n';

// CSV/Excel rows → cues. Column matching is case-insensitive so exports
// from other tools ("Start Time", "TEXT") still work.
export const rowsToCues = (rows) => {
    const findKey = (row, ...names) =>
        Object.keys(row).find((key) =>
            names.includes(key.toLowerCase().replace(/[^a-z]/g, ''))
        );

    const first = rows[0];
    const startKey = findKey(first, 'start', 'starttime', 'from');
    const endKey = findKey(first, 'end', 'endtime', 'to');
    const textKey = findKey(first, 'text', 'subtitle', 'caption', 'content');

    if (!startKey || !endKey || !textKey) {
        throw new Error(
            'Missing required columns — need "start", "end" and "text"'
        );
    }

    return rows.map((row) => ({
        start: String(row[startKey]).trim(),
        end: String(row[endKey]).trim(),
        text: String(row[textKey] ?? ''),
    }));
};

export const srtToCsv = async (file) => {
    const cues = parseSrt(await file.text());
    const csv = Papa.unparse(cues);
    return textResult(csv, replaceExtension(file.name, 'csv'), 'text/csv');
};

export const srtToText = async (file) => {
    const cues = parseSrt(await file.text());
    const text = cues.map((cue) => cue.text).join('\n');
    return textResult(text, replaceExtension(file.name, 'txt'));
};

export const csvToSrt = async (file) => {
    const parsed = Papa.parse((await file.text()).trim(), {
        header: true,
        skipEmptyLines: true,
    });
    if (!parsed.data.length) {
        throw new Error('CSV file contains no data rows');
    }
    const srt = buildSrt(rowsToCues(parsed.data));
    return textResult(
        srt,
        replaceExtension(file.name, 'srt'),
        'application/x-subrip'
    );
};
