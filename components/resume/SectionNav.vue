<template>
    <nav class="flex flex-col h-full" aria-label="Resume sections">
        <!-- Score summary -->
        <button
            type="button"
            class="flex gap-3 items-center px-3 py-3 w-full text-left border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/60"
            :class="active === 'review' ? 'bg-gray-50 dark:bg-gray-800/60' : ''"
            @click="select('review')"
        >
            <ResumeScoreRing :value="score.total" :size="42" />
            <span class="min-w-0">
                <span class="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Resume score
                </span>
                <span class="block text-[11px] text-gray-500 truncate dark:text-gray-400">
                    {{ issueSummary }}
                </span>
            </span>
            <Icon icon="mdi:chevron-right" class="ml-auto w-4 h-4 text-gray-400 shrink-0" />
        </button>

        <div class="overflow-y-auto flex-1 px-2 py-3 space-y-4">
            <!-- Content -->
            <div>
                <p class="px-2 mb-1 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                    Content
                </p>

                <button type="button" :class="itemClass('basics')" @click="select('basics')">
                    <Icon icon="mdi:account-outline" class="w-4 h-4 shrink-0" />
                    <span class="flex-1 truncate">Personal details</span>
                    <ResumeProgressDot :value="basicsPct" />
                </button>

                <draggable
                    :model-value="order"
                    :item-key="(el) => el"
                    handle=".nav-handle"
                    :animation="150"
                    @update:model-value="resume.setSectionsOrder"
                >
                    <template #item="{ element: key }">
                        <div class="group relative">
                            <button type="button" :class="itemClass(`section:${key}`)" @click="select(`section:${key}`)">
                                <span
                                    class="nav-handle -ml-1 cursor-grab text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-gray-600"
                                    aria-hidden="true"
                                >
                                    <Icon icon="mdi:drag-vertical" class="w-3.5 h-3.5" />
                                </span>
                                <Icon
                                    :icon="SECTION_META[key].icon"
                                    class="w-4 h-4 shrink-0"
                                    :class="hidden(key) ? 'opacity-40' : ''"
                                />
                                <span class="flex-1 truncate" :class="hidden(key) ? 'line-through opacity-50' : ''">
                                    {{ SECTION_META[key].label }}
                                </span>
                                <span
                                    v-if="doc[key].length"
                                    class="text-[10px] tabular-nums text-gray-400"
                                >
                                    {{ doc[key].length }}
                                </span>
                                <ResumeProgressDot :value="doc[key].length ? 100 : 0" />
                            </button>
                            <button
                                type="button"
                                class="absolute right-1 top-1/2 p-1 text-gray-400 rounded opacity-0 transition-opacity -translate-y-1/2 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700"
                                :aria-label="hidden(key) ? `Show ${SECTION_META[key].label}` : `Hide ${SECTION_META[key].label}`"
                                :title="hidden(key) ? 'Show in PDF' : 'Hide from PDF'"
                                @click.stop="resume.toggleSection(key)"
                            >
                                <Icon :icon="hidden(key) ? 'mdi:eye-off-outline' : 'mdi:eye-outline'" class="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </template>
                </draggable>

                <button
                    v-for="cs in doc.meta.customSections"
                    :key="cs.id"
                    type="button"
                    :class="itemClass(`custom:${cs.id}`)"
                    @click="select(`custom:${cs.id}`)"
                >
                    <Icon icon="mdi:shape-outline" class="w-4 h-4 shrink-0" />
                    <span class="flex-1 truncate">{{ cs.title || 'Untitled section' }}</span>
                    <span class="text-[10px] tabular-nums text-gray-400">{{ cs.items.length }}</span>
                </button>

                <button
                    type="button"
                    class="flex gap-2 items-center px-2 py-1.5 mt-0.5 w-full text-xs font-medium rounded-lg transition-colors text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
                    @click="addCustom"
                >
                    <Icon icon="mdi:plus" class="w-4 h-4" />
                    Add custom section
                </button>
            </div>

            <!-- Tools -->
            <div>
                <p class="px-2 mb-1 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                    Refine
                </p>
                <button type="button" :class="itemClass('design')" @click="select('design')">
                    <Icon icon="mdi:palette-outline" class="w-4 h-4 shrink-0" />
                    <span class="flex-1 truncate">Template &amp; design</span>
                </button>
                <button type="button" :class="itemClass('tailor')" @click="select('tailor')">
                    <Icon icon="mdi:target" class="w-4 h-4 shrink-0" />
                    <span class="flex-1 truncate">Tailor to a job</span>
                    <BaseBadge v-if="hasJob" variant="primary">on</BaseBadge>
                </button>
                <button type="button" :class="itemClass('manage')" @click="select('manage')">
                    <Icon icon="mdi:folder-multiple-outline" class="w-4 h-4 shrink-0" />
                    <span class="flex-1 truncate">My resumes</span>
                    <span class="text-[10px] tabular-nums text-gray-400">{{ resume.resumes.value.length }}</span>
                </button>
            </div>
        </div>
    </nav>
</template>

<script setup>
/**
 * Left rail. Doubles as navigation, section ordering (drag), visibility toggle
 * and progress read-out — the Enhancv-style toolbox, minus the paywall. Order
 * here is the order in the PDF, which is the property that made the old
 * separate "drag to reorder" list redundant.
 */
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import draggable from 'vuedraggable';
import { useResume } from '~/composables/useResume';
import { SECTION_META } from '~/utils/resume/schema';
import { basicsCompleteness } from '~/utils/resume/score';
import ResumeScoreRing from '~/components/resume/ScoreRing.vue';
import ResumeProgressDot from '~/components/resume/ProgressDot.vue';

const props = defineProps({
    active: { type: String, required: true },
    score: { type: Object, required: true },
    hasJob: { type: Boolean, default: false },
});
const emit = defineEmits(['update:active']);

const resume = useResume();
const doc = resume.current;

const order = computed(() => doc.value.meta.sectionsOrder);
const basicsPct = computed(() => basicsCompleteness(doc.value));
const hidden = (key) => doc.value.meta.sectionVisibility[key] === false;

const issueSummary = computed(() => {
    const errors = props.score.issues.filter((i) => i.severity === 'error').length;
    const warnings = props.score.issues.filter((i) => i.severity === 'warning').length;
    if (!errors && !warnings) return 'Nothing blocking — looking good';
    const bits = [];
    if (errors) bits.push(`${errors} to fix`);
    if (warnings) bits.push(`${warnings} to improve`);
    return bits.join(' · ');
});

const select = (id) => emit('update:active', id);

const itemClass = (id) => [
    'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors text-left',
    props.active === id
        ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
];

function addCustom() {
    const cs = resume.addCustomSection();
    emit('update:active', `custom:${cs.id}`);
}
</script>
