<template>
    <div class="p-4 space-y-3">
        <BaseButton icon="mdi:plus" class="w-full" @click="resume.createNew()">New resume</BaseButton>

        <div
            v-for="r in resume.resumes.value"
            :key="r.id"
            class="p-3 rounded-lg border transition-colors cursor-pointer"
            :class="r.id === resume.currentId.value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'"
            @click="resume.selectResume(r.id)"
        >
            <div class="flex justify-between items-center gap-2">
                <div class="min-w-0">
                    <input
                        v-if="r.id === resume.currentId.value"
                        v-model="r.name"
                        class="w-full text-sm font-medium text-gray-900 bg-transparent border-0 border-b border-transparent focus:border-primary-400 focus:outline-none dark:text-gray-100"
                        @click.stop
                    />
                    <p v-else class="text-sm font-medium text-gray-900 truncate dark:text-gray-100">{{ r.name || 'Untitled resume' }}</p>
                    <p class="text-xs text-gray-400">Edited {{ formatDate(r.updatedAt) }}</p>
                </div>
                <div class="flex gap-1 shrink-0">
                    <BaseIconButton icon="mdi:content-copy" label="Duplicate" @click.stop="resume.duplicateResume(r.id)" />
                    <BaseIconButton icon="mdi:trash-can-outline" label="Delete" variant="danger" @click.stop="confirmDelete(r.id)" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useResume } from '~/composables/useResume';

const resume = useResume();

function formatDate(ts) {
    return new Date(ts).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function confirmDelete(id) {
    if (resume.resumes.value.length === 1 || confirm('Delete this resume? This cannot be undone.')) {
        resume.deleteResume(id);
    }
}
</script>
