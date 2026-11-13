<template>
    <ToolLayout>
        <template #actions>
            <BaseButton
                variant="secondary"
                icon="lucide:settings"
                size="sm"
                @click="navigateToSettings"
            >
                Settings
            </BaseButton>
        </template>

        <div class="flex flex-col gap-8">
            <p
                class="rounded-xl border px-4 py-3 text-sm border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200"
            >
                <span class="api-tag">API</span>
                converters run on ConversionTools.io — they upload your file and
                need an API key from Settings. Everything else converts entirely
                in your browser.
            </p>

            <section
                v-for="(category, index) in conversionCategories"
                :key="'cat-' + index"
            >
                <div class="flex items-baseline gap-2 mb-3">
                    <h2
                        class="text-base font-semibold text-gray-900 dark:text-white"
                    >
                        {{ category.title }}
                    </h2>
                    <span class="text-sm text-gray-500 dark:text-gray-400">{{
                        category.options.length
                    }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    <button
                        v-for="option in category.options"
                        :key="option.title"
                        @click="navigateToConverter(option)"
                        class="flex items-center gap-2.5 rounded-xl border border-gray-200/80 bg-white px-3 py-2.5 text-left text-sm font-medium text-gray-900 transition hover:border-gray-300 hover:shadow-xs dark:border-gray-700/70 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-gray-600"
                    >
                        <ToolIcon
                            :icon="option.icon"
                            color="#0D9488"
                            size="xs"
                            class="shrink-0"
                        />
                        <span class="truncate">{{ option.title }}</span>
                        <span
                            v-if="option.apiOnly"
                            class="api-tag ml-auto shrink-0"
                            title="Runs on the external ConversionTools API — needs an API key and uploads your file"
                        >
                            API
                        </span>
                    </button>
                </div>
            </section>
        </div>
    </ToolLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import ToolIcon from '@/components/tool/ToolIcon.vue';
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
