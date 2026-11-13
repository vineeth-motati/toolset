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
                    class="flex justify-between items-center text-left field"
                    v-bind="$attrs"
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
                        class="overflow-auto absolute z-20 p-1 mt-1.5 w-full max-h-60 text-sm bg-white rounded-xl border border-gray-200 shadow-pop focus:outline-none dark:bg-gray-800 dark:border-gray-700"
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
                                    'flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer',
                                    active
                                        ? 'bg-gray-100 dark:bg-gray-700/70'
                                        : '',
                                    selected
                                        ? 'font-medium text-gray-900 dark:text-white'
                                        : 'text-gray-700 dark:text-gray-200',
                                ]"
                            >
                                {{ opt.label }}
                                <Icon
                                    v-if="selected"
                                    icon="lucide:check"
                                    class="w-4 h-4 text-primary-600 dark:text-primary-400"
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

defineOptions({ inheritAttrs: false });

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
