<template>
    <BaseFormField
        :label="label"
        :field-id="id"
        :hint="hint"
        :error="error"
        :required="required"
    >
        <textarea
            :id="id"
            v-model="model"
            :placeholder="placeholder"
            :disabled="disabled"
            :rows="rows"
            :class="[textareaBase, error ? errorRing : '']"
        />
    </BaseFormField>
</template>

<script setup>
import { useId } from 'vue';

const props = defineProps({
    label: { type: String, default: null },
    hint: { type: String, default: null },
    error: { type: String, default: null },
    required: { type: Boolean, default: false },
    placeholder: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    rows: { type: Number, default: 4 },
});

const model = defineModel({ type: String, default: '' });

const id = `textarea-${useId()}`;

const textareaBase =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors duration-150 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 disabled:cursor-not-allowed disabled:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 dark:disabled:bg-gray-900';
const errorRing = 'border-red-400 focus:border-red-400 focus:ring-red-400';
</script>
