<template>
    <button
        type="button"
        :aria-label="label"
        :title="label"
        :disabled="disabled"
        :class="classes"
    >
        <Icon :icon="icon" class="w-5 h-5" />
    </button>
</template>

<script setup>
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps({
    icon: { type: String, required: true },
    label: { type: String, required: true }, // becomes aria-label — required, not optional
    variant: { type: String, default: 'ghost' }, // ghost | solid
    disabled: { type: Boolean, default: false },
});

const variantClasses = {
    ghost: 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
    solid: 'bg-primary-600 text-white hover:bg-primary-700',
};

const classes = computed(() => [
    'inline-flex items-center justify-center p-2 rounded-full transition-colors duration-150',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
    'disabled:cursor-not-allowed disabled:opacity-50',
    variantClasses[props.variant],
]);
</script>
