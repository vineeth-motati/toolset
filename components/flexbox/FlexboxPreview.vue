<template>
    <div class="flex flex-col h-full">
        <h2 class="text-lg font-semibold mb-2">Preview</h2>

        <div
            class="flex-grow relative overflow-hidden border border-gray-300 rounded-lg"
        >
            <div
                ref="flexContainer"
                class="w-full h-full relative"
                :style="containerStyles"
            >
                <FlexboxItem
                    v-for="item in localItems"
                    :key="item.id"
                    :item="item"
                    @update="updateItem"
                    @delete="$emit('delete-item', item.id)"
                    @duplicate="$emit('duplicate-item', item.id)"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useDraggable } from '@vueuse/core';

const props = defineProps({
    containerStyles: {
        type: Object,
        required: true,
    },
    flexItems: {
        type: Array,
        required: true,
    },
});

const emit = defineEmits([
    'update:items',
    'delete-item',
    'duplicate-item',
    'update-item',
]);

const flexContainer = ref(null);
const localItems = ref([...props.flexItems]);

// Watch for prop changes
watch(
    () => props.flexItems,
    (newItems) => {
        localItems.value = [...newItems];
    },
    { deep: true }
);

// Methods
const updateItem = (id, updates) => {
    const index = localItems.value.findIndex((item) => item.id === id);
    if (index !== -1) {
        localItems.value[index] = {
            ...localItems.value[index],
            ...updates,
        };
        emit('update:items', [...localItems.value]);
    }
};
</script>
