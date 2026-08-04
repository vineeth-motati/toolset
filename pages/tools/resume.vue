<template>
    <ToolLayout size="full" class="flex flex-col gap-3 p-3 h-full">
        <template #actions>
            <!-- Save state: this tool has no server, so say so plainly -->
            <span
                class="hidden gap-1.5 items-center mr-1 text-xs text-gray-500 sm:inline-flex dark:text-gray-400"
                aria-live="polite"
            >
                <Icon
                    :icon="saveState === 'saving' ? 'mdi:cloud-sync-outline' : 'mdi:check-circle-outline'"
                    class="w-3.5 h-3.5"
                    :class="saveState === 'saving' ? 'text-amber-500' : 'text-green-500'"
                />
                {{ saveState === 'saving' ? 'Saving…' : 'Saved to this browser' }}
            </span>

            <!-- History is keyboard-driven; on phones the space is better spent
                 on the actions people actually reach for. -->
            <BaseIconButton
                icon="mdi:undo"
                label="Undo (Ctrl+Z)"
                class="hidden sm:inline-flex"
                :disabled="!resume.canUndo.value"
                @click="resume.undo"
            />
            <BaseIconButton
                icon="mdi:redo"
                label="Redo (Ctrl+Shift+Z)"
                class="hidden sm:inline-flex"
                :disabled="!resume.canRedo.value"
                @click="resume.redo"
            />

            <BaseButton variant="ghost" size="sm" icon="mdi:upload" @click="importInput?.click()">
                <span class="hidden sm:inline">Import</span>
            </BaseButton>
            <BaseButton variant="secondary" size="sm" icon="mdi:share-variant" @click="share">
                <span class="hidden sm:inline">Share</span>
            </BaseButton>

            <Menu as="div" class="relative">
                <MenuButton
                    class="inline-flex gap-1.5 justify-center items-center px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors bg-primary-600 hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
                >
                    <Icon :icon="exporting ? 'mdi:loading' : 'mdi:download'" class="w-4 h-4" :class="exporting ? 'animate-spin' : ''" />
                    Download
                    <Icon icon="mdi:chevron-down" class="w-3.5 h-3.5 opacity-70" />
                </MenuButton>
                <transition
                    enter-active-class="transition duration-100 ease-out"
                    enter-from-class="scale-95 opacity-0"
                    leave-active-class="transition duration-75 ease-in"
                    leave-to-class="scale-95 opacity-0"
                >
                    <MenuItems
                        class="absolute right-0 z-30 py-1 mt-1.5 w-64 bg-white rounded-lg border border-gray-200 shadow-lg origin-top-right focus:outline-none dark:bg-gray-800 dark:border-gray-700"
                    >
                        <MenuItem v-for="f in exportFormats" :key="f.id" v-slot="{ active }">
                            <button
                                type="button"
                                class="flex gap-2.5 items-start px-3 py-2 w-full text-left"
                                :class="active ? 'bg-gray-50 dark:bg-gray-700' : ''"
                                @click="f.run"
                            >
                                <Icon :icon="f.icon" class="mt-0.5 w-4 h-4 text-gray-400 shrink-0" />
                                <span>
                                    <span class="block text-sm text-gray-800 dark:text-gray-100">{{ f.label }}</span>
                                    <span class="block text-[11px] text-gray-500 dark:text-gray-400">{{ f.hint }}</span>
                                </span>
                            </button>
                        </MenuItem>
                    </MenuItems>
                </transition>
            </Menu>

            <input ref="importInput" type="file" accept="application/json,.json" class="hidden" @change="onImport" />
        </template>

        <ClientOnly>
            <template #fallback>
                <div class="flex flex-1 justify-center items-center text-gray-400 rounded-card border border-gray-200 dark:border-gray-700">
                    <Icon icon="mdi:loading" class="w-6 h-6 animate-spin" />
                </div>
            </template>

            <!-- First run -->
            <div
                v-if="showStart"
                class="overflow-hidden flex-1 min-h-0 rounded-card border border-gray-200 dark:border-gray-700"
            >
                <ResumeStartScreen
                    @scratch="dismissStart"
                    @sample="startWithSample"
                    @import="onImport"
                />
            </div>

            <!-- Workspace -->
            <div
                v-else
                class="flex overflow-hidden flex-1 min-h-0 bg-white rounded-card border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
            >
                <!-- Rail -->
                <aside class="hidden w-56 border-r border-gray-200 shrink-0 lg:block dark:border-gray-700">
                    <ResumeSectionNav v-model:active="active" :score="score" :job-label="jobLabel" />
                </aside>

                <!-- Editor -->
                <section
                    class="flex-col flex-1 min-w-0"
                    :class="view === 'edit' ? 'flex' : 'hidden lg:flex'"
                >
                    <!-- Editor top bar -->
                    <div
                        class="flex gap-2 items-center px-3 py-2 border-b border-gray-200 shrink-0 dark:border-gray-700"
                    >
                        <BaseIconButton
                            icon="mdi:menu"
                            label="Open sections"
                            class="lg:hidden"
                            @click="drawerOpen = true"
                        />
                        <input
                            v-model="docName"
                            class="flex-1 min-w-0 text-sm font-medium text-gray-900 bg-transparent rounded border-0 focus:outline-none focus:ring-1 focus:ring-primary-400 px-1.5 py-1 dark:text-gray-100"
                            aria-label="Resume name"
                            placeholder="Untitled resume"
                        />
                        <span class="hidden text-[11px] text-gray-400 sm:inline">
                            {{ pageCount ? `${pageCount} page${pageCount === 1 ? '' : 's'}` : '' }}
                        </span>
                    </div>

                    <div ref="editorScroll" class="overflow-y-auto flex-1 p-4">
                        <ResumeBasicsEditor v-if="active === 'basics'" />
                        <ResumeSectionEditor
                            v-else-if="activeSectionKey"
                            :key="active"
                            :section-key="activeSectionKey"
                            :focus-index="focusIndex"
                        />
                        <ResumeCustomSectionEditor
                            v-else-if="activeCustomId"
                            :key="active"
                            :section-id="activeCustomId"
                            @remove="onRemoveCustom"
                        />
                        <ResumeDesignPanel v-else-if="active === 'design'" />
                        <ResumeReviewPanel v-else-if="active === 'review'" :score="score" @jump="jump" />
                        <ResumeTailorPanel v-else-if="active === 'tailor'" v-model:job="job" />
                        <ResumeManager v-else-if="active === 'manage'" />
                    </div>

                    <!-- Mobile view switch -->
                    <div class="flex gap-1 p-2 border-t border-gray-200 lg:hidden shrink-0 dark:border-gray-700">
                        <button
                            v-for="v in views"
                            :key="v.id"
                            type="button"
                            class="flex flex-1 gap-1.5 justify-center items-center py-1.5 text-xs font-medium rounded-lg transition-colors"
                            :class="view === v.id
                                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                                : 'text-gray-600 dark:text-gray-300'"
                            @click="view = v.id"
                        >
                            <Icon :icon="v.icon" class="w-4 h-4" />
                            {{ v.label }}
                        </button>
                    </div>
                </section>

                <!-- Preview -->
                <aside
                    class="flex-col w-full border-l border-gray-200 lg:w-[38%] xl:w-[42%] lg:flex shrink-0 dark:border-gray-700"
                    :class="view === 'preview' ? 'flex' : 'hidden'"
                >
                    <ResumePdfPreview :doc="current" class="flex-1 min-h-0" @pages="pageCount = $event" />
                    <div class="flex gap-1 p-2 border-t border-gray-200 lg:hidden shrink-0 dark:border-gray-700">
                        <button
                            v-for="v in views"
                            :key="v.id"
                            type="button"
                            class="flex flex-1 gap-1.5 justify-center items-center py-1.5 text-xs font-medium rounded-lg transition-colors"
                            :class="view === v.id
                                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                                : 'text-gray-600 dark:text-gray-300'"
                            @click="view = v.id"
                        >
                            <Icon :icon="v.icon" class="w-4 h-4" />
                            {{ v.label }}
                        </button>
                    </div>
                </aside>
            </div>

            <!-- Mobile rail drawer -->
            <TransitionRoot :show="drawerOpen" as="template">
                <Dialog class="relative z-50 lg:hidden" @close="drawerOpen = false">
                    <TransitionChild
                        as="template"
                        enter="duration-200 ease-out"
                        enter-from="opacity-0"
                        leave="duration-150 ease-in"
                        leave-to="opacity-0"
                    >
                        <div class="fixed inset-0 bg-black/30" />
                    </TransitionChild>
                    <TransitionChild
                        as="template"
                        enter="duration-200 ease-out"
                        enter-from="-translate-x-full"
                        leave="duration-150 ease-in"
                        leave-to="-translate-x-full"
                    >
                        <DialogPanel
                            class="flex fixed inset-y-0 left-0 flex-col w-64 bg-white shadow-xl dark:bg-gray-800"
                        >
                            <ResumeSectionNav
                                :active="active"
                                :score="score"
                                :job-label="jobLabel"
                                @update:active="onDrawerNav"
                            />
                        </DialogPanel>
                    </TransitionChild>
                </Dialog>
            </TransitionRoot>
        </ClientOnly>
    </ToolLayout>
