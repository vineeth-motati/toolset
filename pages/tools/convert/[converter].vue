<template>
    <div class="h-[85vh] flex flex-col">
        <div class="flex justify-between items-center mb-4">
            <div class="flex items-center">
                <BaseIconButton
                    icon="tabler:arrow-left"
                    label="Back to converters"
                    @click="goBack"
                    class="mr-3"
                />
                <div v-if="currentConverter">
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {{ currentConverter.title }}
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400">
                        {{ currentConverter.description }}
                    </p>
                </div>
                <div v-else>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Converter Not Found</h1>
                    <p class="text-gray-600 dark:text-gray-400">
                        The requested converter could not be found
                    </p>
                </div>
            </div>
            <div class="flex gap-2" v-if="currentConverter">
                <BaseButton
                    variant="secondary"
                    icon="tabler:settings"
                    size="sm"
                    @click="navigateToSettings"
                >
                    Settings
                </BaseButton>
            </div>
        </div>

        <div v-if="currentConverter" class="overflow-auto flex-1">
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
                <!-- Left sidebar with related converters -->
                <div class="col-span-1">
                    <BaseCard padding="none">
                        <div class="p-4 border-b dark:border-gray-700">
                            <h2 class="font-medium text-gray-900 dark:text-gray-100">More Converters</h2>
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
                                            'w-full px-4 py-2 text-left rounded-md hover:bg-primary-50 dark:hover:bg-gray-700',
                                            converter.path === $route.path
                                                ? 'text-primary-700 bg-primary-50 dark:bg-gray-700 dark:text-primary-400'
                                                : 'text-gray-700 dark:text-gray-300',
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
                            <div v-else class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                No related converters found
                            </div>
                        </div>
                    </BaseCard>
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
                                <BaseSelect
                                    v-if="param.type === 'select'"
                                    v-model="paramValues[param.name]"
                                    :options="param.options"
                                    :label="param.label"
                                />
                                <BaseInput
                                    v-else-if="param.type === 'number'"
                                    v-model="paramValues[param.name]"
                                    type="number"
                                    :label="param.label"
                                    :placeholder="param.placeholder || ''"
                                />
                                <BaseInput
                                    v-else
                                    v-model="paramValues[param.name]"
                                    :label="param.label"
                                    :placeholder="param.placeholder || ''"
                                />

                                <p
                                    v-if="param.description"
                                    class="mt-1 text-xs text-gray-500 dark:text-gray-400"
                                >
                                    {{ param.description }}
                                </p>
                            </div>
                        </template>
                    </BaseConverter>
                </div>
            </div>
        </div>

        <div v-else class="flex flex-col flex-1 justify-center items-center">
            <p class="text-xl text-gray-500 dark:text-gray-400">Converter not found</p>
            <p class="text-gray-500 dark:text-gray-400">
                Path: {{ `/tools/convert/${converterType}` }}
            </p>
            <BaseButton class="mt-4" @click="goBack">
                Back to converters
            </BaseButton>
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
