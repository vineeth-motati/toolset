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

const paddingClasses = { none: '', sm: 'p-4', md: 'p-5 sm:p-6' };

const classes = computed(() => ['surface', paddingClasses[props.padding]]);
</script>
