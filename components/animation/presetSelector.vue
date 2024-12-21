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
                            <div class="grid overflow-x-auto grid-cols-2 gap-4">
                                <div
                                    v-for="(preset, index) in filteredPresets"
                                    :key="index"
                                    @click="applyPreset(preset)"
                                    class="p-4 rounded-lg border border-gray-200 transition-shadow cursor-pointer hover:shadow-lg"
                                >
                                    <h4 class="mb-2 font-semibold text-md">
                                        {{
                                            getAnimationLabel(
                                                preset.animationName
                                            )
                                        }}
                                    </h4>
                                    <p class="text-sm text-gray-600">
                                        Duration: {{ preset.duration }}s,
                                        Timing: {{ preset.timingFunction }}
                                    </p>
                                </div>
                            </div>
                            <div
                                v-if="filteredPresets.length === 0"
                                class="text-gray-500"
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
