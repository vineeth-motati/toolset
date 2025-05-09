import { ref, reactive } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import ConverterApi from '@/utils/converterApi';

export function useConverter() {
    // Store API key in local storage
    const apiKey = useLocalStorage('converter_api_key', '');
    const hasApiKey = () => !!apiKey.value;

    // Conversion state
    const state = reactive({
        isConverting: false,
        progress: null,
        error: null,
        result: null,
    });

    // Save API key
    const saveApiKey = (key) => {
        apiKey.value = key;
    };

    // Clear API key
    const clearApiKey = () => {
        apiKey.value = '';
    };

    // Get API instance
    const getApiInstance = () => {
        if (!hasApiKey()) {
            throw new Error('API key not set');
        }
        return new ConverterApi(apiKey.value);
    };

    // Get file size limit
    const getFileSizeLimit = () => {
        try {
            const api = getApiInstance();
            return api.getFormattedFileSizeLimit();
        } catch (error) {
            return '100MB'; // Fallback value
        }
    };

    // Convert file
    const convertFile = async (converterPath, file, options = {}) => {
        state.isConverting = true;
        state.progress = 'STARTING';
        state.error = null;
        state.result = null;

        try {
            const api = getApiInstance();

            const handleProgress = (progress) => {
                state.progress = progress;
            };

            const result = await api.convert(
                converterPath,
                file,
                options,
                handleProgress
            );
            state.result = result;
            state.progress = 'COMPLETE';
            return result;
        } catch (error) {
            state.error = error.message;
            state.progress = 'ERROR';
            throw error;
        } finally {
            state.isConverting = false;
        }
    };

    // Convert URL
    const convertUrl = async (converterPath, url, options = {}) => {
        state.isConverting = true;
        state.progress = 'STARTING';
        state.error = null;
        state.result = null;

        try {
            const api = getApiInstance();

            const handleProgress = (progress) => {
                state.progress = progress;
            };

            const result = await api.convertUrl(
                converterPath,
                url,
                options,
                handleProgress
            );
            state.result = result;
            state.progress = 'COMPLETE';
            return result;
        } catch (error) {
            state.error = error.message;
            state.progress = 'ERROR';
            throw error;
        } finally {
            state.isConverting = false;
        }
    };

    // Download the result
    const downloadResult = () => {
        if (!state.result) return;

        const { blob, filename } = state.result;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return {
        apiKey,
        hasApiKey,
        saveApiKey,
        clearApiKey,
        convertFile,
        convertUrl,
        downloadResult,
        getFileSizeLimit,
        state,
    };
}
