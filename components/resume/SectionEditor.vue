<template>
    <div class="space-y-3">
        <!-- Section header -->
        <div class="flex flex-wrap gap-2 justify-between items-center">
            <div class="min-w-0">
                <h2 class="flex gap-2 items-center text-base font-semibold text-gray-900 dark:text-gray-100">
                    <Icon :icon="meta.icon" class="w-4.5 h-4.5 text-gray-400" />
                    {{ meta.label }}
                    <BaseBadge v-if="!visible" variant="neutral">Hidden</BaseBadge>
                </h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ meta.blurb }}</p>
            </div>
            <div class="flex gap-1.5 items-center shrink-0">
                <BaseIconButton
                    :icon="visible ? 'mdi:eye-outline' : 'mdi:eye-off-outline'"
                    :label="visible ? 'Hide this section from the PDF' : 'Show this section in the PDF'"
                    @click="resume.toggleSection(sectionKey)"
                />
                <BaseButton size="sm" icon="mdi:plus" @click="addEntry">
                    Add {{ meta.itemNoun }}
                </BaseButton>
            </div>
        </div>

        <p
            v-if="!visible"
            class="flex gap-1.5 items-start px-3 py-2 text-xs rounded-lg text-amber-800 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300"
        >
            <Icon icon="mdi:eye-off-outline" class="mt-px w-4 h-4 shrink-0" />
            This section is excluded from the PDF and every export. Its content is kept.
        </p>

        <!-- Entries -->
        <BaseEmptyState
            v-if="!items.length"
            :icon="meta.icon"
            :title="`No ${meta.itemNoun}s yet`"
            :description="meta.empty"
        >
            <template #action>
                <BaseButton icon="mdi:plus" @click="addEntry">Add {{ meta.itemNoun }}</BaseButton>
            </template>
        </BaseEmptyState>

        <draggable
            v-else
            :model-value="items"
            :item-key="entryKey"
            handle=".entry-handle"
            :animation="150"
            class="space-y-2"
            @update:model-value="reorder"
        >
            <template #item="{ element: item, index }">
                <ResumeEntryCard
                    :title="entryTitle(item)"
                    :placeholder="`Untitled ${meta.itemNoun}`"
                    :subtitle="entrySubtitle(item)"
                    :meta="entryMeta(item)"
                    :badge="entryBadge(item)"
                    :open="isOpen(index)"
                    @update:open="setOpen(index, $event)"
                    @duplicate="resume.duplicateItem(sectionKey, index)"
                    @remove="remove(index)"
                >
                    <!-- ------------------------------------------------ work -->
                    <template v-if="sectionKey === 'work'">
                        <div class="grid gap-3 sm:grid-cols-2">
                            <BaseInput v-model="item.position" label="Job title" placeholder="Senior Frontend Engineer" />
                            <BaseInput v-model="item.name" label="Company" placeholder="Northwind Software" />
                        </div>
                        <div class="grid gap-3 mt-3 sm:grid-cols-3">
                            <ResumeMonthYearField v-model="item.startDate" label="Start" />
                            <ResumeMonthYearField v-model="item.endDate" label="End" allow-present />
                            <BaseInput v-model="item.location" label="Location" placeholder="Remote" />
                        </div>
                        <BaseTextarea
                            v-model="item.summary"
                            label="Context (optional)"
                            class="mt-3"
                            :rows="2"
                            placeholder="One line on the team or scope — skip it if your bullets say enough."
                        />
                        <ResumeBulletList
                            v-model="item.highlights"
                            label="Achievements"
                            class="mt-3"
                            placeholder="Cut page load from 4.1s to 1.3s by code-splitting the dashboard"
                            @touch="resume.touch()"
                        />
                    </template>

                    <!-- ------------------------------------------- education -->
                    <template v-else-if="sectionKey === 'education'">
                        <div class="grid gap-3 sm:grid-cols-2">
                            <BaseInput v-model="item.institution" label="Institution" placeholder="University of Washington" />
                            <BaseInput v-model="item.studyType" label="Degree" placeholder="B.Sc." />
                            <BaseInput v-model="item.area" label="Field of study" placeholder="Computer Science" />
                            <BaseInput v-model="item.score" label="Grade (optional)" placeholder="3.8 GPA" />
                        </div>
                        <div class="grid gap-3 mt-3 sm:grid-cols-2">
                            <ResumeMonthYearField v-model="item.startDate" label="Start" />
                            <ResumeMonthYearField
                                v-model="item.endDate"
                                label="End"
                                allow-present
                                present-label="Currently studying"
                            />
                        </div>
                        <ResumeTagField
                            v-model="item.courses"
                            label="Relevant coursework (optional)"
                            class="mt-3"
                            placeholder="Distributed Systems"
                            @touch="resume.touch()"
                        />
                    </template>

                    <!-- ---------------------------------------------- skills -->
                    <template v-else-if="sectionKey === 'skills'">
                        <div class="grid gap-3 sm:grid-cols-2">
                            <BaseInput v-model="item.name" label="Group" placeholder="Languages" hint="e.g. Languages, Frameworks, Tooling" />
                            <BaseInput v-model="item.level" label="Level (optional)" placeholder="Advanced" />
                        </div>
                        <ResumeTagField
                            v-model="item.keywords"
                            label="Skills"
                            class="mt-3"
                            placeholder="TypeScript"
                            hint="Paste a comma-separated list to add them all at once."
                            @touch="resume.touch()"
                        />
                    </template>

                    <!-- -------------------------------------------- projects -->
                    <template v-else-if="sectionKey === 'projects'">
                        <div class="grid gap-3 sm:grid-cols-2">
                            <BaseInput v-model="item.name" label="Project" placeholder="Palette" />
                            <BaseInput v-model="item.url" label="Link" placeholder="https://github.com/…" />
                        </div>
                        <BaseTextarea
                            v-model="item.description"
                            label="What it is"
                            class="mt-3"
                            :rows="2"
                            placeholder="Open-source contrast checker for design systems."
                        />
                        <ResumeBulletList
                            v-model="item.highlights"
                            label="Highlights"
                            class="mt-3"
                            placeholder="Grew to 2.4k GitHub stars and 15k weekly downloads"
                            @touch="resume.touch()"
                        />
                    </template>

                    <!-- ---------------------------------------- certificates -->
                    <template v-else-if="sectionKey === 'certificates'">
                        <div class="grid gap-3 sm:grid-cols-2">
                            <BaseInput v-model="item.name" label="Certificate" placeholder="AWS Solutions Architect" />
                            <BaseInput v-model="item.issuer" label="Issuer" placeholder="Amazon Web Services" />
                            <ResumeMonthYearField v-model="item.date" label="Issued" />
                            <BaseInput v-model="item.url" label="Credential URL (optional)" placeholder="https://…" />
                        </div>
                    </template>

                    <!-- ---------------------------------------------- awards -->
                    <template v-else-if="sectionKey === 'awards'">
                        <div class="grid gap-3 sm:grid-cols-3">
                            <BaseInput v-model="item.title" label="Award" placeholder="Engineer of the Year" />
                            <BaseInput v-model="item.awarder" label="Awarded by" placeholder="Northwind Software" />
                            <ResumeMonthYearField v-model="item.date" label="Date" />
                        </div>
                        <BaseTextarea v-model="item.summary" label="Why (optional)" class="mt-3" :rows="2" />
                    </template>

                    <!-- ------------------------------------------- languages -->
                    <template v-else-if="sectionKey === 'languages'">
                        <div class="grid gap-3 sm:grid-cols-2">
                            <BaseInput v-model="item.language" label="Language" placeholder="Mandarin" />
                            <BaseSelect
                                v-model="item.fluency"
                                label="Fluency"
                                :options="FLUENCY_LEVELS"
                                placeholder="Select…"
                            />
                        </div>
                    </template>

                    <!-- ------------------------------------------- interests -->
                    <template v-else-if="sectionKey === 'interests'">
                        <BaseInput v-model="item.name" label="Interest" placeholder="Long-distance running" />
                        <ResumeTagField
                            v-model="item.keywords"
                            label="Detail (optional)"
                            class="mt-3"
                            placeholder="Marathons"
                            @touch="resume.touch()"
                        />
                    </template>

                    <!-- ------------------------------------------ references -->
                    <template v-else-if="sectionKey === 'references'">
                        <BaseInput v-model="item.name" label="Name and role" placeholder="Jordan Smith — Engineering Manager, Northwind" />
                        <BaseTextarea v-model="item.reference" label="Reference" class="mt-3" :rows="3" />
                    </template>
                </ResumeEntryCard>
            </template>
        </draggable>
    </div>
