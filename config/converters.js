/**
 * Centralized converter configuration file
 * Contains metadata for all conversion tools
 */
export default [
    // JSON Converter Group
    {
        path: '/tools/convert/xml-to-json',
        apiType: 'convert.xml_to_json',
        title: 'XML to JSON Converter',
        description: 'Convert XML files to JSON format',
        sourceFormat: 'XML',
        targetFormat: 'JSON',
        sourceIcon: 'tabler:file-type-xml',
        sourceAccept: '.xml,application/xml,text/xml',
        category: 'JSON Converter',
        params: [
            {
                name: 'space',
                label: 'Indentation',
                type: 'select',
                required: false,
                options: [
                    { value: '0', label: 'No spaces' },
                    { value: '1s', label: '1 space' },
                    { value: '2s', label: '2 spaces' },
                    { value: '3s', label: '3 spaces' },
                    { value: '4s', label: '4 spaces' },
                    { value: '1t', label: '1 tab' },
                ],
                default: '2s',
                description: 'Number of spaces for JSON indentation',
            },
        ],
    },
    {
        path: '/tools/convert/format-json',
        apiType: 'convert.format_json',
        title: 'JSON Formatter',
        description: 'Format and beautify JSON data',
        sourceFormat: 'JSON',
        targetFormat: 'Formatted JSON',
        sourceIcon: 'mdi:json',
        sourceAccept: '.json,application/json',
        category: 'JSON Converter',
    },
    {
        path: '/tools/convert/validate-json',
        apiType: 'convert.validate_json',
        title: 'JSON Validator',
        description: 'Validate JSON data structure and format',
        sourceFormat: 'JSON',
        targetFormat: 'Validation Result',
        sourceIcon: 'mdi:json',
        sourceAccept: '.json,application/json',
        category: 'JSON Converter',
    },
    {
        path: '/tools/convert/json-to-xml',
        apiType: 'convert.json_to_xml',
        title: 'JSON to XML Converter',
        description: 'Convert JSON files to XML format',
        sourceFormat: 'JSON',
        targetFormat: 'XML',
        sourceIcon: 'mdi:json',
        sourceAccept: '.json,application/json',
        category: 'JSON Converter',
    },
    {
        path: '/tools/convert/json-to-csv',
        apiType: 'convert.json_to_csv',
        title: 'JSON to CSV Converter',
        description: 'Convert JSON files to CSV format',
        sourceFormat: 'JSON',
        targetFormat: 'CSV',
        sourceIcon: 'mdi:json',
        sourceAccept: '.json,application/json',
        category: 'JSON Converter',
    },
    {
        path: '/tools/convert/json-to-excel',
        apiType: 'convert.json_to_excel',
        title: 'JSON to Excel Converter',
        description: 'Convert JSON files to Excel spreadsheet',
        sourceFormat: 'JSON',
        targetFormat: 'Excel',
        sourceIcon: 'mdi:json',
        sourceAccept: '.json,application/json',
        category: 'JSON Converter',
    },
    {
        path: '/tools/convert/excel-to-json',
        apiType: 'convert.excel_to_json',
        title: 'Excel to JSON Converter',
        description: 'Convert Excel files to JSON format',
        sourceFormat: 'Excel',
        targetFormat: 'JSON',
        sourceIcon: 'mdi:microsoft-excel',
        sourceAccept:
            '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
        category: 'JSON Converter',
    },
    {
        path: '/tools/convert/csv-to-json',
        apiType: 'convert.csv_to_json',
        title: 'CSV to JSON Converter',
        description: 'Convert CSV files to JSON format',
        sourceFormat: 'CSV',
        targetFormat: 'JSON',
        sourceIcon: 'mdi:file-delimited',
        sourceAccept: '.csv,text/csv',
        category: 'JSON Converter',
    },
    {
        path: '/tools/convert/yaml-to-json',
        apiType: 'convert.yaml_to_json',
        title: 'YAML to JSON Converter',
        description: 'Convert YAML files to JSON format',
        sourceFormat: 'YAML',
        targetFormat: 'JSON',
        sourceIcon: 'mdi:code-json',
        sourceAccept: '.yaml,.yml,application/yaml,text/yaml',
        category: 'JSON Converter',
    },
    {
        path: '/tools/convert/json-to-yaml',
        apiType: 'convert.json_to_yaml',
        title: 'JSON to YAML Converter',
        description: 'Convert JSON files to YAML format',
        sourceFormat: 'JSON',
        targetFormat: 'YAML',
        sourceIcon: 'mdi:json',
        sourceAccept: '.json,application/json',
        category: 'JSON Converter',
    },

    // XML Converter Group
    {
        path: '/tools/convert/csv-to-xml',
        apiType: 'convert.csv_to_xml',
        title: 'CSV to XML Converter',
        description: 'Convert CSV files to XML format',
        sourceFormat: 'CSV',
        targetFormat: 'XML',
        sourceIcon: 'mdi:file-delimited',
        sourceAccept: '.csv,text/csv',
        category: 'XML Converter',
    },
    {
        path: '/tools/convert/excel-to-xml',
        apiType: 'convert.excel_to_xml',
        title: 'Excel to XML Converter',
        description: 'Convert Excel files to XML format',
        sourceFormat: 'Excel',
        targetFormat: 'XML',
        sourceIcon: 'mdi:microsoft-excel',
        sourceAccept:
            '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
        category: 'XML Converter',
    },
    {
        path: '/tools/convert/xml-to-csv',
        apiType: 'convert.xml_to_csv',
        title: 'XML to CSV Converter',
        description: 'Convert XML files to CSV format',
        sourceFormat: 'XML',
        targetFormat: 'CSV',
        sourceIcon: 'tabler:file-type-xml',
        sourceAccept: '.xml,application/xml,text/xml',
        category: 'XML Converter',
    },
    {
        path: '/tools/convert/xml-to-excel',
        apiType: 'convert.xml_to_excel',
        title: 'XML to Excel Converter',
        description: 'Convert XML files to Excel spreadsheet format',
        sourceFormat: 'XML',
        targetFormat: 'Excel',
        sourceIcon: 'tabler:file-type-xml',
        sourceAccept: '.xml,application/xml,text/xml',
        category: 'XML Converter',
    },
    {
        path: '/tools/convert/fix-xml-escaping',
        apiType: 'convert.fix_xml_escaping',
        title: 'Fix XML Escaping',
        description: 'Fix XML escaping issues and format XML files',
        sourceFormat: 'XML',
        targetFormat: 'Fixed XML',
        sourceIcon: 'tabler:file-type-xml',
        sourceAccept: '.xml,application/xml,text/xml',
        category: 'XML Converter',
    },
    {
        path: '/tools/convert/validate-xml-xsd',
        apiType: 'convert.validate_xml_xsd',
        title: 'XML/XSD Validator',
        description: 'Validate XML files against XSD schema',
        sourceFormat: 'XML/XSD',
        targetFormat: 'Validation Result',
        sourceIcon: 'tabler:file-type-xml',
        sourceAccept: '.xml,.xsd,application/xml,text/xml',
        category: 'XML Converter',
    },

    // CSV Converter Group
    {
        path: '/tools/convert/html-to-csv',
        apiType: 'convert.html_table_to_csv',
        title: 'HTML Table to CSV Converter',
        description: 'Extract tables from HTML and convert to CSV format',
        sourceFormat: 'HTML',
        targetFormat: 'CSV',
        sourceIcon: 'mdi:language-html5',
        sourceAccept: '.html,.htm,text/html',
        category: 'CSV Converter',
    },
    {
        path: '/tools/convert/excel-to-csv',
        apiType: 'convert.excel_to_csv',
        title: 'Excel to CSV Converter',
        description: 'Convert Excel spreadsheets to CSV format',
        sourceFormat: 'Excel',
        targetFormat: 'CSV',
        sourceIcon: 'mdi:microsoft-excel',
        sourceAccept:
            '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
        category: 'CSV Converter',
    },
    {
        path: '/tools/convert/csv-to-excel',
        apiType: 'convert.csv_to_excel',
        title: 'CSV to Excel Converter',
        description: 'Convert CSV files to Excel spreadsheet format',
        sourceFormat: 'CSV',
        targetFormat: 'Excel',
        sourceIcon: 'mdi:file-delimited',
        sourceAccept: '.csv,text/csv',
        category: 'CSV Converter',
    },
    {
        path: '/tools/convert/pdf-to-csv',
        apiType: 'convert.pdf_to_csv',
        title: 'PDF to CSV Converter',
        description: 'Extract tables from PDF and convert to CSV format',
        sourceFormat: 'PDF',
        targetFormat: 'CSV',
        sourceIcon: 'mdi:file-pdf-box',
        sourceAccept: '.pdf,application/pdf',
        category: 'CSV Converter',
    },

    // PDF Converter Group
    {
        path: '/tools/convert/html-to-pdf',
        apiType: 'convert.website_to_pdf',
        title: 'HTML to PDF Converter',
        description: 'Convert HTML files or web pages to PDF format',
        sourceFormat: 'HTML',
        targetFormat: 'PDF',
        sourceIcon: 'mdi:language-html5',
        sourceAccept: '.html,.htm,text/html',
        category: 'PDF Converter',
    },
    {
        path: '/tools/convert/word-to-pdf',
        apiType: 'convert.word_to_pdf',
        title: 'Word to PDF Converter',
        description: 'Convert Word documents to PDF format',
        sourceFormat: 'Word',
        targetFormat: 'PDF',
        sourceIcon: 'mdi:microsoft-word',
        sourceAccept:
            '.docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword',
        category: 'PDF Converter',
    },
    {
        path: '/tools/convert/powerpoint-to-pdf',
        apiType: 'convert.powerpoint_to_pdf',
        title: 'PowerPoint to PDF Converter',
        description: 'Convert PowerPoint presentations to PDF format',
        sourceFormat: 'PowerPoint',
        targetFormat: 'PDF',
        sourceIcon: 'mdi:microsoft-powerpoint',
        sourceAccept:
            '.pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint',
        category: 'PDF Converter',
    },
    {
        path: '/tools/convert/jpg-to-pdf',
        apiType: 'convert.jpg_to_pdf',
        title: 'JPG to PDF Converter',
        description: 'Convert JPG images to PDF format',
        sourceFormat: 'JPG',
        targetFormat: 'PDF',
        sourceIcon: 'mdi:file-jpg-box',
        sourceAccept: '.jpg,.jpeg,image/jpeg',
        category: 'PDF Converter',
    },
    {
        path: '/tools/convert/png-to-pdf',
        apiType: 'convert.png_to_pdf',
        title: 'PNG to PDF Converter',
        description: 'Convert PNG images to PDF format',
        sourceFormat: 'PNG',
        targetFormat: 'PDF',
        sourceIcon: 'mdi:file-png-box',
        sourceAccept: '.png,image/png',
        category: 'PDF Converter',
    },
    {
        path: '/tools/convert/excel-to-pdf',
        apiType: 'convert.excel_to_pdf',
        title: 'Excel to PDF Converter',
        description: 'Convert Excel spreadsheets to PDF format',
        sourceFormat: 'Excel',
        targetFormat: 'PDF',
        sourceIcon: 'mdi:microsoft-excel',
        sourceAccept:
            '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
        category: 'PDF Converter',
    },
    {
        path: '/tools/convert/pdf-to-jpg',
        apiType: 'convert.pdf_to_jpg',
        title: 'PDF to JPG Converter',
        description: 'Convert PDF pages to JPG images',
        sourceFormat: 'PDF',
        targetFormat: 'JPG',
        sourceIcon: 'mdi:file-pdf-box',
        sourceAccept: '.pdf,application/pdf',
        category: 'PDF Converter',
    },
    {
        path: '/tools/convert/pdf-to-png',
        apiType: 'convert.pdf_to_png',
        title: 'PDF to PNG Converter',
        description: 'Convert PDF pages to PNG images',
        sourceFormat: 'PDF',
        targetFormat: 'PNG',
        sourceIcon: 'mdi:file-pdf-box',
        sourceAccept: '.pdf,application/pdf',
        category: 'PDF Converter',
    },
    {
        path: '/tools/convert/pdf-to-html',
        apiType: 'convert.pdf_to_html',
        title: 'PDF to HTML Converter',
        description: 'Convert PDF documents to HTML format',
        sourceFormat: 'PDF',
        targetFormat: 'HTML',
        sourceIcon: 'mdi:file-pdf-box',
        sourceAccept: '.pdf,application/pdf',
        category: 'PDF Converter',
    },
    {
        path: '/tools/convert/pdf-to-text',
        apiType: 'convert.pdf_to_text',
        title: 'PDF to Text Converter',
        description: 'Extract text from PDF documents',
        sourceFormat: 'PDF',
        targetFormat: 'Text',
        sourceIcon: 'mdi:file-pdf-box',
        sourceAccept: '.pdf,application/pdf',
        category: 'PDF Converter',
    },
    {
        path: '/tools/convert/pdf-to-excel',
        apiType: 'convert.pdf_to_excel',
        title: 'PDF to Excel Converter',
        description: 'Convert tables from PDF documents to Excel spreadsheets',
        sourceFormat: 'PDF',
        targetFormat: 'Excel',
        sourceIcon: 'mdi:file-pdf-box',
        sourceAccept: '.pdf,application/pdf',
        category: 'PDF Converter',
    },
    {
        path: '/tools/convert/pdf-to-word',
        apiType: 'convert.pdf_to_word',
        title: 'PDF to Word Converter',
        description: 'Convert PDF documents to Word format',
        sourceFormat: 'PDF',
        targetFormat: 'Word',
        sourceIcon: 'mdi:file-pdf-box',
        sourceAccept: '.pdf,application/pdf',
        category: 'PDF Converter',
    },

    // Image Converter Group
    {
        path: '/tools/convert/png-to-webp',
        apiType: 'convert.png_to_webp',
        title: 'PNG to WebP Converter',
        description: 'Convert PNG images to WebP format',
        sourceFormat: 'PNG',
        targetFormat: 'WebP',
        sourceIcon: 'mdi:file-png-box',
        sourceAccept: '.png,image/png',
        category: 'Image Converter',
    },
    {
        path: '/tools/convert/jpg-to-webp',
        apiType: 'convert.jpg_to_webp',
        title: 'JPG to WebP Converter',
        description: 'Convert JPG images to WebP format',
        sourceFormat: 'JPG',
        targetFormat: 'WebP',
        sourceIcon: 'mdi:file-jpg-box',
        sourceAccept: '.jpg,.jpeg,image/jpeg',
        category: 'Image Converter',
    },
    {
        path: '/tools/convert/webp-to-png',
        apiType: 'convert.webp_to_png',
        title: 'WebP to PNG Converter',
        description: 'Convert WebP images to PNG format',
        sourceFormat: 'WebP',
        targetFormat: 'PNG',
        sourceIcon: 'mdi:image',
        sourceAccept: '.webp,image/webp',
        category: 'Image Converter',
    },
    {
        path: '/tools/convert/webp-to-jpg',
        apiType: 'convert.webp_to_jpg',
        title: 'WebP to JPG Converter',
        description: 'Convert WebP images to JPG format',
        sourceFormat: 'WebP',
        targetFormat: 'JPG',
        sourceIcon: 'mdi:image',
        sourceAccept: '.webp,image/webp',
        category: 'Image Converter',
    },
    {
        path: '/tools/convert/png-to-jpg',
        apiType: 'convert.png_to_jpg',
        title: 'PNG to JPG Converter',
        description: 'Convert PNG images to JPG format',
        sourceFormat: 'PNG',
        targetFormat: 'JPG',
        sourceIcon: 'mdi:file-png-box',
        sourceAccept: '.png,image/png',
        category: 'Image Converter',
    },
    {
        path: '/tools/convert/jpg-to-png',
        apiType: 'convert.jpg_to_png',
        title: 'JPG to PNG Converter',
        description: 'Convert JPG images to PNG format',
        sourceFormat: 'JPG',
        targetFormat: 'PNG',
        sourceIcon: 'mdi:file-jpg-box',
        sourceAccept: '.jpg,.jpeg,image/jpeg',
        category: 'Image Converter',
    },
    {
        path: '/tools/convert/heic-to-png',
        apiType: 'convert.heic_to_png',
        title: 'HEIC to PNG Converter',
        description: 'Convert HEIC images to PNG format',
        sourceFormat: 'HEIC',
        targetFormat: 'PNG',
        sourceIcon: 'mdi:image',
        sourceAccept: '.heic,image/heic',
        category: 'Image Converter',
    },
    {
        path: '/tools/convert/heic-to-jpg',
        apiType: 'convert.heic_to_jpg',
        title: 'HEIC to JPG Converter',
        description: 'Convert HEIC images to JPG format',
        sourceFormat: 'HEIC',
        targetFormat: 'JPG',
        sourceIcon: 'mdi:image',
        sourceAccept: '.heic,image/heic',
        category: 'Image Converter',
    },

    // OCR Converter Group
    {
        path: '/tools/convert/ocr-png-to-text',
        apiType: 'convert.ocr_png_to_text',
        title: 'OCR: PNG to Text',
        description: 'Extract text from PNG images using OCR',
        sourceFormat: 'PNG',
        targetFormat: 'Text',
        sourceIcon: 'mdi:file-png-box',
        sourceAccept: '.png,image/png',
        category: 'OCR Converter',
        params: [
            {
                name: 'language_ocr',
                label: 'OCR Language',
                type: 'select',
                required: false,
                options: [
                    { value: 'eng', label: 'English' },
                    { value: 'fra', label: 'French' },
                    { value: 'deu', label: 'German' },
                    { value: 'spa', label: 'Spanish' },
                    { value: 'ita', label: 'Italian' },
                    { value: 'por', label: 'Portuguese' },
                    { value: 'rus', label: 'Russian' },
                    { value: 'chi_sim', label: 'Chinese (Simplified)' },
                    { value: 'chi_tra', label: 'Chinese (Traditional)' },
                    { value: 'jpn', label: 'Japanese' },
                    { value: 'kor', label: 'Korean' },
                    { value: 'ara', label: 'Arabic' },
                ],
                default: 'eng',
                description: 'Language used for OCR text extraction',
            },
        ],
    },
    {
        path: '/tools/convert/ocr-jpg-to-text',
        apiType: 'convert.ocr_jpg_to_text',
        title: 'OCR: JPG to Text',
        description: 'Extract text from JPG images using OCR',
        sourceFormat: 'JPG',
        targetFormat: 'Text',
        sourceIcon: 'mdi:file-jpg-box',
        sourceAccept: '.jpg,.jpeg,image/jpeg',
        category: 'OCR Converter',
        params: [
            {
                name: 'language_ocr',
                label: 'OCR Language',
                type: 'select',
                required: false,
                options: [
                    { value: 'eng', label: 'English' },
                    { value: 'fra', label: 'French' },
                    { value: 'deu', label: 'German' },
                    { value: 'spa', label: 'Spanish' },
                    { value: 'ita', label: 'Italian' },
                    { value: 'por', label: 'Portuguese' },
                    { value: 'rus', label: 'Russian' },
                    { value: 'chi_sim', label: 'Chinese (Simplified)' },
                    { value: 'chi_tra', label: 'Chinese (Traditional)' },
                    { value: 'jpn', label: 'Japanese' },
                    { value: 'kor', label: 'Korean' },
                    { value: 'ara', label: 'Arabic' },
                ],
                default: 'eng',
                description: 'Language used for OCR text extraction',
            },
        ],
    },
    {
        path: '/tools/convert/ocr-png-to-pdf',
        apiType: 'convert.ocr_png_to_pdf',
        title: 'OCR: PNG to PDF',
        description: 'Convert PNG images to searchable PDF using OCR',
        sourceFormat: 'PNG',
        targetFormat: 'PDF (Searchable)',
        sourceIcon: 'mdi:file-png-box',
        sourceAccept: '.png,image/png',
        category: 'OCR Converter',
        params: [
            {
                name: 'language_ocr',
                label: 'OCR Language',
                type: 'select',
                required: false,
                options: [
                    { value: 'eng', label: 'English' },
                    { value: 'fra', label: 'French' },
                    { value: 'deu', label: 'German' },
                    { value: 'spa', label: 'Spanish' },
                    { value: 'ita', label: 'Italian' },
                    { value: 'por', label: 'Portuguese' },
                    { value: 'rus', label: 'Russian' },
                    { value: 'chi_sim', label: 'Chinese (Simplified)' },
                    { value: 'chi_tra', label: 'Chinese (Traditional)' },
                    { value: 'jpn', label: 'Japanese' },
                    { value: 'kor', label: 'Korean' },
                    { value: 'ara', label: 'Arabic' },
                ],
                default: 'eng',
                description: 'Language used for OCR text extraction',
            },
        ],
    },
    {
        path: '/tools/convert/ocr-jpg-to-pdf',
        apiType: 'convert.ocr_jpg_to_pdf',
        title: 'OCR: JPG to PDF',
        description: 'Convert JPG images to searchable PDF using OCR',
        sourceFormat: 'JPG',
        targetFormat: 'PDF (Searchable)',
        sourceIcon: 'mdi:file-jpg-box',
        sourceAccept: '.jpg,.jpeg,image/jpeg',
        category: 'OCR Converter',
        params: [
            {
                name: 'language_ocr',
                label: 'OCR Language',
                type: 'select',
                required: false,
                options: [
                    { value: 'eng', label: 'English' },
                    { value: 'fra', label: 'French' },
                    { value: 'deu', label: 'German' },
                    { value: 'spa', label: 'Spanish' },
                    { value: 'ita', label: 'Italian' },
                    { value: 'por', label: 'Portuguese' },
                    { value: 'rus', label: 'Russian' },
                    { value: 'chi_sim', label: 'Chinese (Simplified)' },
                    { value: 'chi_tra', label: 'Chinese (Traditional)' },
                    { value: 'jpn', label: 'Japanese' },
                    { value: 'kor', label: 'Korean' },
                    { value: 'ara', label: 'Arabic' },
                ],
                default: 'eng',
                description: 'Language used for OCR text extraction',
            },
        ],
    },
    {
        path: '/tools/convert/ocr-pdf-to-text',
        apiType: 'convert.ocr_pdf_to_text',
        title: 'OCR: PDF to Text',
        description: 'Extract text from scanned PDF documents using OCR',
        sourceFormat: 'PDF',
        targetFormat: 'Text',
        sourceIcon: 'mdi:file-pdf-box',
        sourceAccept: '.pdf,application/pdf',
        category: 'OCR Converter',
        params: [
            {
                name: 'language_ocr',
                label: 'OCR Language',
                type: 'select',
                required: false,
                options: [
                    { value: 'eng', label: 'English' },
                    { value: 'fra', label: 'French' },
                    { value: 'deu', label: 'German' },
                    { value: 'spa', label: 'Spanish' },
                    { value: 'ita', label: 'Italian' },
                    { value: 'por', label: 'Portuguese' },
                    { value: 'rus', label: 'Russian' },
                    { value: 'chi_sim', label: 'Chinese (Simplified)' },
                    { value: 'chi_tra', label: 'Chinese (Traditional)' },
                    { value: 'jpn', label: 'Japanese' },
                    { value: 'kor', label: 'Korean' },
                    { value: 'ara', label: 'Arabic' },
                ],
                default: 'eng',
                description: 'Language used for OCR text extraction',
            },
        ],
    },

    // Website Converter Group
    {
        path: '/tools/convert/website-to-pdf',
        apiType: 'convert.website_to_pdf',
        title: 'Website to PDF Converter',
        description: 'Convert websites to PDF format',
        sourceFormat: 'URL',
        targetFormat: 'PDF',
        sourceIcon: 'mdi:web',
        sourceAccept: null, // Will use URL input instead of file
        category: 'Website Converter',
        params: [
            {
                name: 'background',
                label: 'Include Background',
                type: 'select',
                required: false,
                options: [
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                ],
                default: 'yes',
                description: 'Include background images and colors',
            },
            {
                name: 'images',
                label: 'Include Images',
                type: 'select',
                required: false,
                options: [
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                ],
                default: 'yes',
                description: 'Include images in the PDF',
            },
            {
                name: 'javascript',
                label: 'Execute JavaScript',
                type: 'select',
                required: false,
                options: [
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                ],
                default: 'yes',
                description: 'Execute JavaScript on the page',
            },
            {
                name: 'viewport_width',
                label: 'Viewport Width',
                type: 'number',
                required: false,
                placeholder: '1080',
                description: 'Viewport width in pixels',
            },
            {
                name: 'viewport_height',
                label: 'Viewport Height',
                type: 'number',
                required: false,
                placeholder: '1920',
                description: 'Viewport height in pixels',
            },
        ],
    },
    {
        path: '/tools/convert/website-to-jpg',
        apiType: 'convert.website_to_jpg',
        title: 'Website to JPG Converter',
        description: 'Capture website screenshots as JPG images',
        sourceFormat: 'URL',
        targetFormat: 'JPG',
        sourceIcon: 'mdi:web',
        sourceAccept: null, // Will use URL input instead of file
        category: 'Website Converter',
    },
    {
        path: '/tools/convert/website-to-png',
        apiType: 'convert.website_to_png',
        title: 'Website to PNG Converter',
        description: 'Capture website screenshots as PNG images',
        sourceFormat: 'URL',
        targetFormat: 'PNG',
        sourceIcon: 'mdi:web',
        sourceAccept: null, // Will use URL input instead of file
        category: 'Website Converter',
    },
    {
        path: '/tools/convert/html-to-jpg',
        apiType: 'convert.html_to_jpg',
        title: 'HTML to JPG Converter',
        description: 'Convert HTML code to JPG image format',
        sourceFormat: 'HTML',
        targetFormat: 'JPG',
        sourceIcon: 'mdi:language-html5',
        sourceAccept: '.html,.htm,text/html',
        category: 'Website Converter',
    },
    {
        path: '/tools/convert/html-to-png',
        apiType: 'convert.html_to_png',
        title: 'HTML to PNG Converter',
        description: 'Convert HTML code to PNG image format',
        sourceFormat: 'HTML',
        targetFormat: 'PNG',
        sourceIcon: 'mdi:language-html5',
        sourceAccept: '.html,.htm,text/html',
        category: 'Website Converter',
    },
    {
        path: '/tools/convert/word-to-html',
        apiType: 'convert.word_to_html',
        title: 'Word to HTML Converter',
        description: 'Convert Word documents to HTML format',
        sourceFormat: 'Word',
        targetFormat: 'HTML',
        sourceIcon: 'mdi:microsoft-word',
        sourceAccept:
            '.docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword',
        category: 'Website Converter',
    },
    {
        path: '/tools/convert/excel-to-html',
        apiType: 'convert.excel_to_html',
        title: 'Excel to HTML Converter',
        description: 'Convert Excel spreadsheets to HTML format',
        sourceFormat: 'Excel',
        targetFormat: 'HTML',
        sourceIcon: 'mdi:microsoft-excel',
        sourceAccept:
            '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
        category: 'Website Converter',
    },

    // Video Converter Group
    {
        path: '/tools/convert/mov-to-mp4',
        apiType: 'convert.mov_to_mp4',
        title: 'MOV to MP4 Converter',
        description: 'Convert MOV video files to MP4 format',
        sourceFormat: 'MOV',
        targetFormat: 'MP4',
        sourceIcon: 'mdi:video',
        sourceAccept: '.mov,video/quicktime',
        category: 'Video Converter',
    },
    {
        path: '/tools/convert/mkv-to-mp4',
        apiType: 'convert.mkv_to_mp4',
        title: 'MKV to MP4 Converter',
        description: 'Convert MKV video files to MP4 format',
        sourceFormat: 'MKV',
        targetFormat: 'MP4',
        sourceIcon: 'mdi:video',
        sourceAccept: '.mkv,video/x-matroska',
        category: 'Video Converter',
    },
    {
        path: '/tools/convert/avi-to-mp4',
        apiType: 'convert.avi_to_mp4',
        title: 'AVI to MP4 Converter',
        description: 'Convert AVI video files to MP4 format',
        sourceFormat: 'AVI',
        targetFormat: 'MP4',
        sourceIcon: 'mdi:video',
        sourceAccept: '.avi,video/x-msvideo',
        category: 'Video Converter',
    },
    {
        path: '/tools/convert/mp4-to-mp3',
        apiType: 'convert.mp4_to_mp3',
        title: 'MP4 to MP3 Converter',
        description: 'Extract audio from MP4 videos and save as MP3',
        sourceFormat: 'MP4',
        targetFormat: 'MP3',
        sourceIcon: 'mdi:video',
        sourceAccept: '.mp4,video/mp4',
        category: 'Video Converter',
        params: [
            {
                name: 'bitrate',
                label: 'Bitrate',
                type: 'select',
                required: false,
                options: [
                    { value: 'default', label: 'Default' },
                    { value: '96', label: '96 kbps' },
                    { value: '128', label: '128 kbps' },
                    { value: '160', label: '160 kbps' },
                    { value: '192', label: '192 kbps' },
                    { value: '256', label: '256 kbps' },
                    { value: '320', label: '320 kbps' },
                ],
                default: 'default',
                description: 'Audio bitrate quality',
            },
        ],
    },

    // Audio Converter Group
    {
        path: '/tools/convert/wav-to-mp3',
        apiType: 'convert.wav_to_mp3',
        title: 'WAV to MP3 Converter',
        description: 'Convert WAV audio files to MP3 format',
        sourceFormat: 'WAV',
        targetFormat: 'MP3',
        sourceIcon: 'mdi:music',
        sourceAccept: '.wav,audio/wav',
        category: 'Audio Converter',
    },
    {
        path: '/tools/convert/flac-to-mp3',
        apiType: 'convert.flac_to_mp3',
        title: 'FLAC to MP3 Converter',
        description: 'Convert FLAC audio files to MP3 format',
        sourceFormat: 'FLAC',
        targetFormat: 'MP3',
        sourceIcon: 'mdi:music',
        sourceAccept: '.flac,audio/flac',
        category: 'Audio Converter',
    },
    {
        path: '/tools/convert/mp3-to-wav',
        apiType: 'convert.mp3_to_wav',
        title: 'MP3 to WAV Converter',
        description: 'Convert MP3 audio files to WAV format',
        sourceFormat: 'MP3',
        targetFormat: 'WAV',
        sourceIcon: 'mdi:music',
        sourceAccept: '.mp3,audio/mpeg',
        category: 'Audio Converter',
    },

    // Subtitles Converter Group
    {
        path: '/tools/convert/srt-to-csv',
        apiType: 'convert.srt_to_csv',
        title: 'SRT to CSV Converter',
        description: 'Convert SRT subtitle files to CSV format',
        sourceFormat: 'SRT',
        targetFormat: 'CSV',
        sourceIcon: 'mingcute:subtitle-line',
        sourceAccept: '.srt,application/x-subrip',
        category: 'Subtitles Converter',
    },
    {
        path: '/tools/convert/srt-to-excel',
        apiType: 'convert.srt_to_excel',
        title: 'SRT to Excel Converter',
        description: 'Convert SRT subtitle files to Excel format',
        sourceFormat: 'SRT',
        targetFormat: 'Excel',
        sourceIcon: 'mingcute:subtitle-line',
        sourceAccept: '.srt,application/x-subrip',
        category: 'Subtitles Converter',
    },
    {
        path: '/tools/convert/srt-to-text',
        apiType: 'convert.srt_to_text',
        title: 'SRT to Text Converter',
        description: 'Extract text from SRT subtitle files',
        sourceFormat: 'SRT',
        targetFormat: 'Text',
        sourceIcon: 'mingcute:subtitle-line',
        sourceAccept: '.srt,application/x-subrip',
        category: 'Subtitles Converter',
    },
    {
        path: '/tools/convert/csv-to-srt',
        apiType: 'convert.csv_to_srt',
        title: 'CSV to SRT Converter',
        description: 'Convert CSV files to SRT subtitle format',
        sourceFormat: 'CSV',
        targetFormat: 'SRT',
        sourceIcon: 'mdi:file-delimited',
        sourceAccept: '.csv,text/csv',
        category: 'Subtitles Converter',
    },
    {
        path: '/tools/convert/excel-to-srt',
        apiType: 'convert.excel_to_srt',
        title: 'Excel to SRT Converter',
        description: 'Convert Excel files to SRT subtitle format',
        sourceFormat: 'Excel',
        targetFormat: 'SRT',
        sourceIcon: 'mdi:microsoft-excel',
        sourceAccept:
            '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
        category: 'Subtitles Converter',
    },

    // eBook Converter Group
    {
        path: '/tools/convert/epub-to-pdf',
        apiType: 'convert.epub_to_pdf',
        title: 'ePUB to PDF Converter',
        description: 'Convert ePUB eBooks to PDF format',
        sourceFormat: 'ePUB',
        targetFormat: 'PDF',
        sourceIcon: 'mdi:book',
        sourceAccept: '.epub,application/epub+zip',
        category: 'eBook Converter',
    },
    {
        path: '/tools/convert/epub-to-mobi',
        apiType: 'convert.epub_to_mobi',
        title: 'ePUB to MOBI Converter',
        description: 'Convert ePUB eBooks to MOBI format (Kindle)',
        sourceFormat: 'ePUB',
        targetFormat: 'MOBI',
        sourceIcon: 'mdi:book',
        sourceAccept: '.epub,application/epub+zip',
        category: 'eBook Converter',
    },
    {
        path: '/tools/convert/mobi-to-epub',
        apiType: 'convert.mobi_to_epub',
        title: 'MOBI to ePUB Converter',
        description: 'Convert MOBI eBooks (Kindle) to ePUB format',
        sourceFormat: 'MOBI',
        targetFormat: 'ePUB',
        sourceIcon: 'mdi:book',
        sourceAccept: '.mobi,application/x-mobipocket-ebook',
        category: 'eBook Converter',
    },
    {
        path: '/tools/convert/pdf-to-epub',
        apiType: 'convert.pdf_to_epub',
        title: 'PDF to ePUB Converter',
        description: 'Convert PDF documents to ePUB eBook format',
        sourceFormat: 'PDF',
        targetFormat: 'ePUB',
        sourceIcon: 'mdi:file-pdf-box',
        sourceAccept: '.pdf,application/pdf',
        category: 'eBook Converter',
    },
    {
        path: '/tools/convert/pdf-to-mobi',
        apiType: 'convert.pdf_to_mobi',
        title: 'PDF to MOBI Converter',
        description: 'Convert PDF documents to MOBI eBook format (Kindle)',
        sourceFormat: 'PDF',
        targetFormat: 'MOBI',
        sourceIcon: 'mdi:file-pdf-box',
        sourceAccept: '.pdf,application/pdf',
        category: 'eBook Converter',
    },
];