</template>

<script setup>
/**
 * Resume Builder workspace: nav rail · focused section editor · live preview.
 *
 * The rail owns navigation, section order and visibility; the editor shows one
 * section at a time (the stepped model resume.io and Novoresume use) so the
 * form never turns into an endless scroll; the preview is a real rasterised PDF
 * that reports its page count back for the score.
 */
import { ref, computed, watch, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import {
    Menu,
    MenuButton,
    MenuItems,
    MenuItem,
    Dialog,
    DialogPanel,
    TransitionRoot,
    TransitionChild,
} from '@headlessui/vue';
import { useLocalStorage, useEventListener } from '@vueuse/core';
import { useResume } from '~/composables/useResume';
import { useToast } from '~/composables/useToast';
import { useShareLink } from '~/composables/useShareLink';
import { showShareModal } from '~/composables/useShareModal';
import { isEmptyResume } from '~/utils/resume/schema';
import { analyzeResume } from '~/utils/resume/score';
import { toPlainText } from '~/utils/resume/plainText';
import {
    downloadPdf,
    downloadDocx,
    downloadJsonResume,
    downloadPlainText,
} from '~/utils/resume/export';
import ResumeStartScreen from '~/components/resume/StartScreen.vue';
import ResumeSectionNav from '~/components/resume/SectionNav.vue';
import ResumeBasicsEditor from '~/components/resume/BasicsEditor.vue';
import ResumeSectionEditor from '~/components/resume/SectionEditor.vue';
import ResumeCustomSectionEditor from '~/components/resume/CustomSectionEditor.vue';
import ResumeDesignPanel from '~/components/resume/DesignPanel.vue';
import ResumeReviewPanel from '~/components/resume/ReviewPanel.vue';
import ResumeTailorPanel from '~/components/resume/TailorPanel.vue';
import ResumeManager from '~/components/resume/ResumeManager.vue';
import ResumePdfPreview from '~/components/resume/PdfPreview.vue';

const resume = useResume();
const current = resume.current;
const saveState = resume.saveState;
const toast = useToast();
const { generateShareLink, getSharedData } = useShareLink();

// ------------------------------------------------------------------ navigation
const active = ref('basics');
const focusIndex = ref(null);
const view = ref('edit'); // mobile only
const drawerOpen = ref(false);
const editorScroll = ref(null);

const views = [
    { id: 'edit', label: 'Edit', icon: 'mdi:pencil-outline' },
    { id: 'preview', label: 'Preview', icon: 'mdi:file-document-outline' },
];

const activeSectionKey = computed(() =>
    active.value.startsWith('section:') ? active.value.slice(8) : null
);
const activeCustomId = computed(() =>
    active.value.startsWith('custom:') ? active.value.slice(7) : null
);

// Every pane change starts at the top of the editor pane.
watch(active, () => {
    if (editorScroll.value) editorScroll.value.scrollTop = 0;
});

function onDrawerNav(next) {
    active.value = next;
    drawerOpen.value = false;
    view.value = 'edit';
}

/** Deep-link from a score issue to the field that raised it. */
function jump(target) {
    focusIndex.value = target.index ?? null;
    if (target.section === 'basics') active.value = 'basics';
    else if (target.section === 'design') active.value = 'design';
    else active.value = `section:${target.section}`;
    view.value = 'edit';
}

function onRemoveCustom(id) {
    resume.removeCustomSection(id);
    active.value = 'basics';
}

// ----------------------------------------------------------------- doc + score
const docName = computed({
    get: () => current.value.name,
    set: (v) => resume.renameResume(current.value.id, v),
});

const pageCount = ref(0);

// One target posting per resume, so switching between tailored versions keeps
// each one's context. Stored outside the resume doc — it is application
// metadata, not part of the JSON Resume export.
const EMPTY_JOB = { description: '', title: '', company: '' };
const jobStore = useLocalStorage('resume-builder-jobs', {});

/** Earlier builds stored a bare description string under this key. */
function normalizeJob(stored) {
    if (typeof stored === 'string') return { ...EMPTY_JOB, description: stored };
    return { ...EMPTY_JOB, ...(stored ?? {}) };
}

const job = computed({
    get: () => normalizeJob(jobStore.value[current.value.id]),
    set: (v) => {
        const id = current.value.id;
        if (v.description.trim() || v.title.trim() || v.company.trim()) {
            jobStore.value = { ...jobStore.value, [id]: v };
        } else {
            const { [id]: _drop, ...rest } = jobStore.value;
            jobStore.value = rest;
        }
    },
});

const score = computed(() =>
    analyzeResume(current.value, {
        pageCount: pageCount.value || undefined,
        jobDescription: job.value.description,
    })
);

/** "Senior Engineer at Northwind" for the rail, when the user named the job. */
const jobLabel = computed(() => {
    const { title, company, description } = job.value;
    if (title && company) return `${title} at ${company}`;
    if (title || company) return title || company;
    return description.trim() ? 'Posting saved' : '';
});

// ----------------------------------------------------------------- first run
const startDismissed = useLocalStorage('resume-builder-started', false);
const showStart = computed(
    () =>
        !startDismissed.value &&
        resume.resumes.value.length === 1 &&
        isEmptyResume(current.value)
);
const dismissStart = () => (startDismissed.value = true);

function startWithSample() {
    resume.loadSample();
    dismissStart();
    toast.success('Example loaded — edit it into your own, or delete it later.');
}

// -------------------------------------------------------------------- exports
const exporting = ref(false);

const exportFormats = [
    {
        id: 'pdf',
        icon: 'mdi:file-pdf-box',
        label: 'PDF',
        hint: 'Text-based and selectable — what you send to employers',
        run: () => exportPdf(),
    },
    {
        id: 'docx',
        icon: 'mdi:file-word-box',
        label: 'Word (.docx)',
        hint: 'Editable, and what some employers still insist on',
        run: () => exportDocx(),
    },
    {
        id: 'txt',
        icon: 'mdi:text-box-outline',
        label: 'Plain text',
        hint: 'For pasting into an ATS web form',
        run: () => exportText(),
    },
    {
        id: 'json',
        icon: 'mdi:code-json',
        label: 'JSON Resume',
        hint: 'Open jsonresume.org format — your data, portable',
        run: () => exportJson(),
    },
];

async function exportPdf() {
    exporting.value = true;
    try {
        await downloadPdf(current.value);
        dismissStart();
    } catch (err) {
        toast.error(`PDF export failed: ${err?.message || err}`);
    } finally {
        exporting.value = false;
    }
}
async function exportDocx() {
    exporting.value = true;
    try {
        await downloadDocx(current.value);
        dismissStart();
    } catch (err) {
        toast.error(`Word export failed: ${err?.message || err}`);
    } finally {
        exporting.value = false;
    }
}
const exportJson = () => downloadJsonResume(current.value);
const exportText = () => downloadPlainText(current.value, toPlainText(current.value));

// -------------------------------------------------------------- import/share
const importInput = ref(null);

async function onImport(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
        const json = JSON.parse(await file.text());
        resume.importJsonResume(json, file.name.replace(/\.json$/i, ''));
        active.value = 'basics';
        dismissStart();
        toast.success('Resume imported');
    } catch {
        toast.error('Could not import that file — is it a valid JSON Resume export?');
    }
}

async function share() {
    if (isEmptyResume(current.value)) {
        toast.error('Add some details before sharing.');
        return;
    }
    try {
        const link = await generateShareLink('/tools/resume', { resume: current.value });
        if (link) showShareModal(link);
        else toast.error('Could not create a share link.');
    } catch {
        toast.error('Could not create a share link.');
    }
}

// ----------------------------------------------------------------- shortcuts
/** True while the caret is in a field the browser can undo natively. */
function inTextField(target) {
    const el = target;
    if (!el || !el.tagName) return false;
    return (
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.isContentEditable === true
    );
}

useEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;
    const key = e.key.toLowerCase();
    if (key === 'z' || key === 'y') {
        // Inside a text field, Ctrl+Z must still undo typing — taking it over
        // there would be worse than not offering document undo at all.
        if (inTextField(e.target)) return;
        e.preventDefault();
        key === 'y' || e.shiftKey ? resume.redo() : resume.undo();
    } else if (key === 's') {
        e.preventDefault();
        exportPdf();
    }
});

onMounted(async () => {
    const shared = await getSharedData();
    if (shared?.resume) {
        resume.loadInto(shared.resume);
        dismissStart();
        toast.success('Loaded shared resume');
    }
});
</script>
