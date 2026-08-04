<template>
    <div
        class="relative shrink-0"
        :style="{ width: `${size}px`, height: `${size}px` }"
        role="img"
        :aria-label="`Resume score ${value} out of 100`"
    >
        <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" class="-rotate-90">
            <circle
                :cx="c"
                :cy="c"
                :r="r"
                fill="none"
                stroke-width="3"
                class="stroke-gray-200 dark:stroke-gray-700"
            />
            <circle
                :cx="c"
                :cy="c"
                :r="r"
                fill="none"
                stroke-width="3"
                stroke-linecap="round"
                :class="strokeClass"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="offset"
                class="transition-[stroke-dashoffset] duration-500 ease-out"
            />
        </svg>
        <span
            class="flex absolute inset-0 justify-center items-center font-semibold tabular-nums"
            :class="[textClass, size >= 60 ? 'text-lg' : 'text-xs']"
        >
            {{ value }}
        </span>
    </div>
</template>

<script setup>
/** Compact 0–100 dial. Colour is the signal; the number is the detail. */
import { computed } from 'vue';

const props = defineProps({
    value: { type: Number, default: 0 },
    size: { type: Number, default: 44 },
});

const c = computed(() => props.size / 2);
const r = computed(() => props.size / 2 - 3);
const circumference = computed(() => 2 * Math.PI * r.value);
const offset = computed(
    () => circumference.value * (1 - Math.max(0, Math.min(100, props.value)) / 100)
);

const tone = computed(() =>
    props.value >= 85 ? 'green' : props.value >= 70 ? 'primary' : props.value >= 45 ? 'amber' : 'red'
);

const strokeClass = computed(
    () =>
        ({
            green: 'stroke-green-500',
            primary: 'stroke-primary-500',
            amber: 'stroke-amber-500',
            red: 'stroke-red-500',
        })[tone.value]
);
const textClass = computed(
    () =>
        ({
            green: 'text-green-600 dark:text-green-400',
            primary: 'text-primary-600 dark:text-primary-400',
            amber: 'text-amber-600 dark:text-amber-400',
            red: 'text-red-600 dark:text-red-400',
        })[tone.value]
);
</script>
