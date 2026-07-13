<template>
    <ToolLayout>
        <template #actions>
            <BaseButton icon="mdi:plus" size="sm" @click="addNote">
                New Note
            </BaseButton>
            <BaseButton
                variant="secondary"
                icon="mdi:share-variant"
                size="sm"
                @click="shareNotes"
            >
                Share Notes
            </BaseButton>
        </template>

        <div class="mx-auto max-w-4xl">
            <draggable
                v-model="notes"
                class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                item-key="id"
                :animation="150"
            >
                <template #item="{ element: note }">
                    <BaseCard>
                        <BaseInput
                            v-model="note.title"
                            placeholder="Note title"
                        />
                        <div class="flex gap-2 my-2">
                            <BaseButton
                                :variant="note.isPreview ? 'primary' : 'secondary'"
                                size="sm"
                                @click="note.isPreview = !note.isPreview"
                            >
                                {{ note.isPreview ? 'Edit' : 'Preview' }}
                            </BaseButton>
                        </div>
                        <div
                            v-if="note.isPreview"
                            class="overflow-y-auto px-2 py-1 max-w-none h-32 prose prose-sm dark:prose-invert"
                            v-html="renderMarkdown(note.content)"
                        ></div>
                        <BaseTextarea
                            v-else
                            v-model="note.content"
                            :rows="4"
                            placeholder="Note content (Markdown supported)"
                        />
                        <div class="flex justify-between items-center mt-2">
                            <span class="text-sm text-gray-500 dark:text-gray-400">
                                {{ new Date(note.date).toLocaleDateString() }}
                            </span>
                            <BaseIconButton
                                icon="mdi:delete-outline"
                                label="Delete note"
                                variant="danger"
                                @click="deleteNote(note.id)"
                            />
                        </div>
                    </BaseCard>
                </template>
            </draggable>
        </div>
    </ToolLayout>
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

.dark .prose pre,
.dark .prose code {
    background: #1f2937;
    color: #e5e7eb;
}
</style>
