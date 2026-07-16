/**
 * Helpers shared by the local (in-browser) converter handlers.
 */

export const replaceExtension = (filename, extension) => {
    const base = filename.replace(/\.[^.]+$/, '');
    return `${base}.${extension}`;
};

export const textResult = (text, filename, mime = 'text/plain') => ({
    blob: new Blob([text], { type: mime }),
    filename,
    text,
});

// XML element names can't contain spaces or most punctuation; CSV/Excel
// headers frequently do.
export const toXmlName = (name) => {
    const cleaned = String(name)
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, '_');
    return /^[a-zA-Z_]/.test(cleaned) ? cleaned : `_${cleaned}`;
};

// Flatten non-primitive cell values so tabular formats (CSV/Excel/XML rows)
// never render "[object Object]".
export const toCellValue = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return value;
};

// Convert an array of uniform-ish objects into { headers, rows } where every
// row is an array aligned to headers. Used by JSON/XML → CSV/Excel.
export const toTable = (records) => {
    const headers = [];
    for (const record of records) {
        for (const key of Object.keys(record)) {
            if (!headers.includes(key)) headers.push(key);
        }
    }
    const rows = records.map((record) =>
        headers.map((header) => toCellValue(record[header]))
    );
    return { headers, rows };
};
