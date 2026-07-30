<template>
    <span
        class="w-1.5 h-1.5 rounded-full shrink-0"
        :class="cls"
        :title="title"
        aria-hidden="true"
    />
</template>

<script setup>
/** Three-state completeness dot for the nav rail: empty / partial / done. */
import { computed } from 'vue';

const props = defineProps({
    value: { type: Number, default: 0 }, // 0-100
});

const cls = computed(() =>
    props.value >= 80
        ? 'bg-green-500'
        : props.value > 0
          ? 'bg-amber-400'
          : 'bg-gray-300 dark:bg-gray-600'
);
const title = computed(() =>
    props.value >= 80 ? 'Complete' : props.value > 0 ? 'Partly filled' : 'Empty'
);
</script>
