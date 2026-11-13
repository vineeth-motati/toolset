<template>
    <button
        type="button"
        :aria-label="label"
        :title="label"
        :disabled="disabled"
        :class="classes"
    >
        <Icon :icon="icon" class="w-[18px] h-[18px]" />
    </button>
</template>

<script setup>
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps({
    icon: { type: String, required: true },
    label: { type: String, required: true }, // becomes aria-label — required, not optional
    variant: { type: String, default: 'ghost' }, // ghost | outline | solid | danger
    disabled: { type: Boolean, default: false },
});

const variantClasses = {
    ghost: 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white',
    outline:
        'border border-gray-200 bg-white text-gray-600 shadow-xs hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/70 dark:hover:text-white',
    solid: 'bg-primary-600 text-white shadow-xs shadow-inner-top hover:bg-primary-700',
    danger: 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10',
};

const classes = computed(() => [
    'inline-flex items-center justify-center w-9 h-9 shrink-0 rounded-lg transition-colors duration-150',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900',
    'disabled:cursor-not-allowed disabled:opacity-50',
    variantClasses[props.variant],
]);
</script>