</template>

<script setup>
/**
 * Renders exactly one standard section. The workspace shows a single section at
 * a time (the resume.io / Novoresume stepped model) rather than one endless
 * form, so the editor pane always fits on screen and the rail can carry
 * per-section progress.
 */
import { ref, computed, watch, nextTick } from 'vue';
import { Icon } from '@iconify/vue';
import draggable from 'vuedraggable';
import { useResume } from '~/composables/useResume';
import { SECTION_META } from '~/utils/resume/schema';
import { dateRange } from '~/utils/resume/templates/shared';
import { entryKey } from '~/utils/resume/entryKey';
import ResumeEntryCard from '~/components/resume/EntryCard.vue';
import ResumeMonthYearField from '~/components/resume/fields/MonthYearField.vue';
import ResumeBulletList from '~/components/resume/fields/BulletList.vue';
import ResumeTagField from '~/components/resume/fields/TagField.vue';

const props = defineProps({
    sectionKey: { type: String, required: true },
    /** Entry index to expand and scroll to (set when jumping from the score panel). */
    focusIndex: { type: Number, default: null },
});

const resume = useResume();
const doc = resume.current;

const meta = computed(() => SECTION_META[props.sectionKey]);
const items = computed(() => doc.value[props.sectionKey]);
const visible = computed(() => doc.value.meta.sectionVisibility[props.sectionKey] !== false);

