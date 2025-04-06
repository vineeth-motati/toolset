<template>
    <div class="flex flex-col h-full overflow-y-auto">
        <h2 class="mb-4 text-lg font-semibold">Container Properties</h2>

        <div class="mb-4">
            <label class="block mb-2 font-medium">display</label>
            <select
                v-model="container.display"
                class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                @change="emitContainerUpdate"
            >
                <option value="flex">flex</option>
                <option value="inline-flex">inline-flex</option>
            </select>
        </div>

        <div class="mb-4">
            <label class="block mb-2 font-medium">flex-direction</label>
            <div class="grid grid-cols-2 gap-2">
                <button
                    v-for="direction in [
                        'row',
                        'row-reverse',
                        'column',
                        'column-reverse',
                    ]"
                    :key="direction"
                    :class="[
                        'p-2 border rounded flex items-center justify-center',
                        container.flexDirection === direction
                            ? 'bg-indigo-100 border-indigo-500'
                            : 'border-gray-300 hover:bg-gray-100',
                    ]"
                    @click="updateContainerProp('flexDirection', direction)"
                >
                    <Icon :icon="directionIcons[direction]" class="mr-1" />
                    {{ direction }}
                </button>
            </div>
        </div>

        <div class="mb-4">
            <label class="block mb-2 font-medium">flex-wrap</label>
            <div class="grid grid-cols-3 gap-2">
                <button
                    v-for="wrap in ['nowrap', 'wrap', 'wrap-reverse']"
                    :key="wrap"
                    :class="[
                        'p-2 border rounded',
                        container.flexWrap === wrap
                            ? 'bg-indigo-100 border-indigo-500'
                            : 'border-gray-300 hover:bg-gray-100',
                    ]"
                    @click="updateContainerProp('flexWrap', wrap)"
                >
                    {{ wrap }}
                </button>
            </div>
        </div>

        <div class="mb-4">
            <label class="block mb-2 font-medium">justify-content</label>
            <div class="grid grid-cols-2 gap-2 mb-2">
                <button
                    v-for="justify in [
                        'flex-start',
                        'flex-end',
                        'center',
                        'space-between',
                        'space-around',
                        'space-evenly',
                    ]"
                    :key="justify"
                    :class="[
                        'p-2 border rounded',
                        container.justifyContent === justify
                            ? 'bg-indigo-100 border-indigo-500'
                            : 'border-gray-300 hover:bg-gray-100',
                    ]"
                    @click="updateContainerProp('justifyContent', justify)"
                >
                    {{ justify }}
                </button>
            </div>
        </div>

        <div class="mb-4">
            <label class="block mb-2 font-medium">align-items</label>
            <div class="grid grid-cols-2 gap-2 mb-2">
                <button
                    v-for="align in [
                        'flex-start',
                        'flex-end',
                        'center',
                        'stretch',
                        'baseline',
                    ]"
                    :key="align"
                    :class="[
                        'p-2 border rounded',
                        container.alignItems === align
                            ? 'bg-indigo-100 border-indigo-500'
                            : 'border-gray-300 hover:bg-gray-100',
                    ]"
                    @click="updateContainerProp('alignItems', align)"
                >
                    {{ align }}
                </button>
            </div>
        </div>

        <div class="mb-4">
            <label class="block mb-2 font-medium">align-content</label>
            <div class="grid grid-cols-2 gap-2 mb-2">
                <button
                    v-for="align in [
                        'flex-start',
                        'flex-end',
                        'center',
                        'stretch',
                        'space-between',
                        'space-around',
                    ]"
                    :key="align"
                    :class="[
                        'p-2 border rounded',
                        container.alignContent === align
                            ? 'bg-indigo-100 border-indigo-500'
                            : 'border-gray-300 hover:bg-gray-100',
                    ]"
                    @click="updateContainerProp('alignContent', align)"
                >
                    {{ align }}
                </button>
            </div>
        </div>

        <div class="mb-4">
            <DimensionInput
                v-model="container.gap"
                label="gap"
                placeholder="10"
                @update:modelValue="emitContainerUpdate"
            />
        </div>

        <hr class="my-6 border-gray-200" />

        <h2 class="mb-4 text-lg font-semibold">Item Defaults</h2>

        <div class="mb-4">
            <label class="block mb-2 font-medium">flex-grow</label>
            <div class="flex items-center">
                <input
                    v-model.number="defaults.flexGrow"
                    type="range"
                    min="0"
                    max="5"
                    step="1"
                    class="flex-grow mr-2"
                    @input="emitItemDefaultsUpdate"
                />
                <span class="w-8 text-right">{{ defaults.flexGrow }}</span>
            </div>
        </div>

        <div class="mb-4">
            <label class="block mb-2 font-medium">flex-shrink</label>
            <div class="flex items-center">
                <input
                    v-model.number="defaults.flexShrink"
                    type="range"
                    min="0"
                    max="5"
                    step="1"
                    class="flex-grow mr-2"
                    @input="emitItemDefaultsUpdate"
                />
                <span class="w-8 text-right">{{ defaults.flexShrink }}</span>
            </div>
        </div>

        <div class="mb-4">
            <label class="block mb-2 font-medium">flex-basis</label>
            <select
                v-model="defaults.flexBasis"
                class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                @change="emitItemDefaultsUpdate"
            >
                <option value="auto">auto</option>
                <option value="0">0</option>
                <option value="100px">100px</option>
                <option value="200px">200px</option>
                <option value="50%">50%</option>
                <option value="100%">100%</option>
            </select>
        </div>

        <div class="mb-4">
            <label class="block mb-2 font-medium">align-self</label>
            <select
                v-model="defaults.alignSelf"
                class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                @change="emitItemDefaultsUpdate"
            >
                <option value="auto">auto</option>
                <option value="flex-start">flex-start</option>
                <option value="flex-end">flex-end</option>
                <option value="center">center</option>
                <option value="baseline">baseline</option>
                <option value="stretch">stretch</option>
            </select>
        </div>

        <!-- Add width and height default controls -->
        <div class="mb-4">
            <DimensionInput
                v-model="defaults.width"
                label="Default width"
                placeholder="150"
                @update:modelValue="emitItemDefaultsUpdate"
            />
        </div>

        <div class="mb-4">
            <DimensionInput
                v-model="defaults.height"
                label="Default height"
                placeholder="150"
                @update:modelValue="emitItemDefaultsUpdate"
            />
        </div>

        <div class="flex gap-2 mt-6">
            <button
                @click="$emit('add-item')"
                class="flex-grow px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
                <Icon icon="mdi:plus" class="mr-1" /> Add Item
            </button>

            <button
                @click="$emit('reset')"
                class="px-4 py-2 text-white bg-gray-600 rounded-md hover:bg-gray-700"
            >
                <Icon icon="mdi:refresh" class="mr-1" /> Reset
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import { Icon } from '@iconify/vue';
import DimensionInput from '~/components/ui/DimensionInput.vue';

const props = defineProps({
    containerStyles: {
        type: Object,
        required: true,
    },
    itemDefaults: {
        type: Object,
        required: true,
    },
});

const emit = defineEmits([
    'update:container',
    'update:items',
    'add-item',
    'reset',
]);

const container = reactive({ ...props.containerStyles });
const defaults = reactive({ ...props.itemDefaults });

// Direction icons
const directionIcons = {
    row: 'mdi:arrow-right',
    'row-reverse': 'mdi:arrow-left',
    column: 'mdi:arrow-down',
    'column-reverse': 'mdi:arrow-up',
};

// Watch for prop changes
watch(
    () => props.containerStyles,
    (newVal) => {
        Object.assign(container, newVal);
    },
    { deep: true }
);

watch(
    () => props.itemDefaults,
    (newVal) => {
        Object.assign(defaults, newVal);
    },
    { deep: true }
);

// Methods
const updateContainerProp = (prop, value) => {
    container[prop] = value;
    emitContainerUpdate();
};

const emitContainerUpdate = () => {
    emit('update:container', { ...container });
};

const emitItemDefaultsUpdate = () => {
    emit('update:items', { ...defaults });
};
</script>
