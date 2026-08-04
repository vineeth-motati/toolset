<template>
    <div class="space-y-6">
        <!-- Templates -->
        <section>
            <h2 class="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">Template</h2>
            <p class="mb-3 text-xs text-gray-500 dark:text-gray-400">
                All three are single-column and parser-safe. Content is stored separately from design —
                switching template never touches what you wrote.
            </p>
            <div class="grid gap-2 sm:grid-cols-3">
                <button
                    v-for="tpl in templates"
                    :key="tpl.id"
                    type="button"
                    class="overflow-hidden text-left rounded-lg border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                    :class="doc.meta.template === tpl.id
                        ? 'border-primary-500 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'"
                    :aria-pressed="doc.meta.template === tpl.id"
                    @click="resume.setTemplate(tpl.id)"
                >
                    <!-- Wireframe thumbnail: cheap, and it survives theme changes -->
                    <div class="p-2.5 bg-white border-b border-gray-100 dark:bg-gray-900 dark:border-gray-800">
                        <div class="space-y-1" :class="tpl.id === 'classic' ? 'items-center flex flex-col' : ''">
                            <div
                                class="h-1.5 rounded-full"
                                :style="{ width: '55%', background: tpl.id === 'modern' ? theme.accent : '#111827' }"
                            />
                            <div class="h-1 rounded-full bg-gray-300 dark:bg-gray-600" style="width: 35%" />
                            <div class="h-px w-full my-1.5" :style="{ background: tpl.id === 'atsPlain' ? '#d1d5db' : theme.accent }" />
                            <div class="space-y-0.5 w-full" :class="tpl.id === 'classic' ? 'text-center' : ''">
                                <div class="h-1 rounded-full bg-gray-300 dark:bg-gray-600" style="width: 100%" />
                                <div class="h-1 rounded-full bg-gray-200 dark:bg-gray-700" style="width: 90%" />
                                <div class="h-1 rounded-full bg-gray-200 dark:bg-gray-700" style="width: 95%" />
                            </div>
                        </div>
                    </div>
                    <div class="p-2.5">
                        <div class="flex gap-1.5 items-center">
                            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ tpl.name }}</span>
                            <Icon
                                v-if="doc.meta.template === tpl.id"
                                icon="mdi:check-circle"
                                class="w-4 h-4 text-primary-600"
                            />
                        </div>
                        <p class="mt-0.5 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                            {{ tpl.description }}
                        </p>
                    </div>
                </button>
            </div>
        </section>

        <!-- Density -->
        <section>
            <div class="flex flex-wrap gap-2 justify-between items-center mb-2">
                <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">Density</h2>
                <BaseButton
                    size="sm"
                    variant="secondary"
                    icon="mdi:arrow-collapse-vertical"
                    :loading="fitting"
                    @click="fitToOnePage"
                >
                    Fit to one page
                </BaseButton>
            </div>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                    v-for="p in DENSITY_PRESETS"
                    :key="p.id"
                    type="button"
                    class="p-2.5 text-left rounded-lg border transition-colors"
                    :class="activeDensity === p.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'"
                    @click="applyDensity(p)"
                >
                    <span class="block text-sm font-medium text-gray-900 dark:text-gray-100">{{ p.label }}</span>
                    <span class="block mt-0.5 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                        {{ p.description }}
                    </span>
                </button>
            </div>
            <p v-if="fitMessage" class="mt-2 text-xs" :class="fitOk ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'">
                {{ fitMessage }}
            </p>
        </section>

        <!-- Accent -->
        <section>
            <h2 class="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">Accent colour</h2>
            <div class="flex flex-wrap gap-2 items-center">
                <button
                    v-for="c in ACCENT_PRESETS"
                    :key="c.value"
                    type="button"
                    class="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
                    :class="theme.accent.toLowerCase() === c.value ? 'border-gray-900 dark:border-white' : 'border-transparent'"
                    :style="{ backgroundColor: c.value }"
                    :aria-label="c.name"
                    :title="c.name"
                    @click="setAccent(c.value)"
                />
                <label
                    class="inline-flex gap-1.5 items-center px-2 py-1 ml-1 text-xs text-gray-600 rounded-lg border border-gray-300 cursor-pointer dark:border-gray-700 dark:text-gray-300"
                >
                    <Icon icon="mdi:eyedropper-variant" class="w-3.5 h-3.5" />
                    Custom
                    <input
                        :value="theme.accent"
                        type="color"
                        class="w-5 h-5 bg-transparent border-0 cursor-pointer"
                        aria-label="Custom accent colour"
                        @input="setAccent($event.target.value)"
                    />
                </label>
            </div>
            <p v-if="doc.meta.template === 'atsPlain'" class="mt-1.5 text-[11px] text-gray-400">
                The ATS Plain template renders in black regardless — that is the point of it.
            </p>
        </section>

        <!-- Page setup -->
        <section>
            <h2 class="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">Page</h2>
            <div class="grid gap-4 sm:grid-cols-2">
                <BaseSelect v-model="theme.pageSize" label="Paper size" :options="pageSizeOptions" />
                <div>
                    <label class="flex justify-between mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                        Margins <span class="tabular-nums text-gray-400">{{ theme.margins[0] }}pt</span>
                    </label>
                    <input
                        :value="theme.margins[0]"
                        type="range"
                        min="20"
                        max="72"
                        step="2"
                        class="w-full accent-primary-600"
                        aria-label="Page margins"
                        @input="setMargins(Number($event.target.value))"
                    />
                </div>
            </div>

            <div class="grid gap-4 mt-4 sm:grid-cols-3">
                <div v-for="s in sliders" :key="s.key">
                    <label class="flex justify-between mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                        {{ s.label }}
                        <span class="tabular-nums text-gray-400">{{ theme[s.key] }}{{ s.unit }}</span>
                    </label>
                    <input
                        v-model.number="theme[s.key]"
                        type="range"
                        :min="s.min"
                        :max="s.max"
                        :step="s.step"
                        class="w-full accent-primary-600"
                        :aria-label="s.label"
                    />
                </div>
            </div>
        </section>

        <!-- Photo -->
        <section>
            <h2 class="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">Photo</h2>
            <p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Rendered by the Modern template only. Downscaled to 320px and stored in this browser.
                <strong class="font-medium">US and UK employers generally prefer no photo</strong> — many
                parsers drop images, and some screening processes discard files that contain them.
            </p>
            <div class="flex gap-3 items-center">
                <img
                    v-if="doc.basics.photo"
                    :src="doc.basics.photo"
                    alt="Your resume photo"
                    class="object-cover w-14 h-14 rounded-full ring-1 ring-gray-200 dark:ring-gray-700"
                />
                <div
                    v-else
                    class="flex justify-center items-center w-14 h-14 text-gray-300 rounded-full bg-gray-100 dark:bg-gray-800 dark:text-gray-600"
                >
                    <Icon icon="mdi:account" class="w-7 h-7" />
                </div>
                <div class="flex gap-2">
                    <label
                        class="inline-flex gap-1 items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                        <Icon icon="mdi:upload" class="w-4 h-4" />
                        {{ doc.basics.photo ? 'Replace' : 'Upload' }}
                        <input type="file" accept="image/*" class="hidden" @change="onPhoto" />
                    </label>
                    <BaseButton v-if="doc.basics.photo" size="sm" variant="ghost" @click="removePhoto">
                        Remove
                    </BaseButton>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup>
