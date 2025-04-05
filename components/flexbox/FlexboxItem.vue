<template>
    <div
        class="relative flex items-center justify-center p-4 text-center flex-item"
        :style="itemStyles"
        @click="showControls = !showControls"
    >
        <div>{{ item.content }}</div>

        <div
            v-if="showControls"
            class="absolute left-0 z-10 w-64 p-3 mb-2 text-left bg-white rounded-md shadow-lg bottom-full"
            @click.stop
        >
            <h3 class="mb-2 font-medium">{{ item.content }}</h3>

            <div class="mb-2">
                <label class="block mb-1 text-xs">flex-grow</label>
                <div class="flex items-center">
                    <input
                        v-model.number="localStyles.flexGrow"
                        type="range"
                        min="0"
                        max="5"
                        step="1"
                        class="flex-grow mr-2"
                        @input="updateStyles"
                    />
                    <span class="w-6 text-right">{{
                        localStyles.flexGrow
                    }}</span>
                </div>
            </div>

            <div class="mb-2">
                <label class="block mb-1 text-xs">flex-shrink</label>
                <div class="flex items-center">
                    <input
                        v-model.number="localStyles.flexShrink"
                        type="range"
                        min="0"
                        max="5"
                        step="1"
                        class="flex-grow mr-2"
                        @input="updateStyles"
                    />
                    <span class="w-6 text-right">{{
                        localStyles.flexShrink
                    }}</span>
                </div>
            </div>

            <div class="mb-2">
                <label class="block mb-1 text-xs">flex-basis</label>
                <select
                    v-model="localStyles.flexBasis"
                    class="w-full p-1 text-sm border border-gray-300 rounded"
                    @change="updateStyles"
                >
                    <option value="auto">auto</option>
                    <option value="0">0</option>
                    <option value="100px">100px</option>
                    <option value="200px">200px</option>
                    <option value="50%">50%</option>
                    <option value="100%">100%</option>
                </select>
            </div>

            <div class="mb-2">
                <label class="block mb-1 text-xs">align-self</label>
                <select
                    v-model="localStyles.alignSelf"
                    class="w-full p-1 text-sm border border-gray-300 rounded"
                    @change="updateStyles"
                >
                    <option value="auto">auto</option>
                    <option value="flex-start">flex-start</option>
                    <option value="flex-end">flex-end</option>
                    <option value="center">center</option>
                    <option value="baseline">baseline</option>
                    <option value="stretch">stretch</option>
                </select>
            </div>

            <div class="mb-2">
                <label class="block mb-1 text-xs">order</label>
                <div class="flex items-center">
                    <input
                        v-model.number="localStyles.order"
                        type="range"
                        min="-5"
                        max="5"
                        step="1"
                        class="flex-grow mr-2"
                        @input="updateStyles"
                    />
                    <span class="w-6 text-right">{{ localStyles.order }}</span>
                </div>
            </div>

            <div class="mb-2">
                <label class="block mb-1 text-xs">Background</label>
                <input
                    v-model="localStyles.backgroundColor"
                    type="color"
                    class="w-full p-1 border border-gray-300 rounded"
                    @input="updateStyles"
                />
            </div>

            <div class="flex justify-between mt-3">
                <button
                    @click="$emit('delete')"
                    class="px-2 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700"
                >
                    Delete
                </button>
                <button
                    @click="$emit('duplicate')"
                    class="px-2 py-1 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700"
                >
                    Duplicate
                </button>
                <button
                    @click="showControls = false"
                    class="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                >
                    Close
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
    item: {
        type: Object,
        required: true,
    },
});

const emit = defineEmits(['update', 'delete', 'duplicate']);

const showControls = ref(false);
const localStyles = ref({ ...props.item.styles });

const itemStyles = computed(() => ({
    ...localStyles.value,
    flex: `${localStyles.value.flexGrow} ${localStyles.value.flexShrink} ${localStyles.value.flexBasis}`,
}));

// Watch for prop changes
watch(
    () => props.item.styles,
    (newStyles) => {
        localStyles.value = { ...newStyles };
    },
    { deep: true }
);

// Methods
const updateStyles = () => {
    emit('update', props.item.id, {
        styles: { ...localStyles.value },
    });
};
</script>

<style scoped>
.flex-item {
    min-width: 50px;
    min-height: 50px;
    transition: all 0.3s ease;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    cursor: pointer;
}

.flex-item:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
</style>
