<template>
    <Tabs :tabs="categories" @update:selectedTab="onCategoryChange">
        <template #default="{ selectedTab }">
            <div>
                <!-- Subcategory Tabs -->
                <Tabs
                    :tabs="subcategories"
                    @update:selectedTab="onSubcategoryChange"
                    :defaultIndex="selectedSubcategoryIndex"
                    class="mt-4"
                >
                    <template #default="{ selectedTab: selectedSubTab }">
                        <div
                            class="overflow-y-auto mt-4 max-h-96 scrollbar-hidden"
                        >
                            <!-- Preset Cards -->
                            <div class="grid overflow-x-auto grid-cols-2 gap-3">
                                <div
                                    v-for="(preset, index) in filteredPresets"
                                    :key="index"
                                    @click="applyPreset(preset)"
                                    class="p-3 rounded-xl border border-gray-200/80 transition cursor-pointer hover:border-primary-300 hover:bg-primary-50/50 dark:border-gray-700/70 dark:hover:border-primary-500/50 dark:hover:bg-primary-500/10"
                                >
                                    <h4
                                        class="mb-1 text-sm font-semibold text-gray-900 dark:text-white"
                                    >
                                        {{
                                            getAnimationLabel(
                                                preset.animationName
                                            )
                                        }}
                                    </h4>
                                    <p
                                        class="text-xs text-gray-500 dark:text-gray-400"
                                    >
                                        Duration: {{ preset.duration }}s,
                                        Timing: {{ preset.timingFunction }}
                                    </p>
                                </div>
                            </div>
                            <div
                                v-if="filteredPresets.length === 0"
                                class="text-sm text-gray-500 dark:text-gray-400"
                            >
                                No presets found.
                            </div>
                        </div>
                    </template>
                </Tabs>
            </div>
        </template>
    </Tabs>
</template>

<script setup>
// Props
const props = defineProps({
    onApply: {
        type: Function,
        required: true,
    },
});

// Emits
const emit = defineEmits(['apply-preset']);

// State
const categories = Object.keys(animationPresets);
const selectedCategoryIndex = ref(0);
const selectedSubcategoryIndex = ref(0);
const presetSearch = ref('');

// Computed
const subcategories = computed(() => {
    const category = categories[selectedCategoryIndex.value];
    return Object.keys(animationPresets[category]);
});

const selectedCategory = computed(
    () => categories[selectedCategoryIndex.value]
);
const selectedSubcategory = computed(
    () => subcategories.value[selectedSubcategoryIndex.value]
);

const filteredPresets = computed(() => {
    const presets =
        animationPresets[selectedCategory.value][selectedSubcategory.value];
    const search = presetSearch.value?.toLowerCase();
    return Object.values(presets).filter((preset) =>
        preset.animationName?.toLowerCase().includes(search)
    );
});

// Methods
const onCategoryChange = (index) => {
    selectedCategoryIndex.value = index;
    selectedSubcategoryIndex.value = 0;
};

const onSubcategoryChange = (index) => {
    selectedSubcategoryIndex.value = index;
};

const getAnimationLabel = (animationName) => {
    return animationName
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
};
const applyPreset = (preset) => {
    props.onApply(preset);
};
</script>
