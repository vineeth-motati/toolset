<template>
    <div class="surface p-4 sm:p-5">
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <!-- Left column -->
            <div>
                <h2 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
                    Path Configuration Check
                </h2>

                <div class="mb-4">
                    <label class="block mb-1.5 text-[13px] font-medium text-gray-700 dark:text-gray-300"
                        >Enter converter path to test:</label
                    >
                    <div class="flex">
                        <input
                            v-model="testPath"
                            type="text"
                            class="field rounded-r-none"
                            placeholder="/tools/convert/xml-to-json"
                        />
                        <button
                            @click="testConverter"
                            class="px-4 text-sm font-medium text-white transition bg-primary-600 rounded-r-lg hover:bg-primary-700"
                        >
                            Test
                        </button>
                    </div>
                </div>

                <div
                    v-if="testResult"
                    class="rounded-xl border px-4 py-3 text-sm"
                    :class="
                        testResult.found
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200'
                            : 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200'
                    "
                >
                    <p
                        :class="
                            testResult.found ? 'font-medium' : 'font-medium'
                        "
                    >
                        {{
                            testResult.found
                                ? '✅ Converter found'
                                : '❌ Converter not found'
                        }}
                    </p>
                    <div v-if="testResult.found">
                        <p class="mt-2 font-medium">
                            Title: {{ testResult.converter.title }}
                        </p>
                        <p>Source: {{ testResult.converter.sourceFormat }}</p>
                        <p>Target: {{ testResult.converter.targetFormat }}</p>
                        <p>API Type: {{ testResult.converter.apiType }}</p>
                    </div>
                </div>

                <h2 class="mt-8 mb-4 text-sm font-semibold text-gray-900 dark:text-white">
                    API Conversion Test
                </h2>

                <div class="mb-4">
                    <label class="block mb-1.5 text-[13px] font-medium text-gray-700 dark:text-gray-300"
                        >Test API conversion type:</label
                    >
                    <div class="flex mb-3">
                        <input
                            v-model="apiTestType"
                            type="text"
                            class="field rounded-r-none"
                            placeholder="convert.website_to_jpg"
                        />
                        <button
                            @click="findConverterByApiType"
                            class="px-4 text-sm font-medium text-white transition bg-primary-600 rounded-r-lg hover:bg-primary-700"
                        >
                            Find
                        </button>
                    </div>

                    <div
                        v-if="apiTypeResult"
                        class="rounded-xl border px-4 py-3 text-sm"
                        :class="
                            apiTypeResult.found
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200'
                                : 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200'
                        "
                    >
                        <p
                            :class="
                                apiTypeResult.found
                                    ? 'font-medium'
                                    : 'font-medium'
                            "
                        >
                            {{
                                apiTypeResult.found
                                    ? '✅ API type configured'
                                    : '❌ API type not configured'
                            }}
                        </p>
                        <div v-if="apiTypeResult.found">
                            <p class="mt-2 font-medium">
                                Path: {{ apiTypeResult.converter.path }}
                            </p>
                            <p>Title: {{ apiTypeResult.converter.title }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right column -->
            <div>
                <h2 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Available Converters</h2>
                <div>
                    <input
                        v-model="filterText"
                        type="text"
                        class="field mb-4"
                        placeholder="Filter converters..."
                    />
                </div>
                <div class="overflow-auto border rounded-xl border-gray-200/80 max-h-96 dark:border-gray-700/70">
                    <table class="w-full text-sm">
                        <thead class="sticky top-0 bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th class="px-2 py-3 text-left">Path</th>
                                <th class="px-2 py-3 text-left">API Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="converter in filteredConverters"
                                :key="converter.path"
                                class="border-t border-gray-200/80 hover:bg-gray-50 dark:border-gray-700/70 dark:hover:bg-gray-700/40"
                            >
                                <td class="px-2 py-3">
                                    {{ converter.path }}
                                </td>
                                <td class="px-2 py-3">
                                    {{ converter.apiType }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import converters from '@/config/converters';

const testPath = ref('');
const testResult = ref(null);
const apiTestType = ref('');
const apiTypeResult = ref(null);
const filterText = ref('');

// Filtered converters for display
const filteredConverters = computed(() => {
    if (!filterText.value) return converters;

    const searchTerm = filterText.value.toLowerCase();
    return converters.filter(
        (c) =>
            c.path.toLowerCase().includes(searchTerm) ||
            c.apiType.toLowerCase().includes(searchTerm) ||
            c.title.toLowerCase().includes(searchTerm)
    );
});

function testConverter() {
    if (!testPath.value) return;

    const found = converters.find((item) => item.path === testPath.value);

    testResult.value = {
        found: !!found,
        converter: found,
    };
}

function findConverterByApiType() {
    if (!apiTestType.value) return;

    const found = converters.find((item) => item.apiType === apiTestType.value);

    apiTypeResult.value = {
        found: !!found,
        converter: found,
    };
}
</script>
