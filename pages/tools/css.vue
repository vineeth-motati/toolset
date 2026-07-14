<template>
    <ToolLayout>
        <template #actions>
            <BaseButton
                icon="mdi:share-variant"
                size="sm"
                @click="shareConversion"
            >
                Share Conversion
            </BaseButton>
        </template>

        <div class="mx-auto max-w-4xl">
            <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
                <!-- Input Section -->
                <BaseCard>
                    <BaseInput
                        v-model="value"
                        type="number"
                        label="Value"
                        placeholder="Enter value"
                    />

                    <div class="grid grid-cols-2 gap-4 mt-4">
                        <BaseSelect v-model="fromUnit" :options="units" label="From" />
                        <BaseSelect v-model="toUnit" :options="units" label="To" />
                    </div>
                </BaseCard>

                <!-- Result Section -->
                <BaseCard>
                    <h2
                        class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100"
                    >
                        Result
                    </h2>
                    <div
                        class="mb-4 text-3xl font-bold text-primary-600 dark:text-primary-400"
                    >
                        {{ result }}{{ toUnit }}
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                        {{ value }}{{ fromUnit }} = {{ result }}{{ toUnit }}
                    </div>
                </BaseCard>
            </div>

            <!-- Common Conversions -->
            <BaseCard class="mt-8">
                <h2
                    class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100"
                >
                    Common Conversions
                </h2>
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div
                        v-for="conversion in commonConversions"
                        :key="conversion.from + conversion.to"
                        class="p-4 rounded-lg border cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                        @click="applyConversion(conversion)"
                    >
                        <div class="font-medium text-gray-900 dark:text-gray-100">
                            {{ conversion.label }}
                        </div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                            {{ conversion.from }} → {{ conversion.to }}
                        </div>
                    </div>
                </div>
            </BaseCard>
        </div>
    </ToolLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useShareLink } from '@/composables/useShareLink';

// State
const value = ref(0);
const fromUnit = ref('px');
const toUnit = ref('rem');

// Units and Conversions
const units = [
    { value: 'px', label: 'Pixels (px)' },
    { value: 'rem', label: 'Root EM (rem)' },
    { value: 'em', label: 'EM' },
    { value: 'vh', label: 'Viewport Height (vh)' },
    { value: 'vw', label: 'Viewport Width (vw)' },
    { value: '%', label: 'Percentage (%)' },
    { value: 'pt', label: 'Points (pt)' },
];

const commonConversions = [
    { label: 'Pixels to REM', from: 'px', to: 'rem' },
    { label: 'REM to Pixels', from: 'rem', to: 'px' },
    { label: 'Pixels to EM', from: 'px', to: 'em' },
    { label: 'Viewport Height to %', from: 'vh', to: '%' },
    { label: 'Percentage to VW', from: '%', to: 'vw' },
    { label: 'Points to Pixels', from: 'pt', to: 'px' },
];

const conversionRates = {
    px: {
        rem: 1 / 16,
        em: 1 / 16,
        pt: 0.75,
        '%': 100 / 16,
        vh: 100 / 937,
        vw: 100 / 1920,
    },
    rem: {
        px: 16,
        em: 1,
        pt: 12,
        '%': 100,
        vh: 100 / 58.5625,
        vw: 100 / 120,
    },
    em: {
        px: 16,
        rem: 1,
        pt: 12,
        '%': 100,
        vh: 100 / 58.5625,
        vw: 100 / 120,
    },
    pt: {
        px: 1.333333,
        rem: 1 / 12,
        em: 1 / 12,
        '%': 100 / 12,
        vh: 100 / 702.75,
        vw: 100 / 1440,
    },
    '%': {
        px: 0.16,
        rem: 0.01,
        em: 0.01,
        pt: 0.12,
        vh: 1,
        vw: 1,
    },
    vh: {
        px: 9.37,
        rem: 0.585625,
        em: 0.585625,
        pt: 7.0275,
        '%': 1,
        vw: 1,
    },
    vw: {
        px: 19.2,
        rem: 1.2,
        em: 1.2,
        pt: 14.4,
        '%': 1,
        vh: 1,
    },
};

function convert(value, from, to) {
    if (from === to) return value;
    return value * conversionRates[from][to];
}

// Computed Result
const result = computed(() => {
    if (!value.value) return 0;
    return Number(convert(value.value, fromUnit.value, toUnit.value)).toFixed(
        4
    );
});

// Common Conversions
function applyConversion(conversion) {
    fromUnit.value = conversion.from;
    toUnit.value = conversion.to;
}

// Sharing Utilities
const toast = useToast();
const { generateShareLink, getSharedData } = useShareLink();

async function shareConversion() {
    try {
        const link = await generateShareLink('/tools/css', {
            css: {
                value: value.value,
                fromUnit: fromUnit.value,
                toUnit: toUnit.value,
            },
        });
        if (link) {
            await showShareModal(link);
        } else {
            toast.error('Failed to generate share link.');
        }
    } catch (error) {
        console.error('Error sharing conversion:', error);
        toast.error('An error occurred while sharing the conversion.');
    }
}

// Handle Shared Data
onMounted(async () => {
    const sharedData = await getSharedData();
    if (sharedData?.css) {
        value.value = sharedData.css.value || 0;
        fromUnit.value = sharedData.css.fromUnit || 'px';
        toUnit.value = sharedData.css.toUnit || 'rem';
        toast.success('Loaded shared conversion successfully!');
    }
});
</script>
