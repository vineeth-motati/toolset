<template>
    <div :class="classes">
        <slot />
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    padding: { type: String, default: 'md' }, // none | sm | md
});

const paddingClasses = { none: '', sm: 'p-4', md: 'p-6' };

const classes = computed(() => [
    'bg-white rounded-card shadow-sm border border-gray-100',
    'dark:bg-gray-800 dark:border-gray-700',
    paddingClasses[props.padding],
]);
</script>
