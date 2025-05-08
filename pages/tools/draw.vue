<template>
    <div class="h-[85vh] flex flex-col">
        <div class="flex items-center justify-between mb-4">
            <div>
                <h1 class="text-2xl font-bold">Drawing Board</h1>
                <p class="text-gray-600">
                    Create and share diagrams and sketches
                </p>
            </div>
            <div class="flex gap-2">
                <button
                    @click="shareDraw"
                    class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                    <Icon icon="tabler:share" class="inline-block mr-1" /> Share
                </button>
            </div>
        </div>

        <div class="flex-1 overflow-hidden bg-white rounded-lg shadow">
            <TldrawWrapper
                v-if="isMounted"
                :snapshotData="sharedDrawState"
                @update="handleDrawChange"
                @ready="handleDrawReady"
            />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { useToast } from '@/composables/useToast';
import { useShareLink } from '@/composables/useShareLink';
import { Icon } from '@iconify/vue';

const toast = useToast();
const { generateShareLink, getSharedData } = useShareLink();

// Store for drawing state - only use this for shared data passing
const drawState = useLocalStorage('draw', {});
// Separate reference for shared data to avoid conflicts with TLDraw's internal storage
const sharedDrawState = ref(null);
const isMounted = ref(false);
const tldrawEditor = ref(null);

// Handle the tldraw editor ready event
const handleDrawReady = (editor) => {
    tldrawEditor.value = editor;
};

// Handle changes to the drawing
const handleDrawChange = (snapshot) => {
    if (snapshot) {
        // Store in local storage for sharing capability
        drawState.value = { ...snapshot };
    }
};

// Share functionality
const shareDraw = async () => {
    try {
        if (!tldrawEditor.value) {
            toast.error('Drawing board not initialized');
            return;
        }

        const snapshot = tldrawEditor.value.store.getSnapshot();

        // Generate share link
        const link = await generateShareLink('/tools/draw', {
            draw: { ...snapshot },
        });

        if (link) {
            await navigator.clipboard.writeText(link);
            toast.success('Share link copied to clipboard!');
        } else {
            toast.error('Failed to generate share link');
        }
    } catch (error) {
        console.error('Error sharing drawing:', error);
        toast.error('An error occurred while sharing');
    }
};

// Initialize when component mounts
onMounted(async () => {
    try {
        // Check if we have shared data
        const shared = await getSharedData();

        if (shared?.draw) {
            // If we have shared data, use it
            sharedDrawState.value = shared.draw;
            toast.success('Loaded shared drawing!');
        }

        // Mark as mounted so we can render the TldrawWrapper component
        isMounted.value = true;
    } catch (error) {
        console.error('Error initializing drawing:', error);
        toast.error('Failed to initialize drawing board');
    }
});
</script>

<style>
/* Import tldraw styles */
@import '@tldraw/tldraw/tldraw.css';

.tl-watermark_SEE-LICENSE {
    display: none !important;
}
</style>
