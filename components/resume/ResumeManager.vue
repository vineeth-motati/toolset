<template>
    <div class="space-y-4">
        <div class="flex flex-wrap gap-2 justify-between items-center">
            <div>
                <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">My resumes</h2>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                    Stored in this browser only. Keep one tailored version per role.
                </p>
            </div>
            <div class="flex gap-1.5">
                <BaseButton size="sm" variant="secondary" icon="mdi:file-star-outline" @click="loadSample">
                    Load example
                </BaseButton>
                <BaseButton size="sm" icon="mdi:plus" @click="resume.createNew()">New</BaseButton>
            </div>
        </div>

        <ul class="space-y-2">
            <li
                v-for="r in sorted"
                :key="r.id"
                class="flex gap-3 items-center p-3 rounded-lg border transition-colors"
                :class="r.id === resume.currentId.value
                    ? 'border-primary-400 bg-primary-50/60 dark:border-primary-700 dark:bg-primary-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'"
            >
                <button
                    type="button"
                    class="flex flex-1 gap-3 items-center min-w-0 text-left"
                    :aria-current="r.id === resume.currentId.value ? 'true' : undefined"
                    @click="resume.selectResume(r.id)"
                >
                    <span
                        class="flex justify-center items-center w-9 h-11 text-[9px] font-semibold rounded shrink-0"
                        :style="{ background: `${r.meta.theme.accent}1a`, color: r.meta.theme.accent }"
                    >
                        {{ initials(r) }}
                    </span>
                    <span class="min-w-0">
                        <span class="block text-sm font-medium text-gray-900 truncate dark:text-gray-100">
                            {{ r.name || 'Untitled resume' }}
                        </span>
                        <span class="block text-[11px] text-gray-500 dark:text-gray-400">
                            {{ describe(r) }}
                        </span>
                    </span>
                </button>

                <BaseBadge v-if="r.id === resume.currentId.value" variant="primary">Editing</BaseBadge>

                <div class="flex gap-0.5 shrink-0">
                    <BaseIconButton icon="mdi:pencil-outline" label="Rename" @click="startRename(r)" />
                    <BaseIconButton icon="mdi:content-copy" label="Duplicate" @click="resume.duplicateResume(r.id)" />
                    <BaseIconButton
                        icon="mdi:trash-can-outline"
                        label="Delete"
                        variant="danger"
                        @click="pendingDelete = r"
                    />
                </div>
            </li>
        </ul>

        <!-- Rename -->
        <UiModal
            :is-open="!!renaming"
            title="Rename resume"
            confirm-text="Save"
            @close="renaming = null"
            @confirm="commitRename"
        >
            <BaseInput
                v-model="renameValue"
                label="Name"
                placeholder="Frontend — Northwind application"
                hint="Only you see this. The PDF is named after you, not the resume."
                @keydown.enter="commitRename"
            />
        </UiModal>

        <!-- Delete confirm -->
        <UiModal
            :is-open="!!pendingDelete"
            title="Delete this resume?"
            confirm-text="Delete"
            @close="pendingDelete = null"
            @confirm="confirmDelete"
        >
            <p class="text-sm text-gray-600 dark:text-gray-300">
                <strong class="font-medium text-gray-900 dark:text-gray-100">
                    {{ pendingDelete?.name || 'Untitled resume' }}
                </strong>
                will be removed from this browser. There is no server copy and this cannot be undone —
                export it first if you might want it back.
            </p>
        </UiModal>
    </div>
</template>

<script setup>
/**
 * Resume library. Deletion goes through a real dialog rather than window.confirm
 * — this data exists in exactly one place (localStorage), so a mis-click is
 * genuinely unrecoverable and deserves the friction.
 */
import { ref, computed } from 'vue';
import { useResume } from '~/composables/useResume';
import { useToast } from '~/composables/useToast';
import UiModal from '~/components/ui/Modal.vue';

const resume = useResume();
const toast = useToast();

const renaming = ref(null);
const renameValue = ref('');
const pendingDelete = ref(null);

const sorted = computed(() =>
    [...resume.resumes.value].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
);

function initials(r) {
    const source = r.basics.name || r.name || '?';
    return source
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('') || '—';
}

function describe(r) {
    const roles = r.work.length;
    const when = new Date(r.updatedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
    const bits = [r.basics.label || r.basics.name].filter(Boolean);
    if (roles) bits.push(`${roles} role${roles === 1 ? '' : 's'}`);
    bits.push(`edited ${when}`);
    return bits.join(' · ');
}

function startRename(r) {
    renaming.value = r;
    renameValue.value = r.name;
}
function commitRename() {
    if (!renaming.value) return;
    resume.renameResume(renaming.value.id, renameValue.value.trim() || 'Untitled resume');
    renaming.value = null;
}

function confirmDelete() {
    const target = pendingDelete.value;
    pendingDelete.value = null;
    if (!target) return;
    resume.deleteResume(target.id);
    toast.success('Resume deleted');
}

function loadSample() {
    resume.loadSample();
    toast.success('Example resume loaded — edit it or delete it when you are done.');
}
</script>
