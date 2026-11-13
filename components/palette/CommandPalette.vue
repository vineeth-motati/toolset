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
                    class="fixed inset-0 bg-gray-950/40 backdrop-blur-[2px]"
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
                        class="overflow-hidden w-full max-w-xl bg-white rounded-2xl border border-gray-200/80 shadow-pop ring-1 ring-black/5 dark:bg-gray-800 dark:border-gray-700 dark:ring-white/5"
                    >
                        <Combobox @update:model-value="onSelect">
                            <div class="relative">
                                <Icon
                                    icon="lucide:search"
                                    class="absolute left-5 top-1/2 w-5 h-5 text-gray-400 -translate-y-1/2"
                                />
                                <ComboboxInput
                                    class="pr-14 pl-12 w-full h-14 text-[15px] text-gray-900 bg-transparent border-b border-gray-100 focus:outline-none placeholder:text-gray-400 dark:text-gray-100 dark:border-gray-700"
                                    placeholder="Search tools…"
                                    @change="query = $event.target.value"
                                />
                                <kbd
                                    class="absolute right-4 top-1/2 -translate-y-1/2 kbd"
                                >
                                    esc
                                </kbd>
                            </div>

                            <ComboboxOptions
                                static
                                class="overflow-y-auto p-2 max-h-[min(60vh,420px)]"
                            >
                                <p
                                    v-if="!query.trim() && shownTools.length"
                                    class="px-3 pt-2 pb-1.5 eyebrow !text-[11px]"
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
                                            'flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer',
                                            active
                                                ? 'bg-gray-100 dark:bg-gray-700/70'
                                                : '',
                                        ]"
                                    >
                                        <ToolIcon :tool="tool" size="sm" />
                                        <span class="flex-1 min-w-0">
                                            <span
                                                class="flex gap-2 items-center"
                                            >
                                                <span
                                                    class="text-sm font-medium text-gray-900 truncate dark:text-gray-100"
                                                >
                                                    {{ tool.name }}
                                                </span>
                                                <span
                                                    v-if="tool.apiOnly"
                                                    class="api-tag"
                                                >
                                                    API
                                                </span>
                                            </span>
                                            <span
                                                class="block text-xs text-gray-500 truncate dark:text-gray-400"
                                            >
                                                {{ tool.description }}
                                            </span>
                                        </span>
                                        <Icon
                                            v-if="active"
                                            icon="lucide:corner-down-left"
                                            class="w-4 h-4 text-gray-400 shrink-0"
                                        />
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
import ToolIcon from '@/components/tool/ToolIcon.vue';
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
