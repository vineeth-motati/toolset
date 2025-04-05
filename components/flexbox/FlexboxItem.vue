<template>
    <div
        :data-item-id="item.id"
        class="flex items-center justify-center p-4 text-center flex-item"
        :class="{ 'selected-flex-item': isSelected }"
        :style="itemStyles"
        @click.stop="$emit('click', item)"
    >
        <div>{{ item.content }}</div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    item: {
        type: Object,
        required: true,
    },
    isSelected: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['click']);

const itemStyles = computed(() => ({
    ...props.item.styles,
    flex: `${props.item.styles.flexGrow} ${props.item.styles.flexShrink} ${props.item.styles.flexBasis}`,
}));
</script>

<style scoped>
.flex-item {
    min-width: 50px;
    min-height: 50px;
    transition: all 0.3s ease; /* Match container transition time */
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    will-change: transform, opacity; /* Optimize for animations */
}

.flex-item:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.selected-flex-item {
    /* Add selected styles if needed */
    outline: 2px solid #4f46e5;
    outline-offset: 2px;
}
</style>
