<template>
    <BaseFormField
        :label="label"
        :field-id="id"
        :hint="hint"
        :error="error"
        :required="required"
    >
        <div class="relative">
            <Icon
                v-if="icon"
                :icon="icon"
                class="absolute left-3 top-1/2 w-4 h-4 text-gray-400 -translate-y-1/2"
            />
            <input
                :id="id"
                v-model="model"
                :type="type"
                :placeholder="placeholder"
                :disabled="disabled"
                :class="[inputBase, icon ? 'pl-9' : '', error ? errorRing : '']"
            />
        </div>
    </BaseFormField>
</template>

<script setup>
import { useId } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps({
    label: { type: String, default: null },
    hint: { type: String, default: null },
    error: { type: String, default: null },
    required: { type: Boolean, default: false },
    type: { type: String, default: 'text' },
    placeholder: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    icon: { type: String, default: null },
});

const model = defineModel({ type: [String, Number], default: '' });

const id = `input-${useId()}`;

const inputBase =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors duration-150 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 disabled:cursor-not-allowed disabled:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 dark:disabled:bg-gray-900';
const errorRing = 'border-red-400 focus:border-red-400 focus:ring-red-400';
</script>
