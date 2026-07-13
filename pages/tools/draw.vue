<template>
    <ToolLayout size="full" class="flex flex-col p-4 h-full">
        <template #actions>
            <BaseButton icon="tabler:share" size="sm" @click="shareDraw">
                Share
            </BaseButton>
        </template>

        <div class="overflow-hidden flex-1 bg-white rounded-lg shadow dark:bg-gray-800">
            <TldrawWrapper
                v-if="isMounted"
                :snapshotData="sharedDrawState"
                @update="handleDrawChange"
                @ready="handleDrawReady"
            />
        </div>
    </ToolLayout>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { useToast } from '@/composables/useToast';
import { useShareLink } from '@/composables/useShareLink';
import { useTheme } from '@/composables/useTheme';

const toast = useToast();
const { generateShareLink, getSharedData } = useShareLink();
const { isDark } = useTheme();

const applyTldrawTheme = (editor, dark) => {
    editor?.user.updateUserPreferences({
        colorScheme: dark ? 'dark' : 'light',
    });
};

watch(isDark, (dark) => applyTldrawTheme(tldrawEditor.value, dark));

// Store for drawing state - only use this for shared data passing
const drawState = useLocalStorage('draw', {});
// Separate reference for shared data to avoid conflicts with TLDraw's internal storage
const sharedDrawState = ref(null);
const isMounted = ref(false);
const tldrawEditor = ref(null);

// Handle the tldraw editor ready event
const handleDrawReady = (editor) => {
    tldrawEditor.value = editor;
    applyTldrawTheme(editor, isDark.value);
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
