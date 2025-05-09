/**
 * Utility for interacting with the ConversionTools API
 * Based on the API documentation: https://conversiontools.io/api-documentation
 */

import converters from '@/config/converters';

const API_BASE_URL = 'https://api.conversiontools.io/v1';
const POLLING_INTERVAL = 2000; // 2 seconds
const FILE_SIZE_LIMIT = 100 * 1024 * 1024; // 100MB default size limit

/**
 * Handles file conversion using the ConversionTools API
 */
class ConverterApi {
    constructor(apiToken) {
        this.apiToken = apiToken;
        this.converters = converters;
        this.fileSizeLimit = FILE_SIZE_LIMIT;

        // Build conversion type map from converters config
        this.conversionTypeMap = {};
        this.converters.forEach((converter) => {
            this.conversionTypeMap[converter.path] = converter.apiType;
        });
    }

    /**
     * Get the API conversion type from our path
     */
    getConversionType(path) {
        return this.conversionTypeMap[path];
    }

    /**
     * Get the maximum file size allowed for upload
     * @returns {number} - The file size limit in bytes
     */
    getFileSizeLimit() {
        return this.fileSizeLimit;
    }

    /**
     * Get the formatted file size limit (e.g. "100MB")
     * @returns {string} - The formatted file size limit
     */
    getFormattedFileSizeLimit() {
        const sizeInMB = this.fileSizeLimit / (1024 * 1024);
        return `${sizeInMB}MB`;
    }

