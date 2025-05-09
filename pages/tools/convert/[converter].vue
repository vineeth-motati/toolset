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
                <div v-if="currentConverter">
                    <h1 class="text-2xl font-bold">
                        {{ currentConverter.title }}
                    </h1>
                    <p class="text-gray-600">
                        {{ currentConverter.description }}
                    </p>
                </div>
                <div v-else>
                    <h1 class="text-2xl font-bold">Converter Not Found</h1>
                    <p class="text-gray-600">
                        The requested converter could not be found
                    </p>
                </div>
            </div>
            <div class="flex gap-2" v-if="currentConverter">
                <button
                    @click="navigateToSettings"
                    class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                    <Icon icon="tabler:settings" class="inline-block mr-1" />
                    Settings
                </button>
            </div>
        </div>

        <div v-if="currentConverter" class="flex-1 overflow-auto">
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
                <!-- Left sidebar with related converters -->
                <div class="col-span-1">
                    <div class="bg-white rounded-lg shadow">
                        <div class="p-4 border-b">
                            <h2 class="font-medium">More Converters</h2>
                        </div>
                        <div class="p-2 max-h-[65vh] overflow-auto">
                            <div v-if="relatedConverters.length > 0">
                                <div
                                    v-for="converter in relatedConverters"
                                    :key="converter.path"
                                    class="mb-1"
                                >
                                    <button
                                        @click="navigateToConverter(converter)"
                                        :class="[
                                            'w-full px-4 py-2 text-left rounded-md hover:bg-blue-50',
                                            converter.path === $route.path
                                                ? 'text-blue-700 bg-blue-50'
                                                : 'text-gray-700',
                                        ]"
                                    >
                                        <Icon
                                            :icon="converter.sourceIcon"
                                            class="inline-block mr-2"
                                        />
                                        <span class="text-sm"
                                            >{{ converter.sourceFormat }} to
                                            {{ converter.targetFormat }}</span
                                        >
                                    </button>
                                </div>
                            </div>
                            <div v-else class="px-4 py-3 text-sm text-gray-500">
                                No related converters found
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right content area with converter -->
                <div class="col-span-1 lg:col-span-3">
                    <BaseConverter
                        :title="currentConverter.title"
                        :description="currentConverter.description"
                        :sourceFormat="currentConverter.sourceFormat"
                        :targetFormat="currentConverter.targetFormat"
                        :sourceIcon="currentConverter.sourceIcon"
                        :sourceAccept="currentConverter.sourceAccept"
                        :params="currentConverter.params"
                        :showSidebar="false"
                    >
                        <template
                            #options
                            v-if="
                                currentConverter.params &&
                                currentConverter.params.length > 0
                            "
                        >
                            <div
                                v-for="param in currentConverter.params"
                                :key="param.name"
                                class="mb-3"
                            >
                                <label
                                    class="block mb-1 text-sm font-medium text-gray-700"
                                >
                                    {{ param.label }}
                                    <span
                                        v-if="param.required"
                                        class="text-red-500 text-xs ml-1"
                                        >(required)</span
                                    >
                                    <span
                                        v-else
                                        class="text-gray-500 text-xs ml-1"
                                        >(optional)</span
                                    >
                                </label>

                                <!-- Select input for options -->
                                <select
                                    v-if="param.type === 'select'"
                                    v-model="paramValues[param.name]"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option
                                        v-for="option in param.options"
                                        :key="option.value"
                                        :value="option.value"
                                    >
                                        {{ option.label }}
                                    </option>
                                </select>

                                <!-- Number input -->
                                <input
                                    v-else-if="param.type === 'number'"
                                    v-model="paramValues[param.name]"
                                    type="number"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    :placeholder="param.placeholder || ''"
                                />

                                <!-- Default text input -->
                                <input
                                    v-else
                                    v-model="paramValues[param.name]"
                                    type="text"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    :placeholder="param.placeholder || ''"
                                />

                                <p
                                    v-if="param.description"
                                    class="mt-1 text-xs text-gray-500"
                                >
                                    {{ param.description }}
                                </p>
                            </div>
                        </template>
                    </BaseConverter>
                </div>
            </div>
        </div>

        <div v-else class="flex flex-col items-center justify-center flex-1">
            <p class="text-xl text-gray-500">Converter not found</p>
            <p class="text-gray-500">
                Path: {{ `/tools/convert/${converterType}` }}
            </p>
            <button
                @click="goBack"
                class="px-4 py-2 mt-4 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
                Back to converters
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import converterConfig from '@/config/converters';
import BaseConverter from '@/components/convert/BaseConverter.vue';
import { Icon } from '@iconify/vue';

const route = useRoute();
const router = useRouter();
const converterType = computed(() => route.params.converter);
const currentConverter = ref(null);

// Store parameter values
const paramValues = reactive({});

// Find related converters (converters in the same category)
const relatedConverters = computed(() => {
    if (!currentConverter.value) return [];

    return converterConfig
        .filter((c) => c.category === currentConverter.value.category)
        .filter((c) => c.path !== currentConverter.value.path)
        .slice(0, 10); // Limit to 10 related converters
});

onMounted(() => {
    // Find the converter configuration based on the path
    const path = `/tools/convert/${converterType.value}`;
    console.log('Looking for converter with path:', path);

    const config = converterConfig.find((item) => item.path === path);

    if (config) {
        currentConverter.value = config;
        console.log('Found converter:', config.title);

        // Initialize parameter values with defaults
        if (config.params && config.params.length > 0) {
            config.params.forEach((param) => {
                if (param.default) {
                    paramValues[param.name] = param.default;
                }
            });
        }
    } else {
        console.error('Converter not found for path:', path);
    }
});

const goBack = () => {
    router.push('/tools/convert/');
};

const navigateToSettings = () => {
    router.push('/tools/convert/settings');
};

const navigateToConverter = (converter) => {
    router.push(converter.path);
};
</script>
