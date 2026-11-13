<template>
    <button
        :type="type"
        :disabled="disabled || loading"
        :class="classes"
    >
        <Icon
            v-if="loading"
            icon="mdi:loading"
            class="w-4 h-4 animate-spin"
        />
        <Icon v-else-if="icon" :icon="icon" class="w-4 h-4" />
        <slot />
    </button>
</template>

<script setup>
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps({
    variant: {
        type: String,
        default: 'primary', // primary | secondary | ghost | ink | danger
    },
    size: {
        type: String,
        default: 'md', // sm | md | lg
    },
    icon: { type: String, default: null },
    loading: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    type: { type: String, default: 'button' },
});

const sizeClasses = {
    sm: 'h-8 px-3 text-[13px] gap-1.5',
    md: 'h-9 px-3.5 text-sm gap-2',
    lg: 'h-11 px-5 text-[15px] gap-2',
};

const variantClasses = {
    primary:
        'bg-primary-600 text-white shadow-xs shadow-inner-top hover:bg-primary-700 focus-visible:ring-primary-500 dark:hover:bg-primary-500',
    secondary:
        'bg-white text-gray-700 border border-gray-200 shadow-xs hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 focus-visible:ring-primary-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700/70 dark:hover:border-gray-600 dark:hover:text-white',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-primary-500 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white',
    ink: 'bg-gray-900 text-white shadow-xs hover:bg-gray-800 focus-visible:ring-gray-500 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100',
    danger: 'bg-red-600 text-white shadow-xs shadow-inner-top hover:bg-red-700 focus-visible:ring-red-400',
};

const classes = computed(() => [
    'inline-flex items-center justify-center font-medium rounded-lg whitespace-nowrap select-none transition-[color,background-color,border-color,box-shadow,transform] duration-150 active:translate-y-px',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0',
    sizeClasses[props.size],
    variantClasses[props.variant],
]);
</script>
