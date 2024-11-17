<template>
  <div class="mx-auto max-w-4xl">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">CSS Unit Converter</h1>
        <p class="text-gray-600">Easily convert between CSS units.</p>
      </div>
      <button
        @click="shareConversion"
        class="px-4 py-2 text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
      >
        Share Conversion
      </button>
    </div>

    <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
      <!-- Input Section -->
      <div class="p-6 bg-white rounded-lg shadow-lg">
        <div class="mb-4">
          <label class="block mb-2 text-sm font-medium text-gray-700"
            >Value</label
          >
          <input
            v-model="value"
            type="number"
            step="any"
            class="px-3 py-2 w-full rounded-lg border focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter value"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700"
              >From</label
            >
            <select
              v-model="fromUnit"
              class="px-3 py-2 w-full rounded-lg border focus:ring-2 focus:ring-indigo-500"
            >
              <option
                v-for="unit in units"
                :key="unit.value"
                :value="unit.value"
              >
                {{ unit.label }}
              </option>
            </select>
          </div>

          <div>
            <label class="block mb-2 text-sm font-medium text-gray-700"
              >To</label
            >
            <select
              v-model="toUnit"
              class="px-3 py-2 w-full rounded-lg border focus:ring-2 focus:ring-indigo-500"
            >
              <option
                v-for="unit in units"
                :key="unit.value"
                :value="unit.value"
              >
                {{ unit.label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Result Section -->
      <div class="p-6 bg-white rounded-lg shadow-lg">
        <h2 class="mb-4 text-lg font-semibold">Result</h2>
        <div class="mb-4 text-3xl font-bold text-indigo-600">
          {{ result }}{{ toUnit }}
        </div>
        <div class="text-sm text-gray-600">
          {{ value }}{{ fromUnit }} = {{ result }}{{ toUnit }}
        </div>
      </div>
    </div>

    <!-- Common Conversions -->
    <div class="p-6 mt-8 bg-white rounded-lg shadow-lg">
      <h2 class="mb-4 text-lg font-semibold">Common Conversions</h2>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="conversion in commonConversions"
          :key="conversion.from + conversion.to"
          class="p-4 rounded-lg border cursor-pointer hover:bg-gray-50"
          @click="applyConversion(conversion)"
        >
          <div class="font-medium">{{ conversion.label }}</div>
          <div class="text-sm text-gray-600">
            {{ conversion.from }} → {{ conversion.to }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useShareLink } from '~/composables/useShareLink';

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
  return Number(convert(value.value, fromUnit.value, toUnit.value)).toFixed(4);
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
      await navigator.clipboard.writeText(link);
      toast.success('Share link copied to clipboard!');
    } else {
      toast.error('Failed to generate share link.');
    }
  } catch (error) {
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
