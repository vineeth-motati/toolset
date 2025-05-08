<template>
    <div class="mx-auto max-w-6xl">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold">Markdown Editor</h1>
                <p class="text-gray-600">
                    Write and preview markdown in real-time
                </p>
            </div>
            <div class="flex gap-2">
                <button
                    @click="createNew"
                    class="px-4 py-2 text-white bg-indigo-600 rounded-lg transition-colors hover:bg-indigo-700"
                >
                    New
                </button>
                <button
                    @click="saveNote"
                    class="px-4 py-2 text-white bg-green-600 rounded-lg transition-colors hover:bg-green-700"
                >
                    Save
                </button>
                <button
                    @click="shareNote"
                    class="px-4 py-2 text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
                >
                    Share Note
                </button>
            </div>
        </div>

        <div class="overflow-hidden bg-white rounded-lg shadow-lg">
            <div class="border-b">
                <input
                    v-model="currentNote.title"
                    type="text"
                    placeholder="Note title..."
                    class="px-4 py-2 w-full border-none focus:ring-0"
                />
            </div>

            <MarkdownToolbar @action="insertMarkdown" />

            <div class="grid grid-cols-2 divide-x h-[600px]">
                <div class="relative">
                    <textarea
                        ref="editor"
                        v-model="currentNote.content"
                        class="p-4 w-full h-full border-none resize-none focus:ring-0"
                        placeholder="Write your markdown here..."
                    ></textarea>
                </div>
                <MarkdownPreview :content="currentNote.content" />
            </div>
        </div>

        <div class="p-4 mt-6 bg-white rounded-lg shadow-lg">
            <h2 class="mb-4 text-lg font-semibold">Saved Notes</h2>
            <div class="space-y-2">
                <div
                    v-for="note in notes"
                    :key="note.id"
                    class="flex justify-between items-center p-3 rounded-lg cursor-pointer hover:bg-gray-50"
                    @click="loadNote(note)"
                >
                    <div>
                        <h3 class="font-medium">
                            {{ note.title || 'Untitled' }}
                        </h3>
                        <p class="text-sm text-gray-500">
                            {{ formatDate(note.updatedAt) }}
                        </p>
                    </div>
                    <button
                        @click.stop="deleteNote(note.id)"
                        class="p-2 text-red-600 rounded-lg hover:bg-red-50"
                    >
                        <Icon name="lucide:trash-2" class="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { nanoid } from 'nanoid';
import { useLocalStorage } from '@vueuse/core';
import { nextTick, ref, onMounted } from 'vue';
import { useShareLink } from '@/composables/useShareLink';

// State Management
const notes = useLocalStorage('markdown-notes', []);
const currentNote = ref(createEmptyNote());
const editor = ref(null);

// Sharing Utilities
const toast = useToast();
const { generateShareLink, getSharedData } = useShareLink();

// Utility Functions
function createEmptyNote() {
    return {
        id: nanoid(),
        title: '',
        content: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
}

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString();
}

// Core Methods
function createNew() {
    currentNote.value = createEmptyNote();
}

function saveNote() {
    const index = notes.value.findIndex(
        (note) => note.id === currentNote.value.id
    );
    currentNote.value.updatedAt = Date.now();

    if (index === -1) {
        notes.value.unshift({ ...currentNote.value });
    } else {
        notes.value[index] = { ...currentNote.value };
    }
}

function loadNote(note) {
    currentNote.value = { ...note };
}

function deleteNote(id) {
    notes.value = notes.value.filter((note) => note.id !== id);
    if (currentNote.value.id === id) createNew();
}

function insertMarkdown(prefix, suffix) {
    const textarea = editor.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const text = currentNote.value.content;
    const before = text.slice(0, start);
    const selection = text.slice(start, end);
    const after = text.slice(end);

    currentNote.value.content = `${before}${prefix}${selection}${suffix}${after}`;

    nextTick(() => {
        textarea.focus();
        textarea.selectionStart = start + prefix.length;
        textarea.selectionEnd = end + prefix.length;
    });
}

// Share Note Feature
async function shareNote() {
    if (!currentNote.value.title && !currentNote.value.content) {
        toast.error('Cannot share an empty note.');
        return;
    }

    try {
        const link = await generateShareLink('/tools/markdown', {
            note: { ...currentNote.value },
        });
        if (link) {
            await navigator.clipboard.writeText(link);
            toast.success('Share link copied to clipboard!');
        } else {
            toast.error('Failed to generate share link.');
        }
    } catch (error) {
        toast.error('An error occurred while sharing the note.');
    }
}

// Handle Shared Data on Component Mount
onMounted(async () => {
    const sharedData = await getSharedData();
    if (sharedData?.note) {
        currentNote.value = { ...sharedData.note };
        toast.success('Loaded shared note successfully!');
    }
});
</script>
