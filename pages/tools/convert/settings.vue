<template>
    <ToolLayout
        title="Converter Settings"
        description="Manage API keys and conversion preferences"
        icon="tabler:settings"
    >
        <template #leading>
            <BaseIconButton
                icon="tabler:arrow-left"
                label="Back to converters"
                @click="goBack"
            />
        </template>

        <div>
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <!-- Left sidebar with settings navigation -->
                <div class="col-span-1">
                    <BaseCard padding="none">
                        <div class="p-4 border-b dark:border-gray-700">
                            <h2 class="font-medium text-gray-900 dark:text-gray-100">Settings</h2>
                        </div>
                        <div class="p-2">
                            <button
                                class="px-4 py-2 w-full text-left rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                                :class="{
                                    'bg-primary-50 text-primary-700 dark:bg-gray-700 dark:text-primary-400':
                                        activeTab === 'apikeys',
                                    'text-gray-700 dark:text-gray-300': activeTab !== 'apikeys',
                                }"
                                @click="activeTab = 'apikeys'"
                            >
                                <Icon
                                    icon="tabler:key"
                                    class="inline-block mr-2"
                                />
                                API Keys
                            </button>
                            <button
                                class="px-4 py-2 w-full text-left rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                                :class="{
                                    'bg-primary-50 text-primary-700 dark:bg-gray-700 dark:text-primary-400':
                                        activeTab === 'debug',
                                    'text-gray-700 dark:text-gray-300': activeTab !== 'debug',
                                }"
                                @click="activeTab = 'debug'"
                            >
                                <Icon
                                    icon="tabler:bug"
                                    class="inline-block mr-2"
                                />
                                Debug
                            </button>
                        </div>
                    </BaseCard>
                </div>

                <!-- Right content area -->
                <div class="col-span-1 lg:col-span-2">
                    <!-- API Keys Tab -->
                    <div v-if="activeTab === 'apikeys'">
                        <ApiKeyManager />
                    </div>

                    <!-- Debug Tab -->
                    <div v-if="activeTab === 'debug'">
                        <Debugger />
                    </div>
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
