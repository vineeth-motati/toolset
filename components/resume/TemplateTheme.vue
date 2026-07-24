<template>
    <div class="p-4 space-y-4">
        <BaseCard padding="sm">
            <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Template</h3>
            <div class="grid grid-cols-1 gap-2">
                <button
                    v-for="tpl in templates"
                    :key="tpl.id"
                    type="button"
                    class="p-3 text-left rounded-lg border transition-colors"
                    :class="doc.meta.template === tpl.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'"
                    @click="resume.setTemplate(tpl.id)"
                >
                    <div class="flex gap-2 items-center text-sm font-medium text-gray-900 dark:text-gray-100">
                        {{ tpl.name }}
                        <BaseBadge v-if="tpl.supports.atsSafe" variant="success">ATS-safe</BaseBadge>
                    </div>
                    <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ tpl.description }}</p>
                </button>
            </div>
        </BaseCard>

        <BaseCard padding="sm">
            <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Style</h3>
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <label class="text-sm text-gray-700 dark:text-gray-300">Accent color</label>
                    <input v-model="theme.accent" type="color" class="w-10 h-8 bg-transparent rounded border border-gray-300 cursor-pointer dark:border-gray-600" />
                </div>
                <BaseSelect v-model="theme.pageSize" label="Page size" :options="pageSizeOptions" />
                <div>
                    <label class="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                        Font size <span class="text-gray-400">{{ theme.fontSize }}pt</span>
                    </label>
                    <input v-model.number="theme.fontSize" type="range" min="8" max="13" step="0.5" class="w-full accent-primary-600" />
                </div>
                <div>
                    <label class="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                        Line height <span class="text-gray-400">{{ theme.lineHeight }}</span>
                    </label>
                    <input v-model.number="theme.lineHeight" type="range" min="1" max="1.8" step="0.05" class="w-full accent-primary-600" />
                </div>
                <div>
                    <label class="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                        Section spacing <span class="text-gray-400">{{ theme.sectionSpacing }}</span>
                    </label>
                    <input v-model.number="theme.sectionSpacing" type="range" min="4" max="24" step="1" class="w-full accent-primary-600" />
                </div>
            </div>
        </BaseCard>

        <BaseCard padding="sm">
            <h3 class="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Photo</h3>
            <p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Used by the Modern template. Downscaled and stored locally.
            </p>
            <div class="flex gap-3 items-center">
                <img v-if="doc.basics.photo" :src="doc.basics.photo" alt="Photo" class="object-cover w-14 h-14 rounded-full" />
                <div class="flex gap-2">
                    <label class="inline-flex gap-1 items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
                        <Icon icon="mdi:upload" class="w-4 h-4" /> Upload
                        <input type="file" accept="image/*" class="hidden" @change="onPhoto" />
                    </label>
                    <BaseButton v-if="doc.basics.photo" size="sm" variant="ghost" @click="doc.basics.photo = ''">Remove</BaseButton>
                </div>
            </div>
        </BaseCard>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import { useResume } from '~/composables/useResume';
import { useToast } from '~/composables/useToast';
import { templateList } from '~/utils/resume/templates';
import { PAGE_SIZES } from '~/utils/resume/schema';

const resume = useResume();
const doc = resume.current;
const theme = computed(() => doc.value.meta.theme);
const templates = templateList();
const toast = useToast();

const pageSizeOptions = PAGE_SIZES.map((s) => ({
    label: s === 'A4' ? 'A4' : 'US Letter',
    value: s,
}));

// Downscale to keep the base64 payload small (localStorage ~5MB quota).
function onPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        const img = new Image();
        img.onload = () => {
            const MAX = 320;
            const scale = Math.min(1, MAX / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            doc.value.basics.photo = canvas.toDataURL('image/jpeg', 0.85);
            resume.touch();
        };
        img.onerror = () => toast.error('Could not read that image.');
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
}
</script>
