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
            <div class="flex flex-col gap-4">
                <BaseCard>
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div class="sm:w-32 shrink-0">
                            <BaseSelect
                                v-model="api.method"
                                :options="methodOptions"
                                label="HTTP Method"
                            />
                        </div>
                        <div class="flex-1 min-w-0">
                            <BaseInput
                                v-model="api.endpoint"
                                label="Endpoint URL"
                                placeholder="Enter API URL (e.g., https://api.example.com)"
                                class="font-mono !text-[13px]"
                            />
                        </div>
                        <BaseButton
                            :loading="api.loading"
                            :disabled="api.loading || !api.endpoint"
                            @click="sendRequest"
                        >
                            {{ api.loading ? 'Sending...' : 'Send Request' }}
                        </BaseButton>
                    </div>
                </BaseCard>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <!-- Request Section -->
                    <BaseCard>
                        <h2 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
                            Request
                        </h2>

                        <div class="space-y-4">
                            <BaseSelect
                                v-model="api.contentType"
                                :options="contentTypeOptions"
                                label="Content Type"
                            />

                            <BaseSelect
                                v-model="api.auth.type"
                                :options="authTypeOptions"
                                label="Authorization"
                            />

                            <BaseInput
                                v-if="api.auth.type === 'Bearer'"
                                v-model="api.auth.token"
                                placeholder="Enter Bearer Token"
                            />
                            <div
                                v-if="api.auth.type === 'Basic'"
                                class="grid grid-cols-1 gap-4 sm:grid-cols-2"
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
                            />
                        </div>

                        <div class="pt-4 mt-4 border-t border-gray-200/80 dark:border-gray-700/70">
                            <BaseTextarea
                                v-model="api.headers"
                                label="Headers (JSON format)"
                                placeholder='e.g., {"Authorization": "Bearer token"}'
                                class="font-mono text-[13px]"
                                :rows="4"
                            />
                        </div>

                        <div
                            v-if="['POST', 'PUT', 'PATCH'].includes(api.method)"
                            class="pt-4 mt-4 border-t border-gray-200/80 dark:border-gray-700/70"
                        >
                            <BaseTextarea
                                v-model="api.body"
                                label="Body (JSON format)"
                                placeholder='e.g., {"key": "value"}'
                                class="font-mono text-[13px]"
                                :rows="5"
                            />
                        </div>
                    </BaseCard>

                    <!-- Response Section -->
                    <BaseCard>
                        <div class="flex items-center justify-between gap-3 mb-4">
                            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
                                Response
                            </h2>
                            <BaseBadge
                                v-if="api.response"
                                :variant="
                                    api.response.status >= 500
                                        ? 'danger'
                                        : api.response.status >= 400
                                          ? 'warning'
                                          : 'success'
                                "
                            >
                                {{ api.response.status }}
                            </BaseBadge>
                        </div>
                        <div v-if="api.response" key="response">
                            <div class="mb-4">
                                <h3 class="mb-1.5 eyebrow">Headers</h3>
                                <pre
                                    class="overflow-x-auto p-3 font-mono text-[13px] leading-6 surface-muted dark:text-gray-200"
                                    >{{
                                        JSON.stringify(api.response.headers, null, 2)
                                    }}</pre
                                >
                            </div>
                            <div v-if="api.response.isHtml">
                                <h3 class="mb-1.5 eyebrow">HTML Content</h3>
                                <div
                                    class="overflow-auto p-3 surface-muted dark:text-gray-200"
                                    v-html="sanitizedHtmlResponse"
                                ></div>
                            </div>
                            <div v-else>
                                <h3 class="mb-1.5 eyebrow">Body</h3>
                                <pre
                                    class="overflow-auto p-3 max-h-96 font-mono text-[13px] leading-6 surface-muted dark:text-gray-200"
                                    >{{
                                        JSON.stringify(api.response.data, null, 2)
                                    }}</pre
                                >
                            </div>
                        </div>
                        <div
                            v-else-if="api.error"
                            key="error"
                            class="px-4 py-3 text-sm text-red-800 bg-red-50 rounded-xl border border-red-200 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200"
                        >
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
import DOMPurify from 'isomorphic-dompurify';

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

const apiDefaults = {
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
};

// Volatile request state must never be persisted: a page closed mid-request
// would otherwise restore loading:true and leave Send disabled forever, and
// stale responses would reappear on reload.
const stripVolatile = (value) => ({
    ...value,
    response: null,
    error: null,
    loading: false,
});

const api = useLocalStorage('api', apiDefaults, {
    // Read storage only after mount: the server renders with defaults, so
    // hydrating against localStorage state would mismatch and leave stale
    // SSR attributes (e.g. a disabled Send button) in the DOM.
    initOnMounted: true,
    serializer: {
        read: (raw) => {
            try {
                return stripVolatile({ ...apiDefaults, ...JSON.parse(raw) });
            } catch {
                return { ...apiDefaults };
            }
        },
        write: (value) => JSON.stringify(stripVolatile(value)),
    },
});

// Sanitized HTML preview — raw v-html of an untrusted response is XSS.
const sanitizedHtmlResponse = computed(() =>
    api.value.response?.isHtml
        ? DOMPurify.sanitize(api.value.response.data)
        : ''
);

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
        // Never share credentials or response data — the payload is encoded
        // into the URL itself, so it ends up in address bars and history.
        const shareable = stripVolatile(api.value);
        shareable.auth = {
            ...apiDefaults.auth,
            type: api.value.auth.type,
        };
        const link = await generateShareLink('/tools/api', {
            api: shareable,
        });
        if (link) {
            await showShareModal(link);
            toast.info('Auth credentials are not included in shared links');
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
        Object.assign(api.value, stripVolatile(sharedData.api));
        toast.success('Loaded shared API state successfully!');
    }
});
</script>
