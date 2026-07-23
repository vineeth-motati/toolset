/**
 * Source locator for JSON text (JSON Grid tool, /tools/jsongrid).
 *
 * The grid needs to jump from a clicked cell to the exact editor line that
 * produced it. The previous implementation did this with ~360 lines of string
 * heuristics (`line.includes('"' + key + '"')`) that broke on duplicate values,
 * minified input and repeated keys. This is a single-pass recursive-descent
 * scanner over the raw source that records the start line/column/offset of
 * every value, keyed by its structural path — so lookups are deterministic and
 * survive dup values, minification and repeated keys.
 *
 * Paths are arrays of segments: string for an object key, number for an array
 * index, e.g. ['0', 'metadata', 'settings', 'theme'] or ['0', 'tags', 1].
 * Segments are compared with String() so numeric indices and their string
 * forms unify — the grid speaks in strings, the parser in numbers.
 */

const KEY = (segments) => segments.map((s) => String(s)).join('\u0000');

/**
 * Walk the JSON source once and return a Map from path-key → location.
 * Location = { line, column, start, end } with 0-based line/column and
 * character offsets. Returns an empty map if the source is not valid JSON;
 * callers that already validate can ignore the failure mode.
 */
export function buildLocationMap(source) {
    const map = new Map();
    if (typeof source !== 'string' || source.length === 0) return map;

    let pos = 0;
    let line = 0;
    let column = 0;
    const len = source.length;

    // Advance one character, keeping line/column in sync.
    const advance = () => {
        const ch = source[pos];
        if (ch === '\n') {
            line += 1;
            column = 0;
        } else {
            column += 1;
        }
        pos += 1;
    };

    const skipWs = () => {
        while (pos < len) {
            const ch = source[pos];
            if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
                advance();
            } else {
                break;
            }
        }
    };

    const record = (segments, start, startLine, startColumn) => {
        map.set(KEY(segments), {
            line: startLine,
            column: startColumn,
            start,
            end: pos,
        });
    };

    // Consume a JSON string starting at the current `"` and return its raw
    // (unescaped-enough) text so object keys can be used as path segments.
    const readString = () => {
        // assumes source[pos] === '"'
        advance(); // opening quote
        let out = '';
        while (pos < len) {
            const ch = source[pos];
            if (ch === '\\') {
                const next = source[pos + 1];
                switch (next) {
                    case 'n':
                        out += '\n';
                        break;
                    case 't':
                        out += '\t';
                        break;
                    case 'r':
                        out += '\r';
                        break;
                    case 'b':
                        out += '\b';
                        break;
                    case 'f':
                        out += '\f';
                        break;
                    case '/':
                        out += '/';
                        break;
                    case '\\':
                        out += '\\';
                        break;
                    case '"':
                        out += '"';
                        break;
                    case 'u': {
                        const hex = source.slice(pos + 2, pos + 6);
                        out += String.fromCharCode(parseInt(hex, 16));
                        advance(); // backslash
                        advance(); // u
                        advance();
                        advance();
                        advance();
                        advance();
                        continue;
                    }
                    default:
                        out += next;
                }
                advance(); // backslash
                advance(); // escaped char
                continue;
            }
            if (ch === '"') {
                advance(); // closing quote
                return out;
            }
            out += ch;
            advance();
        }
        return out; // unterminated; caller stops anyway
    };

    // Skip a primitive token (number, true, false, null) to its end.
    const skipPrimitive = () => {
        while (pos < len) {
            const ch = source[pos];
            if (
                ch === ',' ||
                ch === '}' ||
                ch === ']' ||
                ch === ' ' ||
                ch === '\t' ||
                ch === '\n' ||
                ch === '\r'
            ) {
                break;
            }
            advance();
        }
    };

    const parseValue = (segments) => {
        skipWs();
        if (pos >= len) return;

        const start = pos;
        const startLine = line;
        const startColumn = column;
        const ch = source[pos];

        if (ch === '{') {
            advance();
            skipWs();
            if (source[pos] === '}') {
                advance();
                record(segments, start, startLine, startColumn);
                return;
            }
            while (pos < len) {
                skipWs();
                if (source[pos] !== '"') break; // malformed; bail gracefully
                const key = readString();
                skipWs();
                if (source[pos] === ':') advance();
                parseValue(segments.concat(key));
                skipWs();
                if (source[pos] === ',') {
                    advance();
                    continue;
                }
                if (source[pos] === '}') {
                    advance();
                    break;
                }
                break;
            }
            record(segments, start, startLine, startColumn);
            return;
        }

        if (ch === '[') {
            advance();
            skipWs();
            if (source[pos] === ']') {
                advance();
                record(segments, start, startLine, startColumn);
                return;
            }
            let index = 0;
            while (pos < len) {
                parseValue(segments.concat(index));
                index += 1;
                skipWs();
                if (source[pos] === ',') {
                    advance();
                    continue;
                }
                if (source[pos] === ']') {
                    advance();
                    break;
                }
                break;
            }
            record(segments, start, startLine, startColumn);
            return;
        }

        if (ch === '"') {
            readString();
            record(segments, start, startLine, startColumn);
            return;
        }

        // number / true / false / null
        skipPrimitive();
        record(segments, start, startLine, startColumn);
    };

    parseValue([]);
    return map;
}

/**
 * Locate a single path in the source. `segments` may be strings or numbers.
 * Returns { line, column, start, end } (0-based line/column) or null when the
 * path is absent. Builds a fresh map per call; callers doing many lookups on
 * unchanged text should `buildLocationMap` once and read the map directly.
 */
export function locatePath(source, segments) {
    const map = buildLocationMap(source);
    return map.get(KEY(segments || [])) || null;
}

/**
 * Parse a grid cell path string ('0.metadata.settings.theme', '0.tags[1]')
 * into structured segments ([ '0', 'metadata', 'settings', 'theme' ],
 * [ '0', 'tags', 1 ]). Numeric bracket indices become numbers; a leading
 * 'root.' prefix (emitted by NestedObjectView) is dropped.
 */
export function parseCellPath(pathString) {
    if (!pathString) return [];
    const segments = [];
    for (const raw of String(pathString).split('.')) {
        if (raw === '' || raw === 'root') continue;
        // Split "tags[1][2]" into "tags", 1, 2.
        const bracket = raw.indexOf('[');
        if (bracket === -1) {
            segments.push(raw);
            continue;
        }
        const name = raw.slice(0, bracket);
        if (name) segments.push(name);
        const indexMatches = raw.slice(bracket).matchAll(/\[(\d+)\]/g);
        for (const m of indexMatches) segments.push(Number(m[1]));
    }
    return segments;
}
