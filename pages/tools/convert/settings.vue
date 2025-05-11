<template>
    <div class="h-[85vh] flex flex-col">
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
                <button
                    @click="goBack"
                    class="p-2 mr-3 text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200"
                    title="Back to converters"
                >
                    <Icon icon="tabler:arrow-left" class="text-xl" />
                </button>
                <div>
                    <h1 class="text-2xl font-bold">Converter Settings</h1>
                    <p class="text-gray-600">
                        Manage API keys and conversion preferences
                    </p>
                </div>
            </div>
        </div>

        <div class="flex-1 overflow-auto">
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <!-- Left sidebar with settings navigation -->
                <div class="col-span-1">
                    <div class="bg-white rounded-lg shadow">
                        <div class="p-4 border-b">
                            <h2 class="font-medium">Settings</h2>
                        </div>
                        <div class="p-2">
                            <button
                                class="w-full px-4 py-2 text-left rounded-md hover:bg-gray-50"
                                :class="{
                                    'bg-blue-50 text-blue-700':
                                        activeTab === 'apikeys',
                                    'text-gray-700': activeTab !== 'apikeys',
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
                                class="w-full px-4 py-2 text-left rounded-md hover:bg-gray-50"
                                :class="{
                                    'bg-blue-50 text-blue-700':
                                        activeTab === 'debug',
                                    'text-gray-700': activeTab !== 'debug',
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
                    </div>
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
    </div>
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
