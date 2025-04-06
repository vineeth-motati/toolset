<template>
    <div class="flex flex-col h-[85vh]">
        <!-- Header with actions -->
        <div class="flex items-center justify-between mb-4">
            <h1 class="text-2xl font-bold">Flexbox Playground</h1>
            <div class="flex space-x-2">
                <button
                    @click="shareFlexbox"
                    class="flex items-center px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                    <Icon icon="mdi:share" class="mr-2" /> Share
                </button>
                <button
                    @click="showCode = true"
                    class="flex items-center px-4 py-2 text-white bg-gray-600 rounded-md hover:bg-gray-700"
                >
                    <Icon icon="mdi:code-tags" class="mr-2" /> Code
                </button>
            </div>
        </div>

        <!-- Main content area -->
        <div class="flex flex-1 gap-4 overflow-hidden">
            <!-- Tabbed Controls Panel -->
            <div
                class="flex flex-col w-1/3 min-w-[300px] bg-white rounded-lg shadow"
            >
                <div class="flex border-b">
                    <button
                        v-for="(tab, index) in tabs"
                        :key="index"
                        @click="activeTab = tab.id"
                        :class="[
                            'px-4 py-2 text-sm font-medium',
                            activeTab === tab.id
                                ? 'text-indigo-600 border-b-2 border-indigo-600'
                                : 'text-gray-500 hover:text-gray-700',
                        ]"
                    >
                        {{ tab.name }}
                    </button>
                </div>

                <div class="flex-1 p-4 overflow-auto">
                    <!-- Container Controls -->
                    <div v-show="activeTab === 'container'" class="space-y-4">
                        <h2 class="text-lg font-semibold">
                            Container Properties
                        </h2>

                        <!-- Display property -->
                        <div class="mb-4">
                            <label class="block mb-2 font-medium"
                                >Display</label
                            >
                            <select
                                v-model="flexbox.containerStyles.display"
                                class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                @change="
                                    updateContainerStyles({
                                        display:
                                            flexbox.containerStyles.display,
                                    })
                                "
                            >
                                <option value="flex">flex</option>
                                <option value="inline-flex">inline-flex</option>
                            </select>
                        </div>

                        <!-- Direction buttons in a more compact layout -->
                        <div class="mb-4">
                            <label class="block mb-2 font-medium"
                                >Flex Direction</label
                            >
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
                                        flexbox.containerStyles
                                            .flexDirection === direction
                                            ? 'bg-indigo-100 border-indigo-500'
                                            : 'border-gray-300 hover:bg-gray-100',
                                    ]"
                                    @click="
                                        updateContainerStyles({
                                            flexDirection: direction,
                                        })
                                    "
                                >
                                    <Icon
                                        :icon="directionIcons[direction]"
                                        class="mr-1"
                                    />
                                    {{ direction }}
                                </button>
                            </div>
                        </div>

                        <!-- Flex-wrap with more compact layout -->
                        <div class="mb-4">
                            <label class="block mb-2 font-medium"
                                >Flex Wrap</label
                            >
                            <div class="grid grid-cols-3 gap-2">
                                <button
                                    v-for="wrap in [
                                        'nowrap',
                                        'wrap',
                                        'wrap-reverse',
                                    ]"
                                    :key="wrap"
                                    :class="[
                                        'p-2 border rounded text-sm',
                                        flexbox.containerStyles.flexWrap ===
                                        wrap
                                            ? 'bg-indigo-100 border-indigo-500'
                                            : 'border-gray-300 hover:bg-gray-100',
                                    ]"
                                    @click="
                                        updateContainerStyles({
                                            flexWrap: wrap,
                                        })
                                    "
                                >
                                    {{ wrap }}
                                </button>
                            </div>
                        </div>

                        <!-- Other container properties in a two-column layout -->
                        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <!-- Justify Content -->
                            <div>
                                <label class="block mb-2 font-medium"
                                    >Justify Content</label
                                >
                                <select
                                    v-model="
                                        flexbox.containerStyles.justifyContent
                                    "
                                    class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    @change="
                                        updateContainerStyles({
                                            justifyContent:
                                                flexbox.containerStyles
                                                    .justifyContent,
                                        })
                                    "
                                >
                                    <option value="flex-start">
                                        flex-start
                                    </option>
                                    <option value="flex-end">flex-end</option>
                                    <option value="center">center</option>
                                    <option value="space-between">
                                        space-between
                                    </option>
                                    <option value="space-around">
                                        space-around
                                    </option>
                                    <option value="space-evenly">
                                        space-evenly
                                    </option>
                                </select>
                            </div>

                            <!-- Align Items -->
                            <div>
                                <label class="block mb-2 font-medium"
                                    >Align Items</label
                                >
                                <select
                                    v-model="flexbox.containerStyles.alignItems"
                                    class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    @change="
                                        updateContainerStyles({
                                            alignItems:
                                                flexbox.containerStyles
                                                    .alignItems,
                                        })
                                    "
                                >
                                    <option value="flex-start">
                                        flex-start
                                    </option>
                                    <option value="flex-end">flex-end</option>
                                    <option value="center">center</option>
                                    <option value="stretch">stretch</option>
                                    <option value="baseline">baseline</option>
                                </select>
                            </div>

                            <!-- Align Content -->
                            <div>
                                <label class="block mb-2 font-medium"
                                    >Align Content</label
                                >
                                <select
                                    v-model="
                                        flexbox.containerStyles.alignContent
                                    "
                                    class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    @change="
                                        updateContainerStyles({
                                            alignContent:
                                                flexbox.containerStyles
                                                    .alignContent,
                                        })
                                    "
                                >
                                    <option value="flex-start">
                                        flex-start
                                    </option>
                                    <option value="flex-end">flex-end</option>
                                    <option value="center">center</option>
                                    <option value="stretch">stretch</option>
                                    <option value="space-between">
                                        space-between
                                    </option>
                                    <option value="space-around">
                                        space-around
                                    </option>
                                </select>
                            </div>

                            <!-- Gap slider -->
                            <div>
                                <DimensionInput
                                    v-model="flexbox.containerStyles.gap"
                                    label="Gap"
                                    placeholder="10px"
                                    @update:modelValue="
                                        updateContainerStyles({ gap: $event })
                                    "
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Item Properties - Only shown when an item is selected -->
                    <div v-show="activeTab === 'item'" class="space-y-4">
                        <div v-if="selectedItem">
                            <div class="flex items-center justify-between mb-4">
                                <h2 class="text-lg font-semibold">
                                    {{ selectedItem.content }} Properties
                                </h2>
                                <button
                                    @click="deselectItem"
                                    class="p-1 text-gray-500 rounded-full hover:text-gray-700"
                                >
                                    <Icon icon="mdi:close" class="w-5 h-5" />
                                </button>
                            </div>

                            <div class="mb-4">
                                <label class="block mb-2 font-medium"
                                    >Content</label
                                >
                                <div class="flex gap-2">
                                    <input
                                        v-model="selectedItem.content"
                                        type="text"
                                        class="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        @change="updateSelectedItem"
                                    />
                                </div>
                            </div>

                            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                <!-- Flex Grow -->
                                <div>
                                    <label class="block mb-2 font-medium"
                                        >flex-grow</label
                                    >
                                    <div class="flex items-center">
                                        <input
                                            v-model.number="
                                                selectedItem.styles.flexGrow
                                            "
                                            type="range"
                                            min="0"
                                            max="5"
                                            step="1"
                                            class="flex-grow mr-2"
                                            @input="updateSelectedItem"
                                        />
                                        <span class="w-8 text-right">{{
                                            selectedItem.styles.flexGrow
                                        }}</span>
                                    </div>
                                </div>

                                <!-- Flex Shrink -->
                                <div>
                                    <label class="block mb-2 font-medium"
                                        >flex-shrink</label
                                    >
                                    <div class="flex items-center">
                                        <input
                                            v-model.number="
                                                selectedItem.styles.flexShrink
                                            "
                                            type="range"
                                            min="0"
                                            max="5"
                                            step="1"
                                            class="flex-grow mr-2"
                                            @input="updateSelectedItem"
                                        />
                                        <span class="w-8 text-right">{{
                                            selectedItem.styles.flexShrink
                                        }}</span>
                                    </div>
                                </div>

                                <!-- Flex Basis -->
                                <div>
                                    <label class="block mb-2 font-medium"
                                        >flex-basis</label
                                    >
                                    <select
                                        v-model="selectedItem.styles.flexBasis"
                                        class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        @change="updateSelectedItem"
                                    >
                                        <option value="auto">auto</option>
                                        <option value="0">0</option>
                                        <option value="100px">100px</option>
                                        <option value="200px">200px</option>
                                        <option value="50%">50%</option>
                                        <option value="100%">100%</option>
                                    </select>
                                </div>

                                <!-- Align Self -->
                                <div>
                                    <label class="block mb-2 font-medium"
                                        >align-self</label
                                    >
                                    <select
                                        v-model="selectedItem.styles.alignSelf"
                                        class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        @change="updateSelectedItem"
                                    >
                                        <option value="auto">auto</option>
                                        <option value="flex-start">
                                            flex-start
                                        </option>
                                        <option value="flex-end">
                                            flex-end
                                        </option>
                                        <option value="center">center</option>
                                        <option value="baseline">
                                            baseline
                                        </option>
                                        <option value="stretch">stretch</option>
                                    </select>
                                </div>

                                <!-- Order -->
                                <div>
                                    <label class="block mb-2 font-medium"
                                        >order</label
                                    >
                                    <div class="flex items-center">
                                        <input
                                            v-model.number="
                                                selectedItem.styles.order
                                            "
                                            type="range"
                                            min="-5"
                                            max="5"
                                            step="1"
                                            class="flex-grow mr-2"
                                            @input="updateSelectedItem"
                                        />
                                        <span class="w-8 text-right">{{
                                            selectedItem.styles.order
                                        }}</span>
                                    </div>
                                </div>

                                <!-- Background Color -->
                                <div>
                                    <label class="block mb-2 font-medium"
                                        >Background Color</label
                                    >
                                    <div class="flex items-center gap-2">
                                        <input
                                            v-model="
                                                selectedItem.styles
                                                    .backgroundColor
                                            "
                                            type="color"
                                            class="w-10 h-10 border border-gray-300 rounded"
                                            @input="updateSelectedItem"
                                        />
                                        <span>{{
                                            selectedItem.styles.backgroundColor
                                        }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Add width and height controls here -->
                            <div class="mt-4">
                                <h3 class="mb-2 font-medium">Dimensions</h3>
                                <div class="grid grid-cols-2 gap-4">
                                    <!-- Width -->
                                    <div>
                                        <DimensionInput
                                            v-model="selectedItem.styles.width"
                                            label="Width"
                                            placeholder="150"
                                            @update:modelValue="
                                                updateSelectedItem
                                            "
                                        />
                                    </div>

                                    <!-- Height -->
                                    <div>
                                        <DimensionInput
                                            v-model="selectedItem.styles.height"
                                            label="Height"
                                            placeholder="150"
                                            @update:modelValue="
                                                updateSelectedItem
                                            "
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="py-8 text-center text-gray-500">
                            <Icon
                                icon="mdi:cursor-default-click-outline"
                                class="w-12 h-12 mx-auto"
                            />
                            <p class="mt-2">
                                Select an item to edit its properties
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Preview and Code Area -->
            <div class="flex flex-col flex-1 min-w-0">
                <!-- Preview Area -->
                <div
                    class="flex-1 mb-4 overflow-hidden bg-white rounded-lg shadow"
                >
                    <div class="flex flex-col h-full p-4">
                        <div class="flex items-center justify-between mb-2">
                            <h2 class="text-lg font-semibold">Preview</h2>
                            <div class="flex gap-2">
                                <button
                                    v-if="selectedItem"
                                    @click="duplicateSelectedItem"
                                    class="flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-100 border border-indigo-300 rounded-md hover:bg-indigo-200 transition-colors"
                                >
                                    <Icon
                                        icon="mdi:content-duplicate"
                                        class="w-4 h-4 mr-1"
                                    />
                                    Duplicate
                                </button>
                                <button
                                    v-if="selectedItem"
                                    @click="deleteSelectedItem"
                                    class="flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 transition-colors"
                                >
                                    <Icon
                                        icon="mdi:delete"
                                        class="w-4 h-4 mr-1"
                                    />
                                    Delete
                                </button>
                                <button
                                    @click="addFlexItem"
                                    class="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                                    title="Add new item"
                                >
                                    <Icon
                                        icon="mdi:plus"
                                        class="w-4 h-4 mr-1"
                                    />
                                    Add Item
                                </button>
                                <button
                                    @click="resetFlexbox"
                                    class="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 transition-colors"
                                    title="Reset flexbox"
                                >
                                    <Icon
                                        icon="mdi:refresh"
                                        class="w-4 h-4 mr-1"
                                    />
                                    Reset
                                </button>
                            </div>
                        </div>

                        <div
                            class="relative flex-1 overflow-auto border border-gray-300 rounded-lg"
                            style="background-color: #f3f4f6"
                        >
                            <TransitionGroup
                                name="flexbox-item"
                                tag="div"
                                class="w-full h-full p-3"
                                :style="{
                                    display: flexbox.containerStyles.display,
                                    flexDirection:
                                        flexbox.containerStyles.flexDirection,
                                    flexWrap: flexbox.containerStyles.flexWrap,
                                    justifyContent:
                                        flexbox.containerStyles.justifyContent,
                                    alignItems:
                                        flexbox.containerStyles.alignItems,
                                    alignContent:
                                        flexbox.containerStyles.alignContent,
                                    gap: flexbox.containerStyles.gap,
                                }"
                            >
                                <FlexboxItem
                                    v-for="item in flexbox.items"
                                    :key="item.id"
                                    :item="item"
                                    :is-selected="isItemSelected(item.id)"
                                    @click="selectItem(item)"
                                />
                            </TransitionGroup>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Code Modal -->
        <Modal
            :is-open="showCode"
            title="Generated Code"
            @close="showCode = false"
        >
            <div style="max-height: 70vh; overflow-y: auto">
                <FlexboxCodeGenerator
                    :container-styles="flexbox.containerStyles"
                    :flex-items="flexbox.items"
                />
            </div>
        </Modal>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { Icon } from '@iconify/vue';
