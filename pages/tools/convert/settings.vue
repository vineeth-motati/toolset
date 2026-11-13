<template>
    <ToolLayout
        title="Converter Settings"
        description="Manage API keys and conversion preferences"
        icon="lucide:settings"
    >

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div class="col-span-1">
                <BaseCard padding="none">
                    <div class="p-4 border-b border-gray-200/80 dark:border-gray-700/70">
                        <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Settings</h2>
                    </div>
                    <div class="p-2 flex flex-col gap-1">
                        <button
                            class="flex items-center gap-2 px-3 py-2 w-full text-left text-sm font-medium rounded-lg transition"
                            :class="
                                activeTab === 'apikeys'
                                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300'
                                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/40'
                            "
                            @click="activeTab = 'apikeys'"
                        >
                            <Icon icon="lucide:key-round" class="w-4 h-4" />
                            API Keys
                        </button>
                        <button
                            class="flex items-center gap-2 px-3 py-2 w-full text-left text-sm font-medium rounded-lg transition"
                            :class="
                                activeTab === 'debug'
                                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300'
                                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/40'
                            "
                            @click="activeTab = 'debug'"
                        >
                            <Icon icon="tabler:bug" class="w-4 h-4" />
                            Debug
                        </button>
                    </div>
                </BaseCard>
            </div>

            <div class="col-span-1 lg:col-span-2">
                <div v-if="activeTab === 'apikeys'">
                    <ApiKeyManager />
                </div>
                <div v-if="activeTab === 'debug'">
                    <Debugger />
                </div>
            </div>
        </div>
    </ToolLayout>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import ApiKeyManager from '@/components/convert/ApiKeyManager.vue';
import Debugger from '@/components/convert/Debugger.vue';

const router = useRouter();
const activeTab = ref('apikeys');

const goBack = () => {
    router.push('/tools/convert/');
};
</script>
