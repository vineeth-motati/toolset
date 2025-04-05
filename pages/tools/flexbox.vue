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
                :container-styles="flexbox.containerStyles"
                :item-defaults="flexbox.itemDefaults"
                @update:container="updateContainerStyles"
                @update:items="updateItemDefaults"
                @add-item="addFlexItem"
                @reset="resetFlexbox"
            />

            <!-- Preview Panel -->
            <div class="flex flex-col lg:w-2/3">
                <FlexboxPreview
                    class="flex-grow p-4 mb-4 bg-white rounded-lg shadow"
                    :container-styles="flexbox.containerStyles"
                    :flex-items="flexbox.items"
                    @update:items="flexbox.items = $event"
                    @delete-item="deleteFlexItem"
                    @duplicate-item="duplicateFlexItem"
                    @update-item="updateFlexItem"
                />

                <FlexboxCodeGenerator
                    v-if="showCode"
                    class="p-4 bg-white rounded-lg shadow"
                    :container-styles="flexbox.containerStyles"
                    :flex-items="flexbox.items"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { Icon } from '@iconify/vue';
import { v4 as uuidv4 } from 'uuid';
import { useShareLink } from '~/composables/useShareLink';
import { useToast } from '~/composables/useToast';

const toast = useToast();
const { generateShareLink, getSharedData } = useShareLink();

// UI state
const showCode = ref(false);

// Use a single state object pattern, matching other tools in the application
const flexbox = useLocalStorage('flexbox', {
    containerStyles: {
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
    },
    itemDefaults: {
        flexGrow: 0,
        flexShrink: 1,
        flexBasis: 'auto',
        alignSelf: 'auto',
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
    ],
});

// Methods - updated to work with the consolidated state object
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
            alignItems: 'stretch',
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
        },
        items: [
            {
                id: uuidv4(),
                content: 'Item 1',
                styles: {
                    ...flexbox.value.itemDefaults,
                    backgroundColor: '#60a5fa',
                    order: 0,
                },
            },
            {
                id: uuidv4(),
                content: 'Item 2',
                styles: {
                    ...flexbox.value.itemDefaults,
                    backgroundColor: '#93c5fd',
                    order: 0,
                },
            },
            {
                id: uuidv4(),
                content: 'Item 3',
                styles: {
                    ...flexbox.value.itemDefaults,
                    backgroundColor: '#bfdbfe',
                    order: 0,
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
});
</script>
