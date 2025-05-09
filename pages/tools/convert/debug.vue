<template>
    <div class="h-[85vh] flex flex-col">
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
                <button
                    @click="$router.push('/tools/convert/')"
                    class="p-2 mr-3 text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200"
                    title="Back to converters"
                >
                    <Icon icon="tabler:arrow-left" class="text-xl" />
                </button>
                <div>
                    <h1 class="text-2xl font-bold">Converter Debug</h1>
                    <p class="text-gray-600">
                        Test and diagnose converter configurations
                    </p>
                </div>
            </div>
        </div>

        <div class="flex-1 p-6 overflow-auto bg-white rounded-lg shadow">
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <!-- Left column -->
                <div>
                    <h2 class="mb-4 text-xl font-semibold">
                        Path Configuration Check
                    </h2>

                    <div class="mb-4">
                        <label class="block mb-2 text-sm font-medium"
                            >Enter converter path to test:</label
                        >
                        <div class="flex">
                            <input
                                v-model="testPath"
                                type="text"
                                class="w-full px-3 py-2 border border-gray-300 rounded-l-md"
                                placeholder="/tools/convert/xml-to-json"
                            />
                            <button
                                @click="testConverter"
                                class="px-4 py-2 text-white bg-blue-600 rounded-r-md hover:bg-blue-700"
                            >
                                Test
                            </button>
                        </div>
                    </div>

                    <div
                        v-if="testResult"
                        class="p-4 border rounded-md"
                        :class="
                            testResult.found
                                ? 'border-green-300 bg-green-50'
                                : 'border-red-300 bg-red-50'
                        "
                    >
                        <p
                            :class="
                                testResult.found
                                    ? 'text-green-700'
                                    : 'text-red-700'
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
                            <p>
                                Source: {{ testResult.converter.sourceFormat }}
                            </p>
                            <p>
                                Target: {{ testResult.converter.targetFormat }}
                            </p>
                            <p>API Type: {{ testResult.converter.apiType }}</p>
                        </div>
                    </div>

                    <h2 class="mt-8 mb-4 text-xl font-semibold">
                        API Conversion Test
                    </h2>

                    <div class="mb-4">
                        <label class="block mb-2 text-sm font-medium"
                            >Test API conversion type:</label
                        >
                        <div class="flex mb-3">
                            <input
                                v-model="apiTestType"
                                type="text"
                                class="w-full px-3 py-2 border border-gray-300 rounded-l-md"
                                placeholder="convert.website_to_jpg"
                            />
                            <button
                                @click="findConverterByApiType"
                                class="px-4 py-2 text-white bg-blue-600 rounded-r-md hover:bg-blue-700"
                            >
                                Find
                            </button>
                        </div>

                        <div
                            v-if="apiTypeResult"
                            class="p-4 border rounded-md"
                            :class="
                                apiTypeResult.found
                                    ? 'border-green-300 bg-green-50'
                                    : 'border-red-300 bg-red-50'
                            "
                        >
                            <p
                                :class="
                                    apiTypeResult.found
                                        ? 'text-green-700'
                                        : 'text-red-700'
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
                                <p>
                                    Title: {{ apiTypeResult.converter.title }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right column -->
                <div>
                    <h2 class="mb-4 text-xl font-semibold">
                        Available Converters
                    </h2>
                    <div>
                        <input
                            v-model="filterText"
                            type="text"
                            class="w-full px-3 py-2 mb-4 border border-gray-300 rounded-md"
                            placeholder="Filter converters..."
                        />
                    </div>
                    <div class="max-h-96 overflow-auto border rounded-md">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-100 sticky top-0">
                                <tr>
                                    <th class="px-2 py-3 text-left">Path</th>
                                    <th class="px-2 py-3 text-left">
                                        API Type
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="converter in filteredConverters"
                                    :key="converter.path"
                                    class="border-t hover:bg-gray-50"
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
    </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { Icon } from '@iconify/vue';
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
