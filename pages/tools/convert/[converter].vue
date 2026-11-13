<template>
    <ToolLayout
        :title="currentConverter?.title || 'Converter Not Found'"
        :description="
            currentConverter?.description ||
            'The requested converter could not be found'
        "
        :icon="currentConverter?.sourceIcon"
    >
        <template v-if="currentConverter" #actions>
            <BaseButton
                v-if="isLocalConverter"
                icon="lucide:share-2"
                size="sm"
                @click="shareConversion"
            >
                Share
            </BaseButton>
            <BaseButton
                variant="secondary"
                icon="lucide:settings"
                size="sm"
                @click="navigateToSettings"
            >
                Settings
            </BaseButton>
        </template>

        <div v-if="currentConverter">
            <div
                v-if="!isLocalConverter"
                class="mb-4 rounded-xl border px-4 py-3 text-sm border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200"
            >
                <Icon
                    icon="mdi:cloud-upload-outline"
                    class="inline-block mr-1 w-4 h-4 align-text-bottom"
                />
                This converter runs on the external ConversionTools API — your
                file is uploaded to convert it, and it needs an API key from
                <button
                    class="font-medium underline"
                    @click="navigateToSettings"
                >
                    Settings</button
                >.
            </div>
            <p
                v-else
                class="flex gap-1.5 items-center mb-4 text-xs text-emerald-700 dark:text-emerald-400"
            >
                <Icon icon="mdi:shield-check" class="w-4 h-4" />
                Runs 100% in your browser — this file never leaves your device.
            </p>
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
                <!-- Left sidebar with related converters -->
                <div class="order-last col-span-1 lg:order-none">
                    <BaseCard padding="none">
                        <div class="p-4 border-b border-gray-200/80 dark:border-gray-700/70">
                            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">More Converters</h2>
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
                                            'w-full px-3 py-2 text-left rounded-lg transition',
                                            converter.path === $route.path
                                                ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300'
                                                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/40',
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
                <div class="col-span-1 min-w-0 lg:col-span-3">
                    <BaseConverter
                        ref="converterRef"
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
                                <BaseTextarea
                                    v-else-if="param.type === 'textarea'"
                                    v-model="paramValues[param.name]"
                                    :label="param.label"
                                    :placeholder="param.placeholder || ''"
                                    :rows="6"
                                    class="font-mono"
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

        <div v-else class="flex flex-col justify-center items-center py-24">
            <p class="text-base font-semibold text-gray-900 dark:text-white">
                Converter not found
            </p>
            <p class="text-gray-500 dark:text-gray-400">
                Path: {{ `/tools/convert/${converterType}` }}
            </p>
            <BaseButton class="mt-4" @click="goBack">
                Back to converters
            </BaseButton>
        </div>
    </ToolLayout>
</template>

<script setup>
import { ref, computed, onMounted, reactive, provide } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import converterConfig from '@/config/converters';
import BaseConverter from '@/components/convert/BaseConverter.vue';
import { getLocalConverter } from '@/utils/localConverters';
import { Icon } from '@iconify/vue';

// Remount per converter path: currentConverter/paramValues are initialized
// in onMounted, and ToolLayout resolves its tool once per setup — reusing the
// component across converter navigations would leave both stale.
definePageMeta({ key: (route) => route.fullPath });

const route = useRoute();
const router = useRouter();
const converterType = computed(() => route.params.converter);
const currentConverter = ref(null);
const converterRef = ref(null);

// Local converters support sharing their input/output as a link
const isLocalConverter = computed(
    () => !!getLocalConverter(`/tools/convert/${converterType.value}`)
);

const shareConversion = () => {
    converterRef.value?.share();
};

// Store parameter values; BaseConverter injects these and passes them as
// conversion options to the API.
const paramValues = reactive({});
provide('paramValues', paramValues);

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
    const config = converterConfig.find((item) => item.path === path);

    if (config) {
        currentConverter.value = config;

        // Initialize parameter values with defaults
        if (config.params && config.params.length > 0) {
            config.params.forEach((param) => {
                if (param.default) {
                    paramValues[param.name] = param.default;
                }
            });
        }
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
