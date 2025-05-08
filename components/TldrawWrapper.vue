<template>
    <div ref="tldrawContainer" class="w-full h-full"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';

const props = defineProps({
    snapshotData: Object,
});

const emit = defineEmits(['update', 'ready']);

const tldrawContainer = ref(null);
let tldrawApp = null;
let unmountTldraw = null;

// Clean up React app when component is unmounted
onUnmounted(() => {
    if (unmountTldraw && typeof unmountTldraw === 'function') {
        unmountTldraw();
        tldrawApp = null;
        unmountTldraw = null;
    }
});

// Watch for changes to snapshot data from parent
watch(
    () => props.snapshotData,
    async (newSnapshot) => {
        if (tldrawApp && newSnapshot) {
            await nextTick();
            try {
                tldrawApp.loadSnapshot(newSnapshot);
            } catch (error) {
                console.error('Error loading drawing snapshot:', error);
            }
        }
    },
    { deep: true }
);

onMounted(async () => {
    if (!tldrawContainer.value) return;

    try {
        // Dynamically import React and ReactDOM
        const [React, ReactDOM, tldraw] = await Promise.all([
            import('react'),
            import('react-dom/client'),
            import('@tldraw/tldraw'),
        ]);

        const { Tldraw } = tldraw;

        // Create a React root
        const root = ReactDOM.default.createRoot(tldrawContainer.value);

        // Define a unique and consistent storage key
        const storageId = 'draw';

        // Handle changes to the tldraw document
        const handleChange = (editor) => {
            if (!editor || !editor.store) return;

            // Get snapshot data for parent component
            const snapshot = editor.store.getSnapshot();
            emit('update', snapshot);
        };

        // Handle the mount event
        const handleMount = (editor) => {
            if (!editor) return;

            tldrawApp = editor;

            // Only load from props if provided explicitly (sharing functionality)
            if (props.snapshotData) {
                try {
                    editor.loadSnapshot(props.snapshotData);
                } catch (error) {
                    console.error('Error loading drawing from props:', error);
                }
            } else {
                try {
                    const savedSnapshot = localStorage.getItem(storageId);
                    if (savedSnapshot) {
                        const parsedSnapshot = JSON.parse(savedSnapshot);
                        editor.loadSnapshot(parsedSnapshot);
                    }
                } catch (error) {
                    console.error('Error loading saved drawing:', error);
                }
            }

            // Set up beforeunload to ensure data is saved
            window.addEventListener('beforeunload', () => {
                if (editor && editor.store) {
                    const snapshot = editor.store.getSnapshot();
                    emit('update', snapshot);
                }
            });

            emit('ready', editor);
        };

        // Create the Tldraw component with the correct props for persistence
        const tldrawProps = {
            onMount: handleMount,
            onChange: handleChange,
            // Set the proper storage configuration
            autofocus: true,
            // Use the built-in localStorage persistence
            storagePrefix: storageId,
        };

        // Render the Tldraw component into our container
        root.render(React.default.createElement(Tldraw, tldrawProps));

        // Provide a way to unmount the React component
        unmountTldraw = () => {
            root.unmount();
        };
    } catch (error) {
        console.error('Error initializing tldraw:', error);
    }
});
</script>