    /**
     * Step 1: Upload a file to the server
     * @param {File} file - The file to upload
     * @returns {Promise<string>} - The file ID
     */
    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE_URL}/files`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiToken}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            return data.file_id;
        } catch (error) {
            throw new Error(`File upload failed: ${error.message}`);
        }
    }

    /**
     * Step 2: Run conversion task
     * @param {string} conversionType - The conversion type
     * @param {Object} options - Task options
     * @returns {Promise<string>} - The task ID
     */
    async runConversionTask(conversionType, options) {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: conversionType,
                    options: options,
                }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            return data.task_id;
        } catch (error) {
            throw new Error(
                `Conversion task creation failed: ${error.message}`
            );
        }
    }

    /**
     * Step 3: Check conversion task status
     * @param {string} taskId - The task ID
     * @returns {Promise<{status: string, fileId: string|null, error: string|null}>} - The task status
     */
    async checkTaskStatus(taskId) {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            return {
                status: data.status,
                fileId: data.file_id,
                error: data.error,
            };
        } catch (error) {
            throw new Error(`Task status check failed: ${error.message}`);
        }
    }

    /**
     * Wait for task completion (polling)
     * @param {string} taskId - The task ID
     * @param {function} onProgress - Callback for progress updates
     * @returns {Promise<string>} - The file ID of the result
     */
    async waitForTaskCompletion(taskId, onProgress) {
        return new Promise((resolve, reject) => {
            const checkStatus = async () => {
                try {
                    const result = await this.checkTaskStatus(taskId);

                    if (result.error) {
                        reject(new Error(`Conversion failed: ${result.error}`));
                        return;
                    }

                    if (onProgress) {
                        onProgress(result.status);
                    }

                    switch (result.status) {
                        case 'SUCCESS':
                            resolve(result.fileId);
                            break;
                        case 'ERROR':
                            reject(new Error('Conversion task failed'));
                            break;
                        case 'PENDING':
                        case 'RUNNING':
                            // Continue polling
                            setTimeout(checkStatus, POLLING_INTERVAL);
                            break;
                        default:
                            reject(
                                new Error(
                                    `Unknown task status: ${result.status}`
                                )
                            );
                    }
                } catch (error) {
                    reject(error);
                }
            };

            // Start polling
            checkStatus();
        });
    }

    /**
     * Step 4: Download the result file
     * @param {string} fileId - The file ID
     * @returns {Promise<Blob>} - The file content as blob
     */
    async downloadFile(fileId) {
        try {
            const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${this.apiToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(
                    `Download failed with status: ${response.status}`
                );
            }

            return await response.blob();
        } catch (error) {
            throw new Error(`File download failed: ${error.message}`);
        }
    }

    /**
     * Complete conversion process
     * @param {string} converterPath - Path of the converter
     * @param {File} file - The file to convert
     * @param {Object} options - Additional conversion options
     * @param {function} onProgress - Callback for progress updates
     * @returns {Promise<{blob: Blob, filename: string}>} - The converted file
     */
    async convert(converterPath, file, options = {}, onProgress = null) {
        try {
            // Step 1: Get conversion type
            const conversionType = this.getConversionType(converterPath);
            if (!conversionType) {
                throw new Error(
                    `Unsupported conversion type for path: ${converterPath}`
                );
            }

            // Step 2: Upload file
            if (onProgress) onProgress('UPLOADING');
            const fileId = await this.uploadFile(file);

            // Step 3: Run conversion task
            if (onProgress) onProgress('PREPARING');
            const taskOptions = {
                file_id: fileId,
                ...options,
            };
            const taskId = await this.runConversionTask(
                conversionType,
                taskOptions
            );

            // Step 4: Wait for task completion
            const resultFileId = await this.waitForTaskCompletion(
                taskId,
                onProgress
            );

            // Step 5: Download the result
            if (onProgress) onProgress('DOWNLOADING');
            const blob = await this.downloadFile(resultFileId);

            // Generate a filename for the result based on the original filename and target format
            const originalExt = file.name.split('.').pop();
            const targetExt = this.getTargetExtension(conversionType);
            const filename = file.name.replace(
                `.${originalExt}`,
                `.${targetExt}`
            );

            return {
                blob,
                filename,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Convert using URL instead of file upload
     * @param {string} converterPath - Path of the converter
     * @param {string} url - The URL to convert
     * @param {Object} options - Additional conversion options
     * @param {function} onProgress - Callback for progress updates
     * @returns {Promise<{blob: Blob, filename: string}>} - The converted file
     */
    async convertUrl(converterPath, url, options = {}, onProgress = null) {
        try {
            // Step 1: Get conversion type
            const conversionType = this.getConversionType(converterPath);
            if (!conversionType) {
                throw new Error(
                    `Unsupported conversion type for path: ${converterPath}`
                );
            }

            // Step 2: Run conversion task with URL
            if (onProgress) onProgress('PREPARING');
            const taskOptions = {
                url: url,
                ...options,
            };
            const taskId = await this.runConversionTask(
                conversionType,
                taskOptions
            );

            // Step 3: Wait for task completion
            const resultFileId = await this.waitForTaskCompletion(
                taskId,
                onProgress
            );

            // Step 4: Download the result
            if (onProgress) onProgress('DOWNLOADING');
            const blob = await this.downloadFile(resultFileId);

            // Generate a filename for the result based on the URL and target format
            const urlFilename = new URL(url).hostname.replace(/\./g, '_');
            const targetExt = this.getTargetExtension(conversionType);
            const filename = `${urlFilename}.${targetExt}`;

            return {
                blob,
                filename,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get the target file extension based on conversion type
     * @param {string} conversionType - The conversion type
     * @returns {string} - The file extension
     */
    getTargetExtension(conversionType) {
        // Find the converter with this API type
        const converter = this.converters.find(
            (c) => c.apiType === conversionType
        );

        if (converter) {
            // Map target format to file extension
            const formatToExt = {
                PDF: 'pdf',
                JSON: 'json',
                XML: 'xml',
                CSV: 'csv',
                Excel: 'xlsx',
                Word: 'docx',
                HTML: 'html',
                YAML: 'yaml',
                Text: 'txt',
                JPG: 'jpg',
                JPEG: 'jpg',
                PNG: 'png',
                WebP: 'webp',
                MP4: 'mp4',
                MP3: 'mp3',
                WAV: 'wav',
                FLAC: 'flac',
                SRT: 'srt',
                ePUB: 'epub',
                MOBI: 'mobi',
                AZW: 'azw',
                AZW3: 'azw3',
                FB2: 'fb2',
                FBZ: 'fbz',
                HEIC: 'heic',
                GIF: 'gif',
                TIFF: 'tiff',
                BMP: 'bmp',
            };

            // Extract the base format (remove things like "(Searchable)")
            const baseFormat = converter.targetFormat.split(' ')[0];
            return formatToExt[baseFormat] || 'txt';
        }

        // Fallback to old mapping if converter not found
        const extensionMap = {
            'convert.xml_to_json': 'json',
            'convert.format_json': 'json',
            'convert.validate_json': 'json',
            'convert.json_to_xml': 'xml',
            'convert.json_to_csv': 'csv',
            'convert.json_to_excel': 'xlsx',
            'convert.excel_to_json': 'json',
            'convert.csv_to_json': 'json',
            'convert.yaml_to_json': 'json',
            'convert.json_to_yaml': 'yaml',
            'convert.csv_to_xml': 'xml',
            'convert.excel_to_xml': 'xml',
            'convert.xml_to_csv': 'csv',
            'convert.xml_to_excel': 'xlsx',
            'convert.fix_xml_escaping': 'xml',
            'convert.validate_xml_xsd': 'txt',
            'convert.html_table_to_csv': 'csv',
            'convert.excel_to_csv': 'csv',
            'convert.csv_to_excel': 'xlsx',
            'convert.pdf_to_csv': 'csv',
            'convert.website_to_pdf': 'pdf',
            'convert.word_to_pdf': 'pdf',
            'convert.powerpoint_to_pdf': 'pdf',
            'convert.jpg_to_pdf': 'pdf',
            'convert.png_to_pdf': 'pdf',
            'convert.excel_to_pdf': 'pdf',
            'convert.pdf_to_jpg': 'jpg',
            'convert.pdf_to_png': 'png',
            'convert.pdf_to_html': 'html',
            'convert.pdf_to_text': 'txt',
            'convert.png_to_webp': 'webp',
            'convert.jpg_to_webp': 'webp',
            'convert.webp_to_png': 'png',
            'convert.webp_to_jpg': 'jpg',
            'convert.png_to_jpg': 'jpg',
            'convert.jpg_to_png': 'png',
            'convert.heic_to_png': 'png',
            'convert.heic_to_jpg': 'jpg',
            'convert.ocr_png_to_text': 'txt',
            'convert.ocr_jpg_to_text': 'txt',
            'convert.ocr_png_to_pdf': 'pdf',
            'convert.ocr_jpg_to_pdf': 'pdf',
            'convert.ocr_pdf_to_text': 'txt',
            'convert.website_to_pdf': 'pdf',
            'convert.website_to_jpg': 'jpg',
            'convert.website_to_png': 'png',
            'convert.html_to_jpg': 'jpg',
            'convert.html_to_png': 'png',
            'convert.word_to_html': 'html',
            'convert.excel_to_html': 'html',
            'convert.mov_to_mp4': 'mp4',
            'convert.mkv_to_mp4': 'mp4',
            'convert.avi_to_mp4': 'mp4',
            'convert.mp4_to_mp3': 'mp3',
            'convert.wav_to_mp3': 'mp3',
            'convert.flac_to_mp3': 'mp3',
            'convert.mp3_to_wav': 'wav',
            'convert.srt_to_csv': 'csv',
            'convert.srt_to_excel': 'xlsx',
            'convert.srt_to_text': 'txt',
            'convert.csv_to_srt': 'srt',
            'convert.excel_to_srt': 'srt',
            'convert.epub_to_pdf': 'pdf',
            'convert.epub_to_mobi': 'mobi',
            'convert.mobi_to_epub': 'epub',
            'convert.pdf_to_epub': 'epub',
            'convert.pdf_to_mobi': 'mobi',
        };

        return extensionMap[conversionType] || 'txt';
    }
}

export default ConverterApi;
