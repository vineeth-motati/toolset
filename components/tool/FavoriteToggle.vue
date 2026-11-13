<template>
    <ClientOnly>
        <button
            type="button"
            class="inline-flex justify-center items-center w-9 h-9 bg-white rounded-lg border shadow-xs transition-colors border-gray-200 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700/70"
            :aria-pressed="starred"
            :aria-label="starred ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`"
            :title="starred ? 'Remove from favorites' : 'Add to favorites'"
            @click="toggleFavorite(tool.path)"
        >
            <Icon
                :icon="starred ? 'mdi:star' : 'mdi:star-outline'"
                class="w-[18px] h-[18px]"
                :class="starred ? 'text-amber-400' : 'text-gray-400 dark:text-gray-500'"
            />
        </button>
        <template #fallback>
            <span class="inline-block w-9 h-9"></span>
        </template>
    </ClientOnly>
</template>

<script setup>
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import { useToolUsage } from '@/composables/useToolUsage';

const props = defineProps({
    tool: { type: Object, required: true },
});

const { isFavorite, toggleFavorite } = useToolUsage();
const starred = computed(() => isFavorite(props.tool.path));
</script>
