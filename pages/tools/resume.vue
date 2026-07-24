<template>
    <ToolLayout>
        <template #actions>
            <BaseButton variant="ghost" size="sm" icon="mdi:file-plus-outline" @click="resume.createNew()">
                New
            </BaseButton>
            <BaseButton variant="secondary" size="sm" icon="mdi:upload" @click="importInput?.click()">
                Import
            </BaseButton>
            <BaseButton variant="secondary" size="sm" icon="mdi:share-variant" @click="share">
                Share
            </BaseButton>
            <div ref="exportRef" class="relative">
                <BaseButton size="sm" icon="mdi:download" @click="menuOpen = !menuOpen">
                    Download
                </BaseButton>
                <div
                    v-if="menuOpen"
                    class="absolute right-0 z-30 py-1 mt-1 w-48 bg-white rounded-lg border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700"
                >
                    <button class="flex gap-2 items-center px-3 py-2 w-full text-sm text-left text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700" @click="exportPdf">
                        <Icon icon="mdi:file-pdf-box" class="w-4 h-4" /> PDF
                    </button>
                    <button class="flex gap-2 items-center px-3 py-2 w-full text-sm text-left text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700" @click="exportJson">
                        <Icon icon="mdi:code-json" class="w-4 h-4" /> JSON Resume
                    </button>
                    <button class="flex gap-2 items-center px-3 py-2 w-full text-sm text-left text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700" @click="exportText">
                        <Icon icon="mdi:text-box-outline" class="w-4 h-4" /> Plain text
                    </button>
                </div>
            </div>
            <input ref="importInput" type="file" accept="application/json,.json" class="hidden" @change="onImport" />
        </template>

        <ClientOnly>
            <template #fallback>
                <div class="flex justify-center items-center rounded-card border border-gray-200 dark:border-gray-700 h-[calc(100dvh-9rem)] text-gray-400">
                    <Icon icon="mdi:loading" class="w-6 h-6 animate-spin" />
                </div>
            </template>
            <div class="flex flex-col rounded-card border border-gray-200 dark:border-gray-700 overflow-hidden h-[calc(100dvh-9rem)] lg:flex-row">
            <!-- Editor pane -->
            <div class="flex flex-col w-full min-h-0 border-b lg:w-1/2 lg:border-b-0 lg:border-r dark:border-gray-700">
                <div class="flex gap-1 p-2 border-b dark:border-gray-700 shrink-0">
                    <button
                        v-for="t in tabs"
                        :key="t.id"
                        type="button"
                        class="inline-flex gap-1.5 items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
                        :class="tab === t.id
                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'"
                        @click="tab = t.id"
                    >
                        <Icon :icon="t.icon" class="w-4 h-4" />
                        <span class="hidden sm:inline">{{ t.label }}</span>
                    </button>
                </div>
                <div class="overflow-y-auto flex-1 bg-gray-50 dark:bg-gray-900/40">
                    <ResumeEditor v-show="tab === 'content'" />
                    <ResumeTemplateTheme v-show="tab === 'design'" />
                    <ResumeAtsPanel v-show="tab === 'assist'" />
                    <ResumeManager v-show="tab === 'manage'" />
                </div>
            </div>

            <!-- Preview pane -->
            <div class="w-full min-h-0 lg:w-1/2">
                <ResumePreview :doc="current" />
            </div>
            </div>
        </ClientOnly>
    </ToolLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { onClickOutside } from '@vueuse/core';
import { useResume } from '~/composables/useResume';
import { useToast } from '~/composables/useToast';
import { useShareLink } from '~/composables/useShareLink';
import { showShareModal } from '~/composables/useShareModal';
import { isEmptyResume } from '~/utils/resume/schema';
import { toPlainText } from '~/utils/resume/plainText';
import {
    downloadPdf,
    downloadJsonResume,
    downloadPlainText,
} from '~/utils/resume/export';
import ResumeEditor from '~/components/resume/ResumeEditor.vue';
import ResumeTemplateTheme from '~/components/resume/TemplateTheme.vue';
import ResumeAtsPanel from '~/components/resume/AtsPanel.vue';
import ResumeManager from '~/components/resume/ResumeManager.vue';
import ResumePreview from '~/components/resume/ResumePreview.vue';

const resume = useResume();
const current = resume.current;
const toast = useToast();
const { generateShareLink, getSharedData } = useShareLink();

const tabs = [
    { id: 'content', label: 'Content', icon: 'mdi:format-list-bulleted' },
    { id: 'design', label: 'Design', icon: 'mdi:palette-outline' },
    { id: 'assist', label: 'Assist', icon: 'mdi:target' },
    { id: 'manage', label: 'Resumes', icon: 'mdi:folder-multiple-outline' },
];
const tab = ref('content');

const importInput = ref(null);
const exportRef = ref(null);
const menuOpen = ref(false);
onClickOutside(exportRef, () => (menuOpen.value = false));

async function exportPdf() {
    menuOpen.value = false;
    try {
        await downloadPdf(current.value);
    } catch (err) {
        toast.error(`PDF export failed: ${err?.message || err}`);
    }
}
function exportJson() {
    menuOpen.value = false;
    downloadJsonResume(current.value);
}
function exportText() {
    menuOpen.value = false;
    downloadPlainText(current.value, toPlainText(current.value));
}

async function onImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
        const json = JSON.parse(await file.text());
        resume.importJsonResume(json, file.name.replace(/\.json$/i, ''));
        tab.value = 'content';
        toast.success('Resume imported');
    } catch {
        toast.error('Could not import — is it a valid JSON Resume file?');
    }
    e.target.value = '';
}

async function share() {
    if (isEmptyResume(current.value)) {
        toast.error('Add some details before sharing.');
        return;
    }
    try {
        const link = await generateShareLink('/tools/resume', {
            resume: current.value,
        });
        if (link) showShareModal(link);
        else toast.error('Could not create a share link.');
    } catch {
        toast.error('Could not create a share link.');
    }
}

onMounted(async () => {
    const shared = await getSharedData();
    if (shared?.resume) {
        resume.loadInto(shared.resume);
        toast.success('Loaded shared resume!');
    }
});
</script>
