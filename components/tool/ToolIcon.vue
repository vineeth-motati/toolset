<template>
    <span
        class="chip"
        :class="sizeClasses[size].box"
        :style="{ '--c': color || categoryColor(tool?.category) }"
    >
        <Icon :icon="icon || tool?.icon || 'lucide:wrench'" :class="sizeClasses[size].icon" />
    </span>
</template>

<script setup>
import { Icon } from '@iconify/vue';
import { categoryColor } from '@/composables/useTools';

defineProps({
    tool: { type: Object, default: null },
    icon: { type: String, default: null },
    color: { type: String, default: null },
    size: { type: String, default: 'md' },
});

const sizeClasses = {
    xs: { box: 'w-7 h-7 rounded-lg', icon: 'w-3.5 h-3.5' },
    sm: { box: 'w-8 h-8 rounded-lg', icon: 'w-4 h-4' },
    md: { box: 'w-10 h-10 rounded-xl', icon: 'w-5 h-5' },
    lg: { box: 'w-12 h-12 rounded-xl', icon: 'w-6 h-6' },
};
</script>
