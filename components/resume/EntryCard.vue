<template>
    <div
        class="overflow-hidden bg-white rounded-xl border transition-colors dark:bg-gray-900/30"
        :class="open ? 'border-primary-300 dark:border-primary-500/40' : 'border-gray-200/80 dark:border-gray-700/70'"
    >
        <div class="flex gap-1 items-center px-2 py-1.5">
            <span
                class="entry-handle p-1 text-gray-300 cursor-grab hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400"
                aria-hidden="true"
            >
                <Icon icon="lucide:grip-vertical" class="w-4 h-4" />
            </span>

            <button
                type="button"
                class="flex flex-1 gap-2 items-center py-1 min-w-0 text-left rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                :aria-expanded="open"
                @click="$emit('update:open', !open)"
            >
                <Icon
                    icon="lucide:chevron-right"
                    class="w-4 h-4 text-gray-400 transition-transform shrink-0"
                    :class="open ? 'rotate-90' : ''"
                />
                <span class="min-w-0">
                    <span
                        class="block text-sm font-medium truncate"
                        :class="title ? 'text-gray-900 dark:text-white' : 'text-gray-400 italic'"
                    >
                        {{ title || placeholder }}
                    </span>
                    <span
                        v-if="subtitle || meta"
                        class="block text-[11px] text-gray-500 truncate dark:text-gray-400"
                    >
                        {{ [subtitle, meta].filter(Boolean).join(' · ') }}
                    </span>
                </span>
            </button>

            <BaseBadge v-if="badge" :variant="badgeVariant">{{ badge }}</BaseBadge>

            <div class="flex gap-0.5 items-center shrink-0">
                <BaseIconButton
                    icon="lucide:copy"
                    label="Duplicate entry"
                    @click="$emit('duplicate')"
                />
                <BaseIconButton
                    icon="lucide:trash-2"
                    label="Delete entry"
                    variant="danger"
                    @click="$emit('remove')"
                />
            </div>
        </div>

        <div v-if="open" class="px-3 pt-1 pb-3 border-t border-gray-200/80 dark:border-gray-700/70">
            <slot />
        </div>
    </div>
</template>

<script setup>
/**
 * Collapsible entry row. Collapsed, it shows the identity of the entry (role,
 * company, dates) so a ten-role resume is scannable; expanded, it hosts the
 * fields. Previously every entry was permanently expanded, which made the
 * editor a single unnavigable scroll.
 */
import { Icon } from '@iconify/vue';

defineProps({
    title: { type: String, default: '' },
    placeholder: { type: String, default: 'Untitled entry' },
    subtitle: { type: String, default: '' },
    meta: { type: String, default: '' },
    badge: { type: String, default: '' },
    badgeVariant: { type: String, default: 'warning' },
    open: { type: Boolean, default: false },
});

defineEmits(['update:open', 'duplicate', 'remove']);
</script>
