<template>
    <div class="flex flex-col h-full">
        <h2 class="mb-2 text-lg font-semibold">Preview</h2>

        <div
            class="relative flex-grow overflow-auto border border-gray-300 rounded-lg"
        >
            <!-- Use TransitionGroup instead of Transition for list animations -->
            <TransitionGroup
                name="fade-scale"
                tag="div"
                class="relative w-full h-full min-w-fit min-h-fit flex-container"
                :style="containerStyles"
                @click.self="$emit('deselect')"
            >
                <FlexboxItem
                    v-for="item in flexItems"
                    :key="item.id"
                    :item="item"
                    :is-selected="selectedItemId === item.id"
                    @click="$emit('select-item', item)"
                />
            </TransitionGroup>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
    containerStyles: {
        type: Object,
        required: true,
    },
    flexItems: {
        type: Array,
        required: true,
    },
    selectedItemId: {
        type: String,
        default: null,
    },
});

const emit = defineEmits(['select-item', 'deselect']);

const flexContainer = ref(null);
</script>

<style scoped>
.flex-container {
    position: relative;
    width: 100%;
    height: 100%;
    transition: all 0.8s ease; /* Longer transition for layout changes */
}

.fade-scale-enter-active,
.fade-scale-leave-active {
    transition: all 0.3s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
    opacity: 0;
    transform: scale(0.95);
}

.fade-scale-move {
    transition: all 0.8s ease; /* Match container transition for consistency */
}
</style>
