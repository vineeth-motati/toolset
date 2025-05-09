<template>
    <div class="h-[85vh] flex flex-col">
        <div class="flex items-center justify-between mb-4">
            <div>
                <h1 class="text-2xl font-bold">File Converter</h1>
                <p class="text-gray-600">
                    Convert files from one format to another
                </p>
            </div>
            <div class="flex gap-2">
                <button
                    @click="navigateToDebug"
                    class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                    <Icon icon="tabler:bug" class="inline-block mr-1" />
                    Debug
                </button>
                <button
                    @click="navigateToSettings"
                    class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                    <Icon icon="tabler:settings" class="inline-block mr-1" />
                    Settings
                </button>
            </div>
        </div>

        <div class="flex-1 p-6 overflow-auto bg-white rounded-lg shadow">
            <!-- Conversion categories -->
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div
                    v-for="(category, index) in conversionCategories"
                    :key="'cat-' + index"
                    class="conversion-category"
                >
                    <h2 class="mb-3 text-xl font-semibold text-blue-600">
                        {{ category.title }}
                    </h2>
                    <div class="grid grid-cols-2 gap-2 md:grid-cols-3">
                        <button
                            v-for="option in category.options"
                            :key="option.title"
                            @click="navigateToConverter(option)"
                            class="flex items-center px-3 py-2 text-sm transition-colors border rounded-md hover:bg-gray-50"
                        >
                            <Icon
                                :icon="option.icon"
                                class="mr-2 text-blue-600"
                            />
                            <span>{{ option.title }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
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

// Function to navigate to debug
const navigateToDebug = () => {
    router.push('/tools/convert/debug');
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

<style lang="postcss" scoped>
.conversion-category {
    @apply border rounded-lg p-4 bg-gray-50;
}
</style>