import { v4 as uuidv4 } from 'uuid';
import { useShareLink } from '~/composables/useShareLink';
import { useToast } from '~/composables/useToast';
import { cloneDeep } from 'lodash-es';
import Modal from '~/components/ui/Modal.vue';
import DimensionInput from '~/components/ui/DimensionInput.vue';

const toast = useToast();
const { generateShareLink, getSharedData } = useShareLink();

// UI state
const showCode = ref(false);
const activeTab = ref('container');
const gapValue = ref(10);
const selectedItemId = ref(null);

// Computed value for the selected item
const selectedItem = ref(null);

// Tabs for the controls panel
const tabs = [
    { id: 'container', name: 'Container' },
    { id: 'item', name: 'Item Properties' },
];

// Direction icons
const directionIcons = {
    row: 'mdi:arrow-right',
    'row-reverse': 'mdi:arrow-left',
    column: 'mdi:arrow-down',
    'column-reverse': 'mdi:arrow-up',
};

// Flexbox data
const flexboxStorage = useLocalStorage('flexbox', {
    containerStyles: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        alignContent: 'stretch',
        gap: '10px',
        padding: '20px',
        minHeight: '300px',
        backgroundColor: '#f3f4f6',
    },
    itemDefaults: {
        flexGrow: 0,
        flexShrink: 1,
        flexBasis: 'auto',
        alignSelf: 'auto',
        width: '150px',
        height: '150px',
    },
    items: [
        {
            id: uuidv4(),
            content: 'Item 1',
            styles: {
                flexGrow: 0,
                flexShrink: 1,
                flexBasis: 'auto',
                alignSelf: 'auto',
                order: 0,
                backgroundColor: '#60a5fa',
                width: '150px',
                height: '150px',
            },
        },
        {
            id: uuidv4(),
            content: 'Item 2',
            styles: {
                flexGrow: 0,
                flexShrink: 1,
                flexBasis: 'auto',
                alignSelf: 'auto',
                order: 0,
                backgroundColor: '#93c5fd',
                width: '150px',
                height: '150px',
            },
        },
        {
            id: uuidv4(),
            content: 'Item 3',
            styles: {
                flexGrow: 0,
                flexShrink: 1,
                flexBasis: 'auto',
                alignSelf: 'auto',
                order: 0,
                backgroundColor: '#bfdbfe',
                width: '150px',
                height: '150px',
            },
        },
    ],
});

