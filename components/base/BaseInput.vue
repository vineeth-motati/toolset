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
                v-bind="$attrs"
            />
        </div>
    </BaseFormField>
</template>

<script setup>
import { useId } from 'vue';
import { Icon } from '@iconify/vue';

defineOptions({ inheritAttrs: false });

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

const inputBase = 'field';
const errorRing =
    '!border-red-400 focus:!border-red-400 focus:!ring-red-500/15';
</script>
