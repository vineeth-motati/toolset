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
        default: 'primary', // primary | secondary | ghost | danger
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
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2',
};

const variantClasses = {
    primary:
        'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-400 disabled:bg-primary-300',
    secondary:
        'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus-visible:ring-primary-400 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus-visible:ring-primary-400 dark:text-gray-300 dark:hover:bg-gray-800',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-400 disabled:bg-red-300',
};

const classes = computed(() => [
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
    'disabled:cursor-not-allowed disabled:opacity-60',
    sizeClasses[props.size],
    variantClasses[props.variant],
]);
</script>
