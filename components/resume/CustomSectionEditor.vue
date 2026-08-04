<template>
    <div v-if="section" class="space-y-3">
        <div class="flex flex-wrap gap-2 justify-between items-end">
            <div class="flex-1 min-w-[12rem]">
                <BaseInput
                    v-model="section.title"
                    label="Section title"
                    placeholder="Publications"
                    hint="Appears as a heading in the PDF, below the standard sections."
                />
            </div>
            <div class="flex gap-1.5 items-center">
                <BaseButton size="sm" icon="mdi:plus" @click="addItem">Add entry</BaseButton>
                <BaseIconButton
                    icon="mdi:trash-can-outline"
                    label="Delete this section"
                    variant="danger"
                    @click="$emit('remove', section.id)"
                />
            </div>
        </div>

        <BaseEmptyState
            v-if="!section.items.length"
            icon="mdi:shape-outline"
            title="No entries yet"
            description="Use custom sections for anything the standard ones don't cover — publications, patents, speaking, volunteering."
        >
            <template #action>
                <BaseButton icon="mdi:plus" @click="addItem">Add entry</BaseButton>
            </template>
        </BaseEmptyState>

        <draggable
            v-else
            v-model="section.items"
            :item-key="entryKey"
            handle=".entry-handle"
            :animation="150"
            class="space-y-2"
        >
            <template #item="{ element: item, index }">
                <ResumeEntryCard
                    :title="item.title"
                    placeholder="Untitled entry"
                    :subtitle="item.description"
                    :open="openSet.has(index)"
                    @update:open="setOpen(index, $event)"
                    @duplicate="duplicate(index)"
                    @remove="remove(index)"
                >
                    <BaseInput v-model="item.title" label="Title" placeholder="Scaling Design Systems (QCon 2024)" />
                    <BaseTextarea v-model="item.description" label="Detail" class="mt-3" :rows="2" />
                </ResumeEntryCard>
            </template>
        </draggable>
    </div>
</template>

<script setup>
/** Editor for one custom section — same entry affordances as a standard one. */
import { ref, computed, watch } from 'vue';
import draggable from 'vuedraggable';
import { useResume } from '~/composables/useResume';
import { entryKey } from '~/utils/resume/entryKey';
import ResumeEntryCard from '~/components/resume/EntryCard.vue';

const props = defineProps({
    sectionId: { type: String, required: true },
});
defineEmits(['remove']);

const resume = useResume();
const doc = resume.current;

const section = computed(() =>
    doc.value.meta.customSections.find((c) => c.id === props.sectionId)
);

const openSet = ref(new Set([0]));
const setOpen = (i, open) => {
    const next = new Set(openSet.value);
    open ? next.add(i) : next.delete(i);
    openSet.value = next;
};

watch(() => props.sectionId, () => (openSet.value = new Set([0])));

function addItem() {
    section.value.items.push({ title: '', description: '' });
    setOpen(section.value.items.length - 1, true);
    resume.touch();
}
function duplicate(i) {
    section.value.items.splice(i + 1, 0, { ...section.value.items[i] });
    resume.touch();
}
function remove(i) {
    section.value.items.splice(i, 1);
    openSet.value = new Set(
        [...openSet.value].filter((x) => x !== i).map((x) => (x > i ? x - 1 : x))
    );
    resume.touch();
}
</script>
