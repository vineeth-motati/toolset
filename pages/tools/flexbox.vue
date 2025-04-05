<template>
    <div class="flex flex-col h-full">
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
                    @click="showCode = !showCode"
                    class="flex items-center px-4 py-2 text-white bg-gray-600 rounded-md hover:bg-gray-700"
                >
                    <Icon icon="mdi:code-tags" class="mr-2" /> Code
                </button>
            </div>
        </div>

        <div class="flex flex-col h-full gap-4 lg:flex-row">
            <!-- Controls Panel -->
            <FlexboxControls
                class="p-4 bg-white rounded-lg shadow lg:w-1/3"
                :container-styles="containerStyles"
                :item-defaults="itemDefaults"
                @update:container="updateContainerStyles"
                @update:items="updateItemDefaults"
                @add-item="addFlexItem"
                @reset="resetFlexbox"
            />

            <!-- Preview Panel -->
            <div class="flex flex-col lg:w-2/3">
                <FlexboxPreview
                    class="flex-grow p-4 mb-4 bg-white rounded-lg shadow"
                    :container-styles="containerStyles"
                    :flex-items="flexItems"
                    @update:items="flexItems = $event"
                    @delete-item="deleteFlexItem"
                    @duplicate-item="duplicateFlexItem"
                    @update-item="updateFlexItem"
                />

                <FlexboxCodeGenerator
                    v-if="showCode"
                    class="p-4 bg-white rounded-lg shadow"
                    :container-styles="containerStyles"
                    :flex-items="flexItems"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { Icon } from '@iconify/vue';
import { v4 as uuidv4 } from 'uuid';
import { useShareLink } from '~/composables/useShareLink';
import { useToast } from '~/composables/useToast';

const toast = useToast();
const { generateShareLink, getSharedData } = useShareLink();

// UI state
const showCode = ref(false);

// Flexbox state
const containerStyles = reactive({
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    alignContent: 'stretch',
    gap: '10px',
    padding: '20px',
    minHeight: '300px',
    backgroundColor: '#f3f4f6',
});

const itemDefaults = reactive({
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: 'auto',
    alignSelf: 'auto',
});

const flexItems = ref([
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
        },
    },
]);

// Methods - everything but sharing methods remain the same
const updateContainerStyles = (styles) => {
    Object.assign(containerStyles, styles);
};

const updateItemDefaults = (defaults) => {
    Object.assign(itemDefaults, defaults);
};

const addFlexItem = () => {
    const newItem = {
        id: uuidv4(),
        content: `Item ${flexItems.value.length + 1}`,
        styles: {
            ...JSON.parse(JSON.stringify(itemDefaults)),
            backgroundColor: getRandomColor(),
            order: 0,
        },
    };
    flexItems.value.push(newItem);
};

const deleteFlexItem = (id) => {
    flexItems.value = flexItems.value.filter((item) => item.id !== id);
};

const duplicateFlexItem = (id) => {
    const item = flexItems.value.find((item) => item.id === id);
    if (item) {
        const newItem = {
            ...JSON.parse(JSON.stringify(item)),
            id: uuidv4(),
            content: `${item.content} (copy)`,
        };
        flexItems.value.push(newItem);
    }
};

const updateFlexItem = (id, updates) => {
    const index = flexItems.value.findIndex((item) => item.id === id);
    if (index !== -1) {
        flexItems.value[index] = {
            ...flexItems.value[index],
            ...updates,
        };
    }
};

const resetFlexbox = () => {
    Object.assign(containerStyles, {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        alignContent: 'stretch',
        gap: '10px',
        padding: '20px',
        minHeight: '300px',
        backgroundColor: '#f3f4f6',
    });

    Object.assign(itemDefaults, {
        flexGrow: 0,
        flexShrink: 1,
        flexBasis: 'auto',
        alignSelf: 'auto',
    });

    flexItems.value = [
        {
            id: uuidv4(),
            content: 'Item 1',
            styles: { ...itemDefaults, backgroundColor: '#60a5fa', order: 0 },
        },
        {
            id: uuidv4(),
            content: 'Item 2',
            styles: { ...itemDefaults, backgroundColor: '#93c5fd', order: 0 },
        },
        {
            id: uuidv4(),
            content: 'Item 3',
            styles: { ...itemDefaults, backgroundColor: '#bfdbfe', order: 0 },
        },
    ];
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

// Updated sharing functionality using the existing composables
const shareFlexbox = async () => {
    const state = {
        container: containerStyles,
        items: flexItems.value,
        defaults: itemDefaults,
    };

    const link = await generateShareLink('/tools/flexbox', state);
    if (link) {
        navigator.clipboard.writeText(link);
        toast.success('Share link copied to clipboard!');
    } else {
        toast.error('Failed to generate share link');
    }
};

// Load shared data
onMounted(async () => {
    const shared = await getSharedData();
    if (shared) {
        if (shared.container) {
            Object.assign(containerStyles, shared.container);
        }
        if (shared.items) {
            flexItems.value = shared.items;
        }
        if (shared.defaults) {
            Object.assign(itemDefaults, shared.defaults);
        }
        toast.success('Loaded shared flexbox layout!');
    }
});
</script>
