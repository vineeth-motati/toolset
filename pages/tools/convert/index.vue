<template>
    <ToolLayout>
        <template #actions>
            <BaseButton
                variant="secondary"
                icon="tabler:settings"
                size="sm"
                @click="navigateToSettings"
            >
                Settings
            </BaseButton>
        </template>

        <div class="h-[85vh] flex flex-col">
            <BaseCard class="overflow-auto flex-1">
                <p class="mb-4 text-xs text-gray-500 dark:text-gray-400">
                    <span
                        class="rounded px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                        >API</span
                    >
                    converters run on ConversionTools.io — they upload your
                    file and need an API key from Settings. Everything else
                    converts entirely in your browser.
                </p>
                <!-- Conversion categories -->
                <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div
                        v-for="(category, index) in conversionCategories"
                        :key="'cat-' + index"
                        class="p-4 bg-gray-50 rounded-lg border dark:bg-gray-900/40 dark:border-gray-700"
                    >
                        <h2
                            class="mb-3 text-xl font-semibold text-primary-600 dark:text-primary-400"
                        >
                            {{ category.title }}
                        </h2>
                        <div class="grid grid-cols-2 gap-2 md:grid-cols-3">
                            <button
                                v-for="option in category.options"
                                :key="option.title"
                                @click="navigateToConverter(option)"
                                class="flex items-center px-3 py-2 text-sm rounded-md border transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                                <Icon
                                    :icon="option.icon"
                                    class="mr-2 shrink-0 text-primary-600 dark:text-primary-400"
                                />
                                <span class="truncate">{{
                                    option.title
                                }}</span>
                                <span
                                    v-if="option.apiOnly"
                                    class="ml-auto shrink-0 rounded px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                                    title="Runs on the external ConversionTools API — needs an API key and uploads your file"
                                >
                                    API
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </BaseCard>
        </div>
    </ToolLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { useToast } from '@/composables/useToast';
import { useRouter } from 'vue-router';
import converters from '@/config/converters';
import { getLocalConverter } from '@/utils/localConverters';

const router = useRouter();
const toast = useToast();

const navigateToConverter = (option) => {
    router.push(option.path);
};

// Function to navigate to settings
const navigateToSettings = () => {
    router.push('/tools/convert/settings');
};

// Generate categories from centralized config
const generateCategories = () => {
    // Get unique categories
    const categories = [...new Set(converters.map((c) => c.category))];

    // Create standard category objects
    return categories.map((category) => {
        return {
            title: category,
            options: converters
                .filter((c) => c.category === category)
                .map((c) => ({
                    title: c.sourceFormat + ' to ' + c.targetFormat,
                    path: c.path,
                    icon: c.sourceIcon,
                    apiOnly: !getLocalConverter(c.path),
                })),
        };
    });
};

// Conversion categories from configuration
const conversionCategories = computed(() => generateCategories());
</script>
