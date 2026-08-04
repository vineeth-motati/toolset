<template>
    <div class="space-y-1.5">
        <label
            v-if="label"
            :for="id"
            class="block text-xs font-medium text-gray-600 dark:text-gray-400"
        >
            {{ label }}
        </label>

        <div
            class="flex flex-wrap gap-1.5 items-center px-2 py-1.5 min-h-[2.375rem] bg-white rounded-lg border border-gray-300 transition-colors focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 dark:bg-gray-800 dark:border-gray-700"
            @click="focusInput"
        >
            <span
                v-for="(tag, i) in model"
                :key="`${tag}-${i}`"
                class="inline-flex gap-1 items-center py-0.5 pr-1 pl-2 max-w-full text-xs font-medium rounded text-primary-700 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-300"
            >
                <span class="truncate">{{ tag }}</span>
                <button
                    type="button"
                    class="rounded transition-colors hover:text-primary-900 dark:hover:text-primary-100 shrink-0"
                    :aria-label="`Remove ${tag}`"
                    @click.stop="removeAt(i)"
                >
                    <Icon icon="mdi:close" class="w-3 h-3" />
                </button>
            </span>

            <input
                :id="id"
                ref="input"
                v-model="draft"
                type="text"
                :placeholder="model.length ? '' : placeholder"
                class="flex-1 py-0.5 min-w-[6rem] text-sm text-gray-900 bg-transparent border-0 focus:outline-none focus:ring-0 dark:text-gray-100 placeholder:text-gray-400"
                @keydown.enter.prevent="commit()"
                @keydown.,.prevent="commit()"
                @keydown.tab="onTab"
                @keydown.backspace="onBackspace"
                @paste.prevent="onPaste"
                @blur="commit()"
            />
        </div>

        <p v-if="hint" class="text-[11px] text-gray-400">{{ hint }}</p>
    </div>
</template>

<script setup>
/**
 * Chip input for keyword-ish lists (skills, courses, interests). These used to
 * be a stack of full-width textareas — one per skill — which made a 20-skill
 * list a scrolling chore. Comma or Enter commits; paste splits on commas and
 * newlines so a list can be dropped in wholesale.
 */
import { ref, useId } from 'vue';
import { Icon } from '@iconify/vue';

defineProps({
    label: { type: String, default: '' },
    placeholder: { type: String, default: 'Type and press Enter' },
    hint: { type: String, default: '' },
});

const model = defineModel({ type: Array, default: () => [] });
const emit = defineEmits(['touch']);

const id = `tags-${useId()}`;
const input = ref(null);
const draft = ref('');

const focusInput = () => input.value?.focus();

function push(value) {
    const v = value.trim();
    // Case-insensitive dedupe — "React" and "react" are the same keyword.
    if (!v || model.value.some((t) => t.toLowerCase() === v.toLowerCase())) return;
    model.value.push(v);
    emit('touch');
}

function commit() {
    if (!draft.value.trim()) return;
    push(draft.value);
    draft.value = '';
}

function onTab(e) {
    // Only swallow Tab when there is something to commit, so focus still moves.
    if (draft.value.trim()) {
        e.preventDefault();
        commit();
    }
}

function onBackspace(e) {
    if (draft.value === '' && model.value.length) {
        e.preventDefault();
        removeAt(model.value.length - 1);
    }
}

function onPaste(e) {
    const text = e.clipboardData?.getData('text') ?? '';
    text.split(/[,\n\t;]+/).forEach(push);
    draft.value = '';
}

function removeAt(i) {
    model.value.splice(i, 1);
    emit('touch');
}
</script>
