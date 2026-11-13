<template>
    <svg
        viewBox="0 0 32 32"
        :class="sizeClass"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect
            width="32"
            height="32"
            rx="9"
            :class="inverted ? 'fill-white' : 'fill-gray-900 dark:fill-white'"
        />
        <g :class="inverted ? 'fill-gray-900' : 'fill-white dark:fill-gray-900'">
            <rect x="8" y="8" width="7" height="7" rx="2" />
            <rect x="8" y="17" width="7" height="7" rx="2" opacity=".5" />
            <rect x="17" y="17" width="7" height="7" rx="2" />
        </g>
        <circle cx="20.5" cy="11.5" r="3.5" fill="#A3E635" />
    </svg>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    size: { type: String, default: 'md' },
    inverted: { type: Boolean, default: false },
});

const sizeClass = computed(
    () => ({ sm: 'w-6 h-6', md: 'w-8 h-8', lg: 'w-10 h-10' })[props.size]
);
</script>
