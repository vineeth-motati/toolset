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
 * Converters NOT in this registry stay on the API: AVI transcoding
 * (pre-WebCodecs codecs), eBooks, live-website capture (blocked by the
 * Same-Origin Policy), Office → PDF, and PDF layout extraction
 * (→ Word/Excel/CSV/HTML) all need engines the browser doesn't ship yet.
 * See docs/API_TO_LOCAL_CONVERTERS_PLAN.md (local-only) for the migration
 * plan off the API entirely.
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
    excelToHtml,
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
import { heicToPng, heicToJpg } from './converters/heicConverters';
import {
    ocrPngToText,
    ocrJpgToText,
    ocrPngToPdf,
    ocrJpgToPdf,
    ocrPdfToText,
} from './converters/ocrConverters';
import { pdfToText, pdfToJpg, pdfToPng } from './converters/pdfConverters';
import {
    wavToMp3,
    flacToMp3,
    mp3ToWav,
    mp4ToMp3,
} from './converters/audioConverters';
import { wordToHtml } from './converters/docConverters';
import { movToMp4, mkvToMp4 } from './converters/videoConverters';
import {
    htmlToPng,
    htmlToJpg,
    htmlToPdf,
} from './converters/htmlConverters';
import { validateXmlXsd } from './converters/xsdValidator';

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

    // PDF group (image ↔ PDF and text extraction — layout/table
    // extraction to Word/Excel/CSV/HTML stays on the API)
    '/tools/convert/jpg-to-pdf': { convert: imageToPdf },
    '/tools/convert/png-to-pdf': { convert: imageToPdf },
    '/tools/convert/pdf-to-text': { convert: pdfToText },
    '/tools/convert/pdf-to-jpg': { convert: pdfToJpg },
    '/tools/convert/pdf-to-png': { convert: pdfToPng },

    // Image group
    '/tools/convert/png-to-webp': { convert: pngToWebp },
    '/tools/convert/jpg-to-webp': { convert: jpgToWebp },
    '/tools/convert/webp-to-png': { convert: webpToPng },
    '/tools/convert/webp-to-jpg': { convert: webpToJpg },
    '/tools/convert/png-to-jpg': { convert: pngToJpg },
    '/tools/convert/jpg-to-png': { convert: jpgToPng },
    '/tools/convert/heic-to-png': { convert: heicToPng },
    '/tools/convert/heic-to-jpg': { convert: heicToJpg },

    // OCR group (the whole group runs locally)
    '/tools/convert/ocr-png-to-text': { convert: ocrPngToText },
    '/tools/convert/ocr-jpg-to-text': { convert: ocrJpgToText },
    '/tools/convert/ocr-png-to-pdf': { convert: ocrPngToPdf },
    '/tools/convert/ocr-jpg-to-pdf': { convert: ocrJpgToPdf },
    '/tools/convert/ocr-pdf-to-text': { convert: ocrPdfToText },

    // Subtitles group
    '/tools/convert/srt-to-csv': { convert: srtToCsv },
    '/tools/convert/srt-to-excel': { convert: srtToExcel },
    '/tools/convert/srt-to-text': { convert: srtToText },
    '/tools/convert/csv-to-srt': { convert: csvToSrt },
    '/tools/convert/excel-to-srt': { convert: excelToSrt },

    // Audio group (Web Audio decode + lamejs encode)
    '/tools/convert/wav-to-mp3': { convert: wavToMp3 },
    '/tools/convert/flac-to-mp3': { convert: flacToMp3 },
    '/tools/convert/mp3-to-wav': { convert: mp3ToWav },
    '/tools/convert/mp4-to-mp3': { convert: mp4ToMp3 },

    // Video group (mediabunny remux/WebCodecs — AVI stays on the API,
    // its codecs pre-date WebCodecs)
    '/tools/convert/mov-to-mp4': { convert: movToMp4 },
    '/tools/convert/mkv-to-mp4': { convert: mkvToMp4 },

    // HTML capture group (sandboxed-iframe render — capture of LIVE
    // websites by URL can't work in a browser: Same-Origin Policy)
    '/tools/convert/html-to-png': { convert: htmlToPng },
    '/tools/convert/html-to-jpg': { convert: htmlToJpg },
    '/tools/convert/html-to-pdf': { convert: htmlToPdf },

    // Document group (semantic HTML output — layout-faithful Office → PDF
    // stays on the API)
    '/tools/convert/word-to-html': { convert: wordToHtml },
    '/tools/convert/excel-to-html': { convert: excelToHtml },

    // Misc XML utilities
    '/tools/convert/fix-xml-escaping': { convert: fixXmlEscaping },
    '/tools/convert/validate-xml-xsd': { convert: validateXmlXsd },
};

export const getLocalConverter = (path) => localConverters[path] || null;
