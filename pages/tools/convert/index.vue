<template>
    <ToolLayout fluid>
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
                                    class="mr-2 text-primary-600 dark:text-primary-400"
                                />
                                <span>{{ option.title }}</span>
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

const router = useRouter();
const toast = useToast();

// Function to navigate to the converter or show "coming soon" message
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
                })),
        };
    });
};

// Conversion categories from configuration
const conversionCategories = computed(() => generateCategories());
</script>
