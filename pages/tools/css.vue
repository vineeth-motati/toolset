<template>
    <ToolLayout>
        <template #actions>
            <BaseButton
                icon="lucide:share-2"
                size="sm"
                @click="shareConversion"
            >
                Share Conversion
            </BaseButton>
        </template>

        <div class="mx-auto max-w-4xl">
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
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

                    <div class="grid grid-cols-3 gap-4 mt-4">
                        <BaseInput
                            v-model.number="baseFontSize"
                            type="number"
                            label="Base font (px)"
                        />
                        <BaseInput
                            v-model.number="viewportWidth"
                            type="number"
                            label="Viewport W (px)"
                        />
                        <BaseInput
                            v-model.number="viewportHeight"
                            type="number"
                            label="Viewport H (px)"
                        />
                    </div>
                    <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        rem, em and % are relative to the base font size;
                        vh/vw to the viewport dimensions.
                    </p>
                </BaseCard>

                <!-- Result Section -->
                <BaseCard>
                    <h2
                        class="mb-4 text-sm font-semibold text-gray-900 dark:text-white"
                    >
                        Result
                    </h2>
                    <div
                        class="mb-4 font-mono text-3xl font-semibold text-primary-600 dark:text-primary-400"
                    >
                        {{ result }}{{ toUnit }}
                    </div>
                    <div class="font-mono text-sm text-gray-500 dark:text-gray-400">
                        {{ value }}{{ fromUnit }} = {{ result }}{{ toUnit }}
                    </div>
                </BaseCard>
            </div>

            <!-- Common Conversions -->
            <BaseCard class="mt-6">
                <h2
                    class="mb-4 text-sm font-semibold text-gray-900 dark:text-white"
                >
                    Common Conversions
                </h2>
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div
                        v-for="conversion in commonConversions"
                        :key="conversion.from + conversion.to"
                        class="p-4 transition cursor-pointer surface-muted hover:border-primary-300 dark:hover:border-primary-500/60"
                        @click="applyConversion(conversion)"
                    >
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                            {{ conversion.label }}
                        </div>
                        <div class="font-mono text-xs text-gray-500 dark:text-gray-400">
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

// Conversion context — these units are relative, so the reference values
// are explicit and editable instead of hidden magic numbers.
const baseFontSize = ref(16); // px — root font size (rem/em/%)
const viewportWidth = ref(1920); // px — for vw
const viewportHeight = ref(1080); // px — for vh

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

// Canonical model: every unit has a px size derived from the context above.
// Converting goes value → px → target, so all pairs are consistent and
// invertible (the old hand-written rate matrix returned wrong numbers for
// %/vh/vw pairs and didn't round-trip).
const pxPerUnit = (unit) => {
    switch (unit) {
        case 'px':
            return 1;
        case 'rem':
        case 'em':
            return baseFontSize.value;
        case 'pt':
            return 96 / 72; // CSS defines 1pt = 1/72in, 1in = 96px
        case '%':
            return baseFontSize.value / 100; // % of base font size
        case 'vh':
            return viewportHeight.value / 100;
        case 'vw':
            return viewportWidth.value / 100;
        default:
            return NaN;
    }
};

function convert(value, from, to) {
    if (from === to) return value;
    return (value * pxPerUnit(from)) / pxPerUnit(to);
}

// Computed Result
const result = computed(() => {
    if (!value.value) return 0;
    const converted = convert(value.value, fromUnit.value, toUnit.value);
    if (!Number.isFinite(converted)) return '—';
    return parseFloat(converted.toFixed(4));
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
                baseFontSize: baseFontSize.value,
                viewportWidth: viewportWidth.value,
                viewportHeight: viewportHeight.value,
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
        baseFontSize.value = sharedData.css.baseFontSize || 16;
        viewportWidth.value = sharedData.css.viewportWidth || 1920;
        viewportHeight.value = sharedData.css.viewportHeight || 1080;
        toast.success('Loaded shared conversion successfully!');
    }
});
</script>
