<template>
    <BaseFormField
        :label="label"
        :field-id="id"
        :hint="hint"
        :error="error"
        :required="required"
    >
        <Listbox v-model="model">
            <div class="relative">
                <ListboxButton
                    :id="id"
                    class="flex justify-between items-center px-3 py-2 w-full text-sm text-left text-gray-900 bg-white rounded-lg border border-gray-300 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                >
                    <span>{{ selectedLabel }}</span>
                    <Icon
                        icon="heroicons:chevron-up-down-20-solid"
                        class="w-4 h-4 text-gray-400"
                    />
                </ListboxButton>
                <transition
                    leave-active-class="transition duration-100 ease-in"
                    leave-from-class="opacity-100"
                    leave-to-class="opacity-0"
                >
                    <ListboxOptions
                        class="overflow-auto absolute z-20 py-1 mt-1 w-full max-h-60 text-sm bg-white rounded-lg border border-gray-200 shadow-lg focus:outline-none dark:bg-gray-800 dark:border-gray-700"
                    >
                        <ListboxOption
                            v-for="opt in normalizedOptions"
                            :key="opt.value"
                            v-slot="{ active, selected }"
                            :value="opt.value"
                            as="template"
                        >
                            <li
                                :class="[
                                    'flex items-center justify-between px-3 py-2 cursor-pointer',
                                    active
                                        ? 'bg-primary-50 dark:bg-gray-700'
                                        : '',
                                    selected
                                        ? 'font-medium text-primary-700 dark:text-primary-400'
                                        : 'text-gray-700 dark:text-gray-200',
                                ]"
                            >
                                {{ opt.label }}
                                <Icon
                                    v-if="selected"
                                    icon="mdi:check"
                                    class="w-4 h-4"
                                />
                            </li>
                        </ListboxOption>
                    </ListboxOptions>
                </transition>
            </div>
        </Listbox>
    </BaseFormField>
</template>

<script setup>
import { computed, useId } from 'vue';
import {
    Listbox,
    ListboxButton,
    ListboxOptions,
    ListboxOption,
} from '@headlessui/vue';
import { Icon } from '@iconify/vue';

const props = defineProps({
    label: { type: String, default: null },
    hint: { type: String, default: null },
    error: { type: String, default: null },
    required: { type: Boolean, default: false },
    options: { type: Array, required: true }, // string[] or {label, value}[]
    placeholder: { type: String, default: 'Select…' },
});

const model = defineModel({ default: null });

const id = `select-${useId()}`;

const normalizedOptions = computed(() =>
    props.options.map((o) =>
        typeof o === 'object' ? o : { label: String(o), value: o }
    )
);

const selectedLabel = computed(() => {
    const match = normalizedOptions.value.find(
        (o) => o.value === model.value
    );
    return match ? match.label : props.placeholder;
});
</script>
