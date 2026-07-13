<template>
    <ToolLayout>
        <template #actions>
            <BaseButton
                variant="secondary"
                icon="mdi:import"
                size="sm"
                @click="openCurlModal"
            >
                Import from cURL
            </BaseButton>
            <BaseButton
                variant="secondary"
                icon="mdi:share-variant"
                size="sm"
                @click="shareApi"
            >
                Share API
            </BaseButton>
        </template>

        <div class="mx-auto max-w-6xl">
            <!-- Main Layout -->
            <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
                <!-- Request Section -->
                <BaseCard>
                    <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Request
                    </h2>

                    <BaseInput
                        v-model="api.endpoint"
                        label="Endpoint URL"
                        placeholder="Enter API URL (e.g., https://api.example.com)"
                    />

                    <div class="grid grid-cols-2 gap-4 mt-4">
                        <BaseSelect
                            v-model="api.method"
                            :options="methodOptions"
                            label="HTTP Method"
                        />
                        <BaseSelect
                            v-model="api.contentType"
                            :options="contentTypeOptions"
                            label="Content Type"
                        />
                    </div>

                    <!-- Authorization Section -->
                    <BaseSelect
                        v-model="api.auth.type"
                        :options="authTypeOptions"
                        label="Authorization"
                        class="mt-4"
                    />

                    <BaseInput
                        v-if="api.auth.type === 'Bearer'"
                        v-model="api.auth.token"
                        placeholder="Enter Bearer Token"
                        class="mt-4"
                    />
                    <div
                        v-if="api.auth.type === 'Basic'"
                        class="grid grid-cols-2 gap-4 mt-4"
                    >
                        <BaseInput
                            v-model="api.auth.username"
                            placeholder="Username"
                        />
                        <BaseInput
                            v-model="api.auth.password"
                            type="password"
                            placeholder="Password"
                        />
                    </div>
                    <BaseInput
                        v-if="api.auth.type === 'Custom'"
                        v-model="api.auth.customHeader"
                        placeholder='Enter Custom Header (e.g., "X-API-Key: key")'
                        class="mt-4"
                    />

                    <BaseTextarea
                        v-model="api.headers"
                        label="Headers (JSON format)"
                        placeholder='e.g., {"Authorization": "Bearer token"}'
                        class="mt-4 font-mono"
                        :rows="4"
                    />

                    <BaseTextarea
                        v-if="['POST', 'PUT', 'PATCH'].includes(api.method)"
                        v-model="api.body"
                        label="Body (JSON format)"
                        placeholder='e.g., {"key": "value"}'
                        class="mt-4 font-mono"
                        :rows="5"
                    />

                    <BaseButton
                        class="mt-4"
                        :loading="api.loading"
                        :disabled="api.loading || !api.endpoint"
                        @click="sendRequest"
                    >
                        {{ api.loading ? 'Sending...' : 'Send Request' }}
                    </BaseButton>
                </BaseCard>

                <!-- Response Section -->
                <BaseCard>
                    <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Response
                    </h2>
                    <div v-if="api.response" key="response">
                        <div class="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span class="font-bold">Status:</span>
                            {{ api.response.status }}
                        </div>
                        <div class="mb-4">
                            <h3 class="mb-1 font-medium text-gray-900 dark:text-gray-100">Headers:</h3>
                            <pre
                                class="overflow-x-auto p-3 font-mono text-sm bg-gray-100 rounded-lg dark:bg-gray-900 dark:text-gray-200"
                                >{{
                                    JSON.stringify(api.response.headers, null, 2)
                                }}</pre
                            >
                        </div>
                        <div v-if="api.response.isHtml">
                            <h3 class="mb-1 font-medium text-gray-900 dark:text-gray-100">HTML Content:</h3>
                            <div
                                class="overflow-auto p-3 bg-gray-100 rounded-lg dark:bg-gray-900 dark:text-gray-200"
                                v-html="api.response.data"
                            ></div>
                        </div>
                        <div v-else>
                            <h3 class="mb-1 font-medium text-gray-900 dark:text-gray-100">Body:</h3>
                            <pre
                                class="overflow-auto p-3 max-h-96 font-mono text-sm bg-gray-100 rounded-lg dark:bg-gray-900 dark:text-gray-200"
                                >{{
                                    JSON.stringify(api.response.data, null, 2)
                                }}</pre
                            >
                        </div>
                    </div>
                    <div v-else-if="api.error" key="error" class="text-red-600 dark:text-red-400">
                        {{ api.error }}
                    </div>
                    <BaseEmptyState
                        v-else
                        key="empty"
                        icon="mdi:api"
                        :title="api.loading ? 'Sending request...' : 'No response'"
                        description="Send a request to see the response here."
                    />
                </BaseCard>
            </div>
        </div>

        <UiModal
            :isOpen="isCurlModalOpen"
            title="Import cURL Command"
            @close="closeCurlModal"
            @confirm="importCurl"
        >
            <BaseTextarea
                v-model="curlCommand"
                label="Paste cURL Command"
                placeholder="Paste cURL command here"
                class="font-mono"
                :rows="4"
            />
        </UiModal>
    </ToolLayout>
</template>

<script setup>
import { useLocalStorage } from '@vueuse/core';

const { generateShareLink, getSharedData } = useShareLink();
const { $axios } = useNuxtApp();
const toast = useToast();

const methodOptions = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const contentTypeOptions = [
    { label: 'JSON', value: 'application/json' },
    { label: 'Form URL Encoded', value: 'application/x-www-form-urlencoded' },
    { label: 'Plain Text', value: 'text/plain' },
];
const authTypeOptions = [
    { label: 'None', value: '' },
    { label: 'Bearer Token', value: 'Bearer' },
    { label: 'Basic Auth', value: 'Basic' },
    { label: 'Custom Header', value: 'Custom' },
];

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