const FLUENCY_LEVELS = ['Native', 'Fluent', 'Professional', 'Intermediate', 'Basic'];

// Open state is per-index. A single entry starts expanded; longer lists start
// collapsed so the section reads as a list.
const openSet = ref(new Set(items.value.length === 1 ? [0] : []));
const isOpen = (i) => openSet.value.has(i);
function setOpen(i, open) {
    const next = new Set(openSet.value);
    open ? next.add(i) : next.delete(i);
    openSet.value = next;
}

// Switching sections resets which entries are expanded.
watch(
    () => props.sectionKey,
    () => {
        openSet.value = new Set(items.value.length === 1 ? [0] : []);
    }
);

watch(
    () => props.focusIndex,
    async (i) => {
        if (i === null || i === undefined) return;
        setOpen(i, true);
        await nextTick();
    },
    { immediate: true }
);

function addEntry() {
    resume.addItem(props.sectionKey);
    setOpen(items.value.length - 1, true);
}
function remove(index) {
    resume.removeItem(props.sectionKey, index);
    // Indexes above the removed one shift down by one.
    openSet.value = new Set(
        [...openSet.value].filter((i) => i !== index).map((i) => (i > index ? i - 1 : i))
    );
}
function reorder(next) {
    doc.value[props.sectionKey] = next;
    resume.touch();
}

// --- collapsed-row summaries, per section shape ---
function entryTitle(it) {
    switch (props.sectionKey) {
        case 'work': return it.position || it.name;
        case 'education': return it.institution;
        case 'skills': return it.name || (it.keywords[0] ?? '');
        case 'projects': return it.name;
        case 'certificates': return it.name;
        case 'awards': return it.title;
        case 'languages': return it.language;
        case 'interests': return it.name;
        case 'references': return it.name;
        default: return '';
    }
}
function entrySubtitle(it) {
    switch (props.sectionKey) {
        case 'work': return it.position && it.name ? it.name : '';
        case 'education': return [it.studyType, it.area].filter(Boolean).join(', ');
        case 'skills': return it.keywords.length ? `${it.keywords.length} skill${it.keywords.length === 1 ? '' : 's'}` : '';
        case 'projects': return it.description;
        case 'certificates': return it.issuer;
        case 'awards': return it.awarder;
        case 'languages': return it.fluency;
        case 'interests': return it.keywords.join(', ');
        default: return '';
    }
}
function entryMeta(it) {
    switch (props.sectionKey) {
        case 'work':
        case 'education':
            return dateRange(it.startDate, it.endDate);
        case 'certificates':
        case 'awards':
            return it.date || '';
        default:
            return '';
    }
}
/** A small nudge on the collapsed row, so problems are visible without expanding. */
function entryBadge(it) {
    if (props.sectionKey === 'work' && !it.highlights.some((h) => h.trim())) return 'No bullets';
    if (props.sectionKey === 'skills' && !it.keywords.length) return 'Empty';
    return '';
}
</script>
