<template>
    <div class="mx-auto max-w-6xl">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold">API Tester</h1>
                <p class="text-gray-600">
                    Interact with APIs, test endpoints, and debug HTTP requests.
                </p>
            </div>
            <div class="flex gap-2">
                <button
                    @click="openCurlModal"
                    class="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                    Import from cURL
                </button>
                <button
                    @click="shareApi"
                    class="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                >
                    Share API
                </button>
            </div>
        </div>

        <!-- Main Layout -->
        <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
            <!-- Request Section -->
            <div class="p-6 bg-white rounded-lg shadow-lg">
                <h2 class="mb-4 text-lg font-semibold">Request</h2>
                <div class="mb-4">
                    <label class="block mb-2 text-sm font-medium text-gray-700"
                        >Endpoint URL</label
                    >
                    <input
                        v-model="api.endpoint"
                        type="text"
                        class="px-3 py-2 w-full rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter API URL (e.g., https://api.example.com)"
                    />
                </div>

                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label
                            class="block mb-2 text-sm font-medium text-gray-700"
                            >HTTP Method</label
                        >
                        <select
                            v-model="api.method"
                            class="px-3 py-2 w-full rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                            <option value="PATCH">PATCH</option>
                        </select>
                    </div>
                    <div>
                        <label
                            class="block mb-2 text-sm font-medium text-gray-700"
                            >Content Type</label
                        >
                        <select
                            v-model="api.contentType"
                            class="px-3 py-2 w-full rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="application/json">JSON</option>
                            <option value="application/x-www-form-urlencoded">
                                Form URL Encoded
                            </option>
                            <option value="text/plain">Plain Text</option>
                        </select>
                    </div>
                </div>

                <!-- Authorization Section -->
                <div class="mb-4">
                    <label class="block mb-2 text-sm font-medium text-gray-700"
                        >Authorization</label
                    >
                    <select
                        v-model="api.auth.type"
                        class="px-3 py-2 w-full rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">None</option>
                        <option value="Bearer">Bearer Token</option>
                        <option value="Basic">Basic Auth</option>
                        <option value="Custom">Custom Header</option>
                    </select>
                </div>

                <div v-if="api.auth.type === 'Bearer'" class="mb-4">
                    <input
                        v-model="api.auth.token"
                        type="text"
                        class="px-3 py-2 w-full rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter Bearer Token"
                    />
                </div>
                <div
                    v-if="api.auth.type === 'Basic'"
                    class="grid grid-cols-2 gap-4 mb-4"
                >
                    <input
                        v-model="api.auth.username"
                        type="text"
                        class="px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Username"
                    />
                    <input
                        v-model="api.auth.password"
                        type="password"
                        class="px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Password"
                    />
                </div>
                <div v-if="api.auth.type === 'Custom'" class="mb-4">
                    <input
                        v-model="api.auth.customHeader"
                        type="text"
                        class="px-3 py-2 w-full rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder='Enter Custom Header (e.g., "X-API-Key: key")'
                    />
                </div>

                <div class="mb-4">
                    <label class="block mb-2 text-sm font-medium text-gray-700"
                        >Headers (JSON format)</label
                    >
                    <textarea
                        v-model="api.headers"
                        class="px-3 py-2 w-full h-24 font-mono rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder='e.g., {"Authorization": "Bearer token"}'
                    ></textarea>
                </div>

                <div
                    class="mb-4"
                    v-if="['POST', 'PUT', 'PATCH'].includes(api.method)"
                >
                    <label class="block mb-2 text-sm font-medium text-gray-700"
                        >Body (JSON format)</label
                    >
                    <textarea
                        v-model="api.body"
                        class="px-3 py-2 w-full h-32 font-mono rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder='e.g., {"key": "value"}'
                    ></textarea>
                </div>

                <button
                    @click="sendRequest"
                    :disabled="api.loading || !api.endpoint"
                    class="px-4 py-2 text-white bg-green-600 rounded-lg transition-colors hover:bg-green-700"
                >
                    {{ api.loading ? 'Sending...' : 'Send Request' }}
                </button>
            </div>

            <!-- Response Section -->
            <div class="p-6 bg-white rounded-lg shadow-lg">
                <h2 class="mb-4 text-lg font-semibold">Response</h2>
                <div v-if="api.response">
                    <div class="mb-2 text-sm text-gray-500">
                        <span class="font-bold">Status:</span>
                        {{ api.response.status }}
                    </div>
                    <div class="mb-4">
                        <h3 class="mb-1 font-medium">Headers:</h3>
                        <pre
                            class="overflow-x-auto p-3 font-mono text-sm bg-gray-100 rounded-lg"
                            >{{
                                JSON.stringify(api.response.headers, null, 2)
                            }}</pre
                        >
                    </div>
                    <div v-if="api.response.isHtml">
                        <h3 class="mb-1 font-medium">HTML Content:</h3>
                        <div
                            class="overflow-auto p-3 bg-gray-100 rounded-lg"
                            v-html="api.response.data"
                        ></div>
                    </div>
                    <div v-else>
                        <h3 class="mb-1 font-medium">Body:</h3>
                        <pre
                            class="overflow-auto p-3 max-h-96 font-mono text-sm bg-gray-100 rounded-lg"
                            >{{
                                JSON.stringify(api.response.data, null, 2)
                            }}</pre
                        >
                    </div>
                </div>
                <div v-else-if="api.error" class="text-red-600">
                    {{ api.error }}
                </div>
                <div v-else>
                    <p class="text-gray-600">
                        {{ api.loading ? 'Sending request...' : 'No response' }}
                    </p>
                </div>
            </div>
        </div>

        <UiModal
            :isOpen="isCurlModalOpen"
            title="Import cURL Command"
            @close="closeCurlModal"
            @confirm="importCurl"
        >
            <div>
                <label class="block mb-2 text-sm font-medium text-gray-700">
                    Paste cURL Command
                </label>
                <textarea
                    v-model="curlCommand"
                    class="px-3 py-2 w-full h-24 font-mono rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Paste cURL command here"
                ></textarea>
            </div>
        </UiModal>
    </div>
