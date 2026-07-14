<template>
    <TransitionRoot :show="isOpen" as="template" @after-leave="query = ''">
        <Dialog class="relative z-[60]" @close="close">
            <TransitionChild
                as="template"
                enter="duration-150 ease-out"
                enter-from="opacity-0"
                enter-to="opacity-100"
                leave="duration-100 ease-in"
                leave-from="opacity-100"
                leave-to="opacity-0"
            >
                <div
                    class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"
                    aria-hidden="true"
                />
            </TransitionChild>

            <div
                class="flex fixed inset-0 justify-center items-start p-4 pt-[15vh]"
            >
                <TransitionChild
                    as="template"
                    enter="duration-150 ease-out"
                    enter-from="opacity-0 scale-95"
                    enter-to="opacity-100 scale-100"
                    leave="duration-100 ease-in"
                    leave-from="opacity-100 scale-100"
                    leave-to="opacity-0 scale-95"
                >
                    <DialogPanel
                        class="overflow-hidden w-full max-w-lg bg-white rounded-xl border border-gray-200 shadow-2xl dark:bg-gray-800 dark:border-gray-700"
                    >
                        <Combobox @update:model-value="onSelect">
                            <div class="relative">
                                <Icon
                                    icon="heroicons:magnifying-glass"
                                    class="absolute left-4 top-1/2 w-5 h-5 text-gray-400 -translate-y-1/2"
                                />
                                <ComboboxInput
                                    class="py-3.5 pr-12 pl-11 w-full text-sm text-gray-900 bg-transparent border-b border-gray-200 focus:outline-none placeholder:text-gray-400 dark:text-gray-100 dark:border-gray-700"
                                    placeholder="Search tools…"
                                    @change="query = $event.target.value"
                                />
                                <kbd
                                    class="absolute right-4 top-1/2 px-1.5 py-0.5 text-xs text-gray-400 rounded border border-gray-200 -translate-y-1/2 dark:border-gray-600 dark:text-gray-500"
                                >
                                    esc
                                </kbd>
                            </div>

                            <ComboboxOptions
                                static
                                class="overflow-y-auto p-2 max-h-72"
                            >
                                <p
                                    v-if="!query.trim() && shownTools.length"
                                    class="px-3 py-1.5 text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500"
                                >
                                    {{
                                        recentTools.length
                                            ? 'Recent'
                                            : 'Popular'
                                    }}
                                </p>
                                <ComboboxOption
                                    v-for="tool in shownTools"
                                    :key="tool.path"
                                    v-slot="{ active }"
                                    :value="tool"
                                    as="template"
                                >
                                    <li
                                        :class="[
                                            'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer',
                                            active
                                                ? 'bg-primary-50 dark:bg-gray-700'
                                                : '',
                                        ]"
                                    >
                                        <span
                                            class="flex justify-center items-center w-8 h-8 rounded-md shrink-0 bg-primary-100 dark:bg-primary-900/40"
                                        >
                                            <Icon
                                                :icon="tool.icon"
                                                class="w-4 h-4 text-primary-600 dark:text-primary-400"
                                            />
                                        </span>
                                        <span class="min-w-0">
                                            <span
                                                class="block text-sm font-medium text-gray-900 truncate dark:text-gray-100"
                                            >
                                                {{ tool.name }}
                                            </span>
                                            <span
                                                class="block text-xs text-gray-500 truncate dark:text-gray-400"
                                            >
                                                {{ tool.description }}
                                            </span>
                                        </span>
                                    </li>
                                </ComboboxOption>
                                <p
                                    v-if="query.trim() && !shownTools.length"
                                    class="px-3 py-8 text-sm text-center text-gray-500 dark:text-gray-400"
                                >
                                    No tools match “{{ query }}”.
                                </p>
                            </ComboboxOptions>
                        </Combobox>
                    </DialogPanel>
                </TransitionChild>
            </div>
        </Dialog>
    </TransitionRoot>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
    Dialog,
    DialogPanel,
    Combobox,
    ComboboxInput,
    ComboboxOptions,
    ComboboxOption,
    TransitionRoot,
    TransitionChild,
} from '@headlessui/vue';
import { Icon } from '@iconify/vue';
import { useMagicKeys, whenever } from '@vueuse/core';
import { useTools } from '@/composables/useTools';
import { useToolUsage } from '@/composables/useToolUsage';
import { useCommandPalette } from '@/composables/useCommandPalette';

const router = useRouter();
const { byPath, popular, search } = useTools();
const { recents } = useToolUsage();
const { isOpen, open, close } = useCommandPalette();

const query = ref('');

const recentTools = computed(() =>
    recents.value.map((r) => byPath(r.path)).filter(Boolean)
);

const shownTools = computed(() => {
    if (query.value.trim()) return search(query.value);
    return recentTools.value.length ? recentTools.value : popular();
});

const onSelect = (tool) => {
    if (!tool) return;
    close();
    router.push(tool.path);
};

const keys = useMagicKeys({
    passive: false,
    onEventFired(e) {
        if (
            (e.metaKey || e.ctrlKey) &&
            e.key?.toLowerCase() === 'k' &&
            e.type === 'keydown'
        ) {
            e.preventDefault();
        }
    },
});
whenever(keys['meta+k'], open);
whenever(keys['ctrl+k'], open);
</script>