// Reactive state for the flexbox
const flexbox = computed({
    get: () => flexboxStorage.value,
    set: (newValue) => {
        flexboxStorage.value = newValue;
    },
});

// Methods
const updateContainerStyles = (styles) => {
    Object.assign(flexbox.value.containerStyles, styles);
};

const updateItemDefaults = (defaults) => {
    Object.assign(flexbox.value.itemDefaults, defaults);
};

const addFlexItem = () => {
    const newItem = {
        id: uuidv4(),
        content: `Item ${flexbox.value.items.length + 1}`,
        styles: {
            ...JSON.parse(JSON.stringify(flexbox.value.itemDefaults)),
            backgroundColor: getRandomColor(),
            order: 0,
        },
    };
    flexbox.value.items.push(newItem);
};

const deleteFlexItem = (id) => {
    flexbox.value.items = flexbox.value.items.filter((item) => item.id !== id);
};

const duplicateFlexItem = (id) => {
    const item = flexbox.value.items.find((item) => item.id === id);
    if (item) {
        const newItem = {
            ...JSON.parse(JSON.stringify(item)),
            id: uuidv4(),
            content: `${item.content} (copy)`,
        };
        flexbox.value.items.push(newItem);
    }
};

const updateFlexItem = (id, updates) => {
    const index = flexbox.value.items.findIndex((item) => item.id === id);
    if (index !== -1) {
        flexbox.value.items[index] = {
            ...flexbox.value.items[index],
            ...updates,
        };
    }
};

