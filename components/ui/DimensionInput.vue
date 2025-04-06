<template>
    <div>
        <label v-if="label" class="block mb-2 font-medium">{{ label }}</label>
        <div class="flex items-center">
            <div class="relative flex flex-1 min-w-0">
                <input
                    v-model.number="numericValue"
                    type="number"
                    min="0"
                    :disabled="selectedUnit === 'auto'"
                    class="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    :class="{
                        'opacity-50 bg-gray-50': selectedUnit === 'auto',
                    }"
                    :placeholder="placeholder"
                    @input="updateValue"
                />
                <select
                    v-model="selectedUnit"
                    class="w-16 px-2 py-2 text-sm font-medium border border-l-0 border-gray-300 rounded-r-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    @change="updateValue"
                >
                    <option value="px">px</option>
                    <option value="%">%</option>
                    <option value="auto">auto</option>
                </select>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';

const props = defineProps({
    modelValue: {
        type: String,
        default: '150px',
    },
    label: {
        type: String,
        default: '',
    },
    placeholder: {
        type: String,
        default: '150',
    },
});

const emit = defineEmits(['update:modelValue']);

const numericValue = ref(0);
const selectedUnit = ref('px');

// Parse the input value on mount and when it changes
const parseValue = (val) => {
    if (!val || val === 'auto') {
        numericValue.value = '';
        selectedUnit.value = 'auto';
        return;
    }

    const match = val.match(/^(\d+)(px|%|rem|em|vh|vw)$/);
    if (match) {
        numericValue.value = parseInt(match[1]);
        selectedUnit.value = match[2];
    } else {
        // Default to px if can't parse
        numericValue.value = 150;
        selectedUnit.value = 'px';
    }
};

const updateValue = () => {
    if (selectedUnit.value === 'auto') {
        emit('update:modelValue', 'auto');
    } else {
        emit('update:modelValue', `${numericValue.value}${selectedUnit.value}`);
    }
};

// Initialize the component
onMounted(() => {
    parseValue(props.modelValue);
});

// Watch for external changes to the model value
watch(
    () => props.modelValue,
    (newValue) => {
        parseValue(newValue);
    }
);

// Watch for changes to the unit selection
watch(selectedUnit, (newUnit) => {
    if (newUnit === 'auto') {
        numericValue.value = '';
    } else if (numericValue.value === '') {
        numericValue.value = 150; // Default value when switching from auto
    }
    updateValue();
});
</script>

<style scoped>
/* Hide number input spinner */
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
input[type='number'] {
    -moz-appearance: textfield;
}
</style>
