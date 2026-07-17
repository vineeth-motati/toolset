/**
 * Registry of converters that run entirely in the browser.
 * Converters listed here never touch the ConversionTools API and
 * therefore need no API key. Keyed by converter route path.
 *
 * Each handler receives the source File and the converter params, and
 * resolves to the same result shape the API client produces:
 * { blob, filename, text? } — `text` enables persistence/sharing for
 * text outputs; small binary outputs are persisted as base64 by the UI.
 *
 * Converters NOT in this registry stay on the API: OCR, audio/video,
 * eBooks, HEIC, website capture, PDF parsing, XSD validation and
 * Office → PDF all need engines the browser doesn't ship.
 */
import {
    xmlToJson,
    formatJson,
    validateJson,
    jsonToXml,
    jsonToCsv,
    csvToJson,
    yamlToJson,
    jsonToYaml,
    csvToXml,
    xmlToCsv,
    fixXmlEscaping,
    htmlTableToCsv,
} from './converters/dataFormats';
import {
    excelToJson,
    excelToCsv,
    excelToXml,
    excelToSrt,
    jsonToExcel,
    csvToExcel,
    srtToExcel,
    xmlToExcel,
} from './converters/excelConverters';
import {
    srtToCsv,
    srtToText,
    csvToSrt,
} from './converters/srtConverters';
import {
    pngToWebp,
    jpgToWebp,
    webpToPng,
    webpToJpg,
    pngToJpg,
    jpgToPng,
    imageToPdf,
} from './converters/imageConverters';

// Inputs/outputs larger than this are still converted, but skipped
// for localStorage persistence and share links (sqlite row + 5MB
// localStorage quota are the constraints).
export const LOCAL_PERSIST_MAX_CHARS = 500_000;

const localConverters = {
    // JSON group
    '/tools/convert/xml-to-json': { convert: xmlToJson },
    '/tools/convert/format-json': { convert: formatJson },
    '/tools/convert/validate-json': { convert: validateJson },
    '/tools/convert/json-to-xml': { convert: jsonToXml },
    '/tools/convert/json-to-csv': { convert: jsonToCsv },
    '/tools/convert/json-to-excel': { convert: jsonToExcel },
    '/tools/convert/excel-to-json': { convert: excelToJson },
    '/tools/convert/csv-to-json': { convert: csvToJson },
    '/tools/convert/yaml-to-json': { convert: yamlToJson },
    '/tools/convert/json-to-yaml': { convert: jsonToYaml },

    // XML group
    '/tools/convert/csv-to-xml': { convert: csvToXml },
    '/tools/convert/excel-to-xml': { convert: excelToXml },
    '/tools/convert/xml-to-csv': { convert: xmlToCsv },
    '/tools/convert/xml-to-excel': { convert: xmlToExcel },

    // CSV group
    '/tools/convert/html-to-csv': { convert: htmlTableToCsv },
    '/tools/convert/excel-to-csv': { convert: excelToCsv },
    '/tools/convert/csv-to-excel': { convert: csvToExcel },

    // PDF group (image sources only — PDF parsing stays on the API)
    '/tools/convert/jpg-to-pdf': { convert: imageToPdf },
    '/tools/convert/png-to-pdf': { convert: imageToPdf },

    // Image group
    '/tools/convert/png-to-webp': { convert: pngToWebp },
    '/tools/convert/jpg-to-webp': { convert: jpgToWebp },
    '/tools/convert/webp-to-png': { convert: webpToPng },
    '/tools/convert/webp-to-jpg': { convert: webpToJpg },
    '/tools/convert/png-to-jpg': { convert: pngToJpg },
    '/tools/convert/jpg-to-png': { convert: jpgToPng },

    // Subtitles group
    '/tools/convert/srt-to-csv': { convert: srtToCsv },
    '/tools/convert/srt-to-excel': { convert: srtToExcel },
    '/tools/convert/srt-to-text': { convert: srtToText },
    '/tools/convert/csv-to-srt': { convert: csvToSrt },
    '/tools/convert/excel-to-srt': { convert: excelToSrt },

    // Misc XML utilities
    '/tools/convert/fix-xml-escaping': { convert: fixXmlEscaping },
};

export const getLocalConverter = (path) => localConverters[path] || null;
