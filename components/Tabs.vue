<template>
    <div>
        <div class="relative">
            <div class="overflow-x-auto scrollbar-hidden">
                <div class="flex min-w-max border-b border-gray-200">
                    <button
                        v-for="(tab, index) in tabs"
                        :key="index"
                        @click="selectTab(index)"
                        :class="[
                            'py-2 px-4 text-sm font-medium focus:outline-none',
                            activeTab === index
                                ? 'border-b-2 border-indigo-500 text-indigo-600'
                                : 'text-gray-500 hover:text-indigo-600',
                        ]"
                    >
                        {{ getAnimationLabel(tab) }}
                    </button>
                </div>
            </div>
        </div>
        <div class="mt-4">
            <slot :selectedTab="activeTab"></slot>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
    tabs: {
        type: Array,
        required: true,
    },
    defaultIndex: {
        type: Number,
        default: 0,
    },
});

const emit = defineEmits(['update:selectedTab']);

const activeTab = ref(props.defaultIndex);

const selectTab = (index) => {
    activeTab.value = index;
    emit('update:selectedTab', index);
};

const getAnimationLabel = (animationName) => {
    return animationName
        .replace(/([A-Z])/g, ' ')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
};

watch(
    () => props.defaultIndex,
    (newIndex) => {
        activeTab.value = newIndex;
    }
);
</script>

<style>
.scrollbar-hidden {
    scrollbar-width: none;
}
</style>
