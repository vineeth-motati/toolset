<template>
    <div
        class="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4"
    >
        <template v-if="!failed">
            <Icon
                icon="mdi:loading"
                class="w-8 h-8 animate-spin text-primary-500"
            />
            <p class="text-gray-500 dark:text-gray-400">Opening shared link…</p>
        </template>
        <template v-else>
            <Icon
                icon="mdi:link-variant-off"
                class="w-10 h-10 text-gray-400 dark:text-gray-500"
            />
            <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                This share link has expired or doesn't exist
            </h1>
            <p
                class="max-w-md text-sm text-center text-gray-500 dark:text-gray-400"
            >
                Memorable links expire after 90 days without being opened. Ask
                the sender for a fresh link.
            </p>
            <NuxtLink
                to="/"
                class="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
                Browse all tools
            </NuxtLink>
        </template>
    </div>
</template>

<script setup>
// Resolves a memorable share code (/s/swift-otter-lake) to its tool page.
// The tool itself re-fetches via ?alias= and runs the usual confirm-before-
// load flow — this page only figures out where to go.
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';

const route = useRoute();
const failed = ref(false);

onMounted(async () => {
    try {
        const { $axios } = useNuxtApp();
        const response = await $axios.get(`/api/aliases/${route.params.code}`);
        const tool = response.data?.tool;
        if (typeof tool === 'string' && tool.startsWith('/tools/')) {
            navigateTo(`${tool}?alias=${route.params.code}`, {
                replace: true,
            });
            return;
        }
        failed.value = true;
    } catch {
        failed.value = true;
    }
});
</script>
