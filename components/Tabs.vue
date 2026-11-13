<template>
    <div>
        <div class="relative">
            <div class="overflow-x-auto scrollbar-hidden">
                <div
                    class="inline-flex gap-1 p-1 min-w-max bg-gray-100 rounded-xl dark:bg-gray-800/80"
                    role="tablist"
                >
                    <button
                        v-for="(tab, index) in tabs"
                        :key="index"
                        type="button"
                        role="tab"
                        :aria-selected="activeTab === index"
                        @click="selectTab(index)"
                        :class="[
                            'h-8 px-3.5 rounded-lg text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                            activeTab === index
                                ? 'bg-white text-gray-900 shadow-xs ring-1 ring-gray-200/80 dark:bg-gray-700 dark:text-white dark:ring-gray-600/60'
                                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white',
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
    -ms-overflow-style: none;
}
.scrollbar-hidden::-webkit-scrollbar {
    display: none;
}
</style>
