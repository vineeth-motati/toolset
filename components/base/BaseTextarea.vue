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
            v-bind="$attrs"
        />
    </BaseFormField>
</template>

<script setup>
import { useId } from 'vue';

defineOptions({ inheritAttrs: false });

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

const textareaBase = 'field leading-6';
const errorRing =
    '!border-red-400 focus:!border-red-400 focus:!ring-red-500/15';
</script>
