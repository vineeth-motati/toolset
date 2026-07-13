<template>
    <span :class="classes"><slot /></span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    variant: { type: String, default: 'primary' }, // primary | neutral | success | warning | danger
});

const variantClasses = {
    primary:
        'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
    neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    success:
        'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    warning:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const classes = computed(() => [
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
    variantClasses[props.variant],
]);
</script>