const resetFlexbox = () => {
    flexbox.value = {
        containerStyles: {
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            alignContent: 'stretch',
            gap: '10px',
            padding: '20px',
            minHeight: '300px',
            backgroundColor: '#f3f4f6',
        },
        itemDefaults: {
            flexGrow: 0,
            flexShrink: 1,
            flexBasis: 'auto',
            alignSelf: 'auto',
            width: '150px',
            height: '150px',
        },
        items: [
            {
                id: uuidv4(),
                content: 'Item 1',
                styles: {
                    ...flexbox.value.itemDefaults,
                    backgroundColor: '#60a5fa',
                    order: 0,
                    width: '150px',
                    height: '150px',
                },
            },
            {
                id: uuidv4(),
                content: 'Item 2',
                styles: {
                    ...flexbox.value.itemDefaults,
                    backgroundColor: '#93c5fd',
                    order: 0,
                    width: '150px',
                    height: '150px',
                },
            },
            {
                id: uuidv4(),
                content: 'Item 3',
                styles: {
                    ...flexbox.value.itemDefaults,
                    backgroundColor: '#bfdbfe',
                    order: 0,
                    width: '150px',
                    height: '150px',
                },
            },
        ],
    };
};

const getRandomColor = () => {
    const colors = [
        '#60a5fa',
        '#93c5fd',
        '#bfdbfe',
        '#dbeafe',
        '#818cf8',
        '#a5b4fc',
        '#c7d2fe',
        '#e0e7ff',
        '#a78bfa',
        '#c4b5fd',
        '#ddd6fe',
        '#ede9fe',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};

const updateGap = () => {
    flexbox.value.containerStyles.gap = `${gapValue.value}px`;
};

const selectItem = (item) => {
    // Make a deep clone to avoid direct mutations
    selectedItem.value = cloneDeep(item);
    selectedItemId.value = item.id;
    activeTab.value = 'item';
};

const deselectItem = () => {
    selectedItem.value = null;
    selectedItemId.value = null;
};

const isItemSelected = (id) => {
    return selectedItemId.value === id;
};

const updateSelectedItem = () => {
    if (!selectedItem.value) return;

    const index = flexbox.value.items.findIndex(
        (item) => item.id === selectedItem.value.id
    );
    if (index !== -1) {
        flexbox.value.items[index] = cloneDeep(selectedItem.value);
    }
};

const duplicateSelectedItem = () => {
    if (!selectedItem.value) return;

    const newItem = {
        ...cloneDeep(selectedItem.value),
        id: uuidv4(),
        content: `${selectedItem.value.content} (copy)`,
    };

    flexbox.value.items.push(newItem);
    selectItem(newItem);
    toast.success('Item duplicated!');
};

const deleteSelectedItem = () => {
    if (!selectedItem.value) return;

    flexbox.value.items = flexbox.value.items.filter(
        (item) => item.id !== selectedItem.value.id
    );
    deselectItem();
    toast.success('Item deleted!');
};

// Watch for changes to items in the flexbox
watch(
    () => flexbox.value.items,
    (newItems) => {
        // If the currently selected item changes externally, update our local copy
        if (selectedItemId.value) {
            const updatedItem = newItems.find(
                (item) => item.id === selectedItemId.value
            );
            if (updatedItem) {
                selectedItem.value = cloneDeep(updatedItem);
            } else {
                // If the item was deleted, deselect it
                deselectItem();
            }
        }
    },
    { deep: true }
);

// Updated sharing functionality using the consolidated state object
const shareFlexbox = async () => {
    try {
        const link = await generateShareLink('/tools/flexbox', flexbox.value);
        if (link) {
            await navigator.clipboard.writeText(link);
            toast.success('Share link copied to clipboard!');
        } else {
            toast.error('Failed to generate share link');
        }
    } catch (error) {
        console.error('Error sharing flexbox:', error);
        toast.error('An error occurred while sharing');
    }
};

// Load shared data consistently with other tools
onMounted(async () => {
    const shared = await getSharedData();
    if (shared) {
        Object.assign(flexbox.value, shared);
        toast.success('Loaded shared flexbox layout!');
    }

    // Set initial gap value from containerStyles
    gapValue.value = parseInt(flexbox.value.containerStyles.gap) || 10;
});
</script>

<style>
.selected-flex-item {
    outline: 2px solid #4f46e5;
    outline-offset: 2px;
}
</style>
