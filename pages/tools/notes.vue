<template>
    <div class="mx-auto max-w-4xl">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold">Notes</h1>
            <div class="flex gap-2">
                <button
                    @click="addNote"
                    class="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                    New Note
                </button>
                <button
                    @click="shareNotes"
                    class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                    Share Notes
                </button>
            </div>
        </div>

        <draggable
            v-model="notes"
            class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
            item-key="id"
            :animation="150"
        >
            <template #item="{ element: note }">
                <div class="p-4 bg-white rounded-lg shadow">
                    <input
                        v-model="note.title"
                        class="px-2 py-1 mb-2 w-full text-lg font-semibold border-b"
                        placeholder="Note title"
                    />
                    <div class="flex gap-2 mb-2">
                        <button
                            @click="note.isPreview = !note.isPreview"
                            class="px-2 py-1 text-sm rounded"
                            :class="
                                note.isPreview
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100'
                            "
                        >
                            {{ note.isPreview ? 'Edit' : 'Preview' }}
                        </button>
                    </div>
                    <div
                        v-if="note.isPreview"
                        class="overflow-y-auto px-2 py-1 max-w-none h-32 prose prose-sm"
                        v-html="renderMarkdown(note.content)"
                    ></div>
                    <textarea
                        v-else
                        v-model="note.content"
                        class="px-2 py-1 w-full h-32 font-mono rounded border"
                        placeholder="Note content (Markdown supported)"
                    ></textarea>
                    <div class="flex justify-between mt-2">
                        <span class="text-sm text-gray-500">
                            {{ new Date(note.date).toLocaleDateString() }}
                        </span>
                        <button
                            @click="deleteNote(note.id)"
                            class="text-red-600 hover:text-red-800"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </template>
        </draggable>
    </div>
</template>

<script setup>
import draggable from 'vuedraggable';
import { useLocalStorage } from '@vueuse/core';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import 'highlight.js/styles/github.css';
import hljs from 'highlight.js';

const { generateShareLink, getSharedData } = useShareLink();
const toast = useToast();

marked.setOptions({
    highlight: function (code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
    },
});

const notes = useLocalStorage('notes', []);

onMounted(async () => {
    const shared = await getSharedData();
    if (shared?.notes) {
        notes.value = shared.notes.map((note) => ({
            ...note,
            isPreview: false,
        }));
    }
});

const renderMarkdown = (content) => {
    return DOMPurify.sanitize(marked(content));
};

const addNote = () => {
    notes.value.unshift({
        id: Date.now(),
        title: '',
        content: '',
        date: new Date().toISOString(),
        isPreview: false,
    });
    toast.success('New note created');
};

const deleteNote = (id) => {
    notes.value = notes.value.filter((note) => note.id !== id);
    toast.success('Note deleted');
};

const shareNotes = async () => {
    const link = await generateShareLink('/tools/notes', {
        notes: notes.value,
    });
    if (link) {
        navigator.clipboard.writeText(link);
        toast.success('Share link copied to clipboard!');
    } else {
        toast.error('Failed to generate share link');
    }
};
</script>

<style>
.prose pre {
    background: #f6f8fa;
    padding: 1rem;
    border-radius: 0.375rem;
}

.prose code {
    color: #24292e;
    background: #f6f8fa;
    padding: 0.2em 0.4em;
    border-radius: 0.375rem;
}
</style>