/**
 * Template + design. Two things here are usually behind a paywall elsewhere:
 * density presets (one click instead of four sliders) and "fit to one page",
 * which walks the presets from roomy to dense and stops at the first that
 * actually renders on a single page — measured, not guessed.
 */
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import { useResume } from '~/composables/useResume';
import { useToast } from '~/composables/useToast';
import { templateList } from '~/utils/resume/templates';
import { PAGE_SIZES, DENSITY_PRESETS, ACCENT_PRESETS } from '~/utils/resume/schema';
import { countPages } from '~/utils/resume/export';

const resume = useResume();
const doc = resume.current;
const theme = computed(() => doc.value.meta.theme);
const templates = templateList();
const toast = useToast();

const pageSizeOptions = PAGE_SIZES.map((s) => ({
    label: s === 'A4' ? 'A4 (210 × 297 mm)' : 'US Letter (8.5 × 11 in)',
    value: s,
}));

const sliders = [
    { key: 'fontSize', label: 'Font size', unit: 'pt', min: 8, max: 13, step: 0.5 },
    { key: 'lineHeight', label: 'Line height', unit: '', min: 1, max: 1.8, step: 0.05 },
    { key: 'sectionSpacing', label: 'Section gap', unit: 'pt', min: 4, max: 24, step: 1 },
];

/** Which preset the current theme matches, if any — highlights the active card. */
const activeDensity = computed(() => {
    const t = theme.value;
    return (
        DENSITY_PRESETS.find(
            (p) =>
                p.theme.fontSize === t.fontSize &&
                p.theme.lineHeight === t.lineHeight &&
                p.theme.sectionSpacing === t.sectionSpacing &&
                p.theme.margins[0] === t.margins[0]
        )?.id ?? ''
    );
});

function applyDensity(preset) {
    Object.assign(theme.value, {
        ...preset.theme,
        margins: [...preset.theme.margins],
    });
    fitMessage.value = '';
    resume.touch();
}

function setAccent(value) {
    theme.value.accent = value;
    resume.touch();
}
function setMargins(value) {
    theme.value.margins = [value, value, value, value];
    resume.touch();
}

// --- fit to one page ---
const fitting = ref(false);
const fitMessage = ref('');
const fitOk = ref(false);

async function fitToOnePage() {
    fitting.value = true;
    fitMessage.value = '';
    const original = { ...theme.value, margins: [...theme.value.margins] };
    try {
        for (const preset of DENSITY_PRESETS) {
            applyDensity(preset);
            const pages = await countPages(doc.value);
            if (pages <= 1) {
                fitOk.value = true;
                fitMessage.value = `Fits on one page at "${preset.label}" density.`;
                return;
            }
        }
        // Nothing fit — put the theme back rather than leaving it at Dense.
        Object.assign(theme.value, original);
        fitOk.value = false;
        fitMessage.value =
            'Even the densest preset needs more than one page. Trim the oldest role, or hide a section — density restored.';
    } catch (err) {
        Object.assign(theme.value, original);
        toast.error(`Could not measure the page count: ${err?.message || err}`);
    } finally {
        fitting.value = false;
    }
}

// --- photo ---
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

function onPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        toast.error('That is not an image file.');
        return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
        toast.error('That image is over 8MB — try a smaller one.');
        return;
    }

    const reader = new FileReader();
    reader.onerror = () => toast.error('Could not read that file.');
    reader.onload = () => {
        const img = new Image();
        img.onerror = () => toast.error('Could not decode that image.');
        img.onload = () => {
            // Downscale hard: the data URL lives in localStorage (~5MB quota,
            // shared with every other saved resume).
            const MAX = 320;
            const scale = Math.min(1, MAX / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            doc.value.basics.photo = canvas.toDataURL('image/jpeg', 0.85);
            resume.touch();
            if (doc.value.meta.template !== 'modern') {
                toast.success('Photo saved — switch to the Modern template to show it.');
            }
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
}

function removePhoto() {
    doc.value.basics.photo = '';
    resume.touch();
}
</script>
