<template>
    <ToolLayout fluid>
        <template #actions>
            <BaseButton
                variant="secondary"
                icon="mdi:file-plus-outline"
                size="sm"
                @click="createNew"
            >
                New
            </BaseButton>
            <BaseButton icon="mdi:content-save-outline" size="sm" @click="saveNote">
                Save
            </BaseButton>
            <BaseButton
                variant="secondary"
                icon="mdi:share-variant"
                size="sm"
                @click="shareNote"
            >
                Share Note
            </BaseButton>
        </template>

        <div class="mx-auto max-w-6xl">
            <BaseCard padding="none">
                <div class="p-2 border-b dark:border-gray-700">
                    <BaseInput
                        v-model="currentNote.title"
                        type="text"
                        placeholder="Note title..."
                    />
                </div>

                <MarkdownToolbar @action="insertMarkdown" />

                <div class="grid grid-cols-2 divide-x h-[600px] dark:divide-gray-700">
                    <div class="relative">
                        <textarea
                            ref="editor"
                            v-model="currentNote.content"
                            class="p-4 w-full h-full text-gray-900 bg-white border-none resize-none focus:ring-0 dark:bg-gray-800 dark:text-gray-100"
                            placeholder="Write your markdown here..."
                        ></textarea>
                    </div>
                    <MarkdownPreview :content="currentNote.content" />
                </div>
            </BaseCard>

            <BaseCard class="mt-6">
                <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Saved Notes
                </h2>
                <div class="space-y-2">
                    <div
                        v-for="note in notes"
                        :key="note.id"
                        class="flex justify-between items-center p-3 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                        @click="loadNote(note)"
                    >
                        <div>
                            <h3 class="font-medium text-gray-900 dark:text-gray-100">
                                {{ note.title || 'Untitled' }}
                            </h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                {{ formatDate(note.updatedAt) }}
                            </p>
                        </div>
                        <BaseIconButton
                            icon="mdi:delete-outline"
                            label="Delete note"
                            variant="danger"
                            @click.stop="deleteNote(note.id)"
                        />
                    </div>
                </div>
            </BaseCard>
        </div>
    </ToolLayout>
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
