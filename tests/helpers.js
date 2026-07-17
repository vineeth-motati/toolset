/**
 * Shared test helpers. Converter handlers take a File and return
 * { blob, filename, text? } — these helpers build inputs and read outputs.
 */

export const makeFile = (content, name, type = 'text/plain') =>
    new File([content], name, { type });

export const blobText = (blob) => blob.text();

// Minimal SRT fixture shared by the subtitle + Excel test suites.
export const SAMPLE_SRT = `1
00:00:01,000 --> 00:00:04,000
Hello world

2
00:00:05,500 --> 00:00:07,250
Second line
with two rows
`;

export const SAMPLE_CSV = `name,age,city
Alice,30,Paris
Bob,25,Lyon`;

export const SAMPLE_JSON_RECORDS = [
    { name: 'Alice', age: 30, city: 'Paris' },
    { name: 'Bob', age: 25, city: 'Lyon' },
];

export const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
    <row><name>Alice</name><age>30</age></row>
    <row><name>Bob</name><age>25</age></row>
</root>`;
