<template>
    <ToolLayout
        :title="currentConverter?.title || 'Converter Not Found'"
        :description="
            currentConverter?.description ||
            'The requested converter could not be found'
        "
        :icon="currentConverter?.sourceIcon"
    >
        <template #leading>
            <BaseIconButton
                icon="tabler:arrow-left"
                label="Back to converters"
                @click="goBack"
            />
        </template>
        <template v-if="currentConverter" #actions>
            <BaseButton
                v-if="isLocalConverter"
                icon="mdi:share-variant"
                size="sm"
                @click="shareConversion"
            >
                Share
            </BaseButton>
            <BaseButton
                variant="secondary"
                icon="tabler:settings"
                size="sm"
                @click="navigateToSettings"
            >
                Settings
            </BaseButton>
        </template>

        <div v-if="currentConverter">
            <div
                v-if="!isLocalConverter"
                class="p-3 mb-4 text-sm rounded-lg border border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300"
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
                class="flex gap-1 items-center mb-4 text-xs text-emerald-600 dark:text-emerald-400"
            >
                <Icon icon="mdi:shield-check" class="w-4 h-4" />
                Runs 100% in your browser — this file never leaves your device.
            </p>
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
            <p class="text-xl text-gray-500 dark:text-gray-400">
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