</template>

<script setup>
import { useLocalStorage } from '@vueuse/core';

const { generateShareLink, getSharedData } = useShareLink();
const { $axios } = useNuxtApp();
const toast = useToast();

const api = useLocalStorage('api', {
    endpoint: '',
    method: 'GET',
    contentType: 'application/json',
    headers: '{}',
    body: '{}',
    response: null,
    error: null,
    loading: false,
    auth: {
        type: '', // None, Bearer, Basic, Custom
        token: '',
        username: '',
        password: '',
        customHeader: '',
    },
});

let isCurlModalOpen = ref(false);
let curlCommand = ref('');

const openCurlModal = () => {
    isCurlModalOpen.value = true;
};

const closeCurlModal = () => {
    isCurlModalOpen.value = false;
};

const parseCurlCommand = (curl) => {
    const args = curl.match(/(?:[^\s"]+|"[^"]*")+/g);
    if (!args || args[0] !== 'curl') {
        throw new Error('Invalid cURL command.');
    }

    let endpoint = '';
    let method = 'GET'; // Default to GET
    const headers = {};
    let body = null;

    for (let i = 1; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '-X': // HTTP method
                method = args[++i].toUpperCase();
                break;
            case '-H': // Header
                const header = args[++i].replace(/^['"]|['"]$/g, '');
                const [key, value] = header.split(/:\s*/);
                if (key && value) {
                    headers[key] = value;
                }
                break;
            case '-d': // Data/Body
                const data = args[++i].replace(/^['"]|['"]$/g, '');
                try {
                    body = JSON.parse(data);
                } catch {
                    body = data;
                }
                break;
            default:
                if (!arg.startsWith('-') && !endpoint) {
                    endpoint = arg.replace(/^['"]|['"]$/g, '');
                }
        }
    }

    if (!endpoint) {
        throw new Error('No URL found in the cURL command.');
    }

    return {
        endpoint,
        method,
        headers,
        body,
    };
};

const importCurl = () => {
    try {
        const parsedCurl = parseCurlCommand(curlCommand.value);

        if (parsedCurl) {
            api.value.endpoint = parsedCurl.endpoint;
            api.value.method = parsedCurl.method;
            api.value.headers = JSON.stringify(parsedCurl.headers, null, 2);
            api.value.body = parsedCurl.body
                ? JSON.stringify(parsedCurl.body, null, 2)
                : '';
            toast.success('cURL imported successfully!');
        } else {
            toast.error('Failed to parse cURL command.');
        }
    } catch (error) {
        toast.error('Error parsing cURL command: ' + error.message);
    } finally {
        closeCurlModal();
    }
};

const sendRequest = async () => {
    try {
        api.value.loading = true;
        api.value.response = null;
        api.value.error = null;

        // Parse Headers
        const parsedHeaders = JSON.parse(api.value.headers || '{}');

        // Check if Authorization header is already present in Headers field
        const hasAuthorizationHeader = Object.keys(parsedHeaders).some(
            (key) => key.toLowerCase() === 'authorization'
        );

        // Add Authorization Header if not already specified in the Headers field
        if (!hasAuthorizationHeader) {
            if (api.value.auth.type === 'Bearer') {
                parsedHeaders['Authorization'] =
                    `Bearer ${api.value.auth.token}`;
            } else if (api.value.auth.type === 'Basic') {
                const credentials = btoa(
                    `${api.value.auth.username}:${api.value.auth.password}`
                );
                parsedHeaders['Authorization'] = `Basic ${credentials}`;
            } else if (api.value.auth.type === 'Custom') {
                const [headerName, headerValue] = api.value.auth.customHeader
                    .split(':')
                    .map((s) => s.trim());
                if (headerName && headerValue) {
                    parsedHeaders[headerName] = headerValue;
                }
            }
        }

        // Parse Body
        const parsedBody =
            ['POST', 'PUT', 'PATCH'].includes(api.value.method) &&
            api.value.body
                ? JSON.parse(api.value.body || '{}')
                : undefined;

        // Make the Request
        const res = await $axios({
            url: api.value.endpoint,
            method: api.value.method,
            headers: {
                'Content-Type': api.value.contentType,
                ...parsedHeaders,
            },
            data: parsedBody,
        });

        // Handle Response
        const contentType = res.headers['content-type'];
        api.value.response = {
            status: res.status,
            headers: res.headers,
            data:
                contentType && contentType.includes('text/html')
                    ? res.data // HTML data
                    : res.data, // JSON or other types
            isHtml: contentType && contentType.includes('text/html'),
        };
    } catch (err) {
        api.value.error =
            err.response?.data?.message ||
            err.message ||
            'An error occurred while making the request.';
    } finally {
        api.value.loading = false;
    }
};

const shareApi = async () => {
    try {
        const link = await generateShareLink('/tools/api', {
            api: api.value,
        });
        if (link) {
            await navigator.clipboard.writeText(link);
            toast.success('Share link copied to clipboard!');
        } else {
            toast.error('Failed to generate share link.');
        }
    } catch (error) {
        toast.error('An error occurred while sharing the state.');
    }
};

onMounted(async () => {
    const sharedData = await getSharedData();
    if (sharedData?.api) {
        Object.assign(api.value, sharedData.api);
        toast.success('Loaded shared API state successfully!');
    }
});
</script>
