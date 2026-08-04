<template>
    <div class="space-y-1.5">
        <div class="flex justify-between items-center">
            <label class="text-xs font-medium text-gray-600 dark:text-gray-400">
                {{ label }}
            </label>
            <span
                v-if="filled"
                class="text-[11px] tabular-nums"
                :class="strengthTone(avgStrength)"
                :title="`Average bullet strength across ${filled} bullet${filled === 1 ? '' : 's'}`"
            >
                {{ avgStrength }}% strength
            </span>
        </div>

        <draggable
            v-model="model"
            :item-key="(_, i) => i"
            handle=".bullet-handle"
            :animation="150"
            class="space-y-1.5"
        >
            <template #item="{ index }">
                <div class="group">
                    <div class="flex gap-1 items-start">
                        <button
                            type="button"
                            class="bullet-handle mt-2 cursor-grab text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-gray-500 dark:text-gray-600"
                            :aria-label="`Reorder bullet ${index + 1}`"
                            tabindex="-1"
                        >
                            <Icon icon="mdi:drag-vertical" class="w-4 h-4" />
                        </button>

                        <div class="relative flex-1 min-w-0">
                            <textarea
                                :ref="(el) => setRef(el, index)"
                                v-model="model[index]"
                                rows="1"
                                :placeholder="placeholder"
                                class="px-2.5 py-1.5 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 resize-none focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                                :style="{ height: heights[index] }"
                                @input="onInput($event, index)"
                                @keydown.enter.exact.prevent="insertAfter(index)"
                                @keydown.backspace="onBackspace($event, index)"
                            />
                            <!-- strength rail -->
                            <span
                                v-if="lints[index] && !lints[index].empty"
                                class="absolute left-0 bottom-1 w-0.5 rounded-full transition-all"
                                :class="strengthBg(lints[index].strength)"
                                :style="{ height: `calc(${lints[index].strength}% - 8px)` }"
                                aria-hidden="true"
                            />
                        </div>

                        <BaseIconButton
                            icon="mdi:close"
                            :label="`Remove bullet ${index + 1}`"
                            variant="danger"
                            class="mt-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                            @click="removeAt(index)"
                        />
                    </div>

                    <!-- inline coaching -->
                    <div
                        v-if="hintsFor(index).length"
                        class="flex flex-wrap gap-1 mt-1 ml-5"
                    >
                        <span
                            v-for="h in hintsFor(index)"
                            :key="h"
                            class="px-1.5 py-0.5 text-[10px] font-medium text-amber-700 rounded bg-amber-50 dark:bg-amber-900/25 dark:text-amber-300"
                        >
                            {{ h }}
                        </span>
                    </div>
                </div>
            </template>
        </draggable>

        <div class="flex gap-3 items-center">
            <button
                type="button"
                class="inline-flex gap-1 items-center text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                @click="add"
            >
                <Icon icon="mdi:plus" class="w-4 h-4" />
                {{ addLabel }}
            </button>
            <span class="text-[11px] text-gray-400">
                Press <kbd class="px-1 rounded border border-gray-300 dark:border-gray-600">Enter</kbd> for the next bullet
            </span>
        </div>
    </div>
</template>

<script setup>
/**
 * Achievement bullets with live coaching. Each line is scored offline by
 * utils/resume/lint.ts — action verb, a number, no duty language, sane length —
 * and the failing checks surface as chips right under the field, which is where
 * the paid builders put their (paid, server-side) "improve it" feedback.
 */
import { ref, computed, nextTick } from 'vue';
import { Icon } from '@iconify/vue';
import draggable from 'vuedraggable';
import { lintBullet, bulletHints } from '~/utils/resume/lint';

const props = defineProps({
    label: { type: String, default: 'Highlights' },
    placeholder: { type: String, default: 'Increased X by Y% by doing Z' },
    addLabel: { type: String, default: 'Add bullet' },
    /** Suppresses the coaching chips for lists that aren't achievements. */
    coach: { type: Boolean, default: true },
});

const model = defineModel({ type: Array, default: () => [] });
const emit = defineEmits(['touch']);

const inputs = ref([]);
const heights = ref([]);

const lints = computed(() => model.value.map((t) => lintBullet(t || '')));
const filled = computed(() => lints.value.filter((l) => !l.empty).length);
const avgStrength = computed(() => {
    const real = lints.value.filter((l) => !l.empty);
    if (!real.length) return 0;
    return Math.round(real.reduce((s, l) => s + l.strength, 0) / real.length);
});

function hintsFor(i) {
    if (!props.coach) return [];
    const l = lints.value[i];
    // Don't nag while the line is still being typed.
    return l && !l.empty && l.charCount > 12 ? bulletHints(l).slice(0, 3) : [];
}

const strengthTone = (v) =>
    v >= 75 ? 'text-green-600 dark:text-green-400'
    : v >= 50 ? 'text-amber-600 dark:text-amber-400'
    : 'text-gray-400';
const strengthBg = (v) =>
    v >= 75 ? 'bg-green-400' : v >= 50 ? 'bg-amber-400' : 'bg-gray-300 dark:bg-gray-600';

function setRef(el, i) {
    if (el) {
        inputs.value[i] = el;
        autosize(el, i);
    }
}
function autosize(el, i) {
    el.style.height = 'auto';
    heights.value[i] = `${el.scrollHeight}px`;
}
function onInput(e, i) {
    autosize(e.target, i);
    emit('touch');
}

async function focusAt(i) {
    await nextTick();
    inputs.value[i]?.focus();
}

function add() {
    model.value.push('');
    emit('touch');
    focusAt(model.value.length - 1);
}
function insertAfter(i) {
    model.value.splice(i + 1, 0, '');
    emit('touch');
    focusAt(i + 1);
}
function removeAt(i) {
    model.value.splice(i, 1);
    heights.value.splice(i, 1);
    inputs.value.splice(i, 1);
    emit('touch');
}
/** Backspace in an empty bullet removes it and lands on the previous one. */
function onBackspace(e, i) {
    if (e.target.value !== '' || model.value.length <= 1) return;
    e.preventDefault();
    removeAt(i);
    focusAt(Math.max(0, i - 1));
}
</script>
