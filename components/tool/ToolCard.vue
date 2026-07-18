<template>
    <NuxtLink
        :to="tool.path"
        class="relative p-5 bg-white rounded-card border border-gray-100 shadow-sm transition-all duration-150 group hover:shadow-md hover:-translate-y-0.5 dark:bg-gray-800 dark:border-gray-700"
    >
        <div class="flex items-center space-x-4">
            <div
                class="p-2 rounded-lg transition-colors shrink-0 bg-primary-100 group-hover:bg-primary-200 dark:bg-primary-900/40 dark:group-hover:bg-primary-900/60"
            >
                <Icon
                    :icon="tool.icon"
                    class="w-6 h-6 text-primary-600 dark:text-primary-400"
                />
            </div>
            <div class="min-w-0">
                <div class="flex gap-2 items-center">
                    <h3
                        class="text-base font-semibold text-gray-900 truncate dark:text-gray-100"
                    >
                        {{ tool.name }}
                    </h3>
                    <span
                        v-if="tool.apiOnly"
                        class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                        title="Runs on the external ConversionTools API — needs an API key and uploads your file"
                    >
                        API
                    </span>
                </div>
                <p
                    class="text-sm text-gray-600 line-clamp-2 dark:text-gray-400"
                >
                    {{ tool.description }}
                </p>
            </div>
        </div>
        <ClientOnly>
            <button
                v-if="showFavorite"
                class="absolute top-2 right-2 p-1.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                :class="{ 'opacity-100': isFavorite(tool.path) }"
                :aria-label="
                    isFavorite(tool.path)
                        ? `Remove ${tool.name} from favorites`
                        : `Add ${tool.name} to favorites`
                "
                @click.prevent.stop="toggleFavorite(tool.path)"
            >
                <Icon
                    :icon="isFavorite(tool.path) ? 'mdi:star' : 'mdi:star-outline'"
                    class="w-4 h-4"
                    :class="
                        isFavorite(tool.path)
                            ? 'text-amber-400'
                            : 'text-gray-400 dark:text-gray-500'
                    "
                />
            </button>
        </ClientOnly>
    </NuxtLink>
</template>

<script setup>
import { Icon } from '@iconify/vue';
import { useToolUsage } from '@/composables/useToolUsage';

defineProps({
    tool: { type: Object, required: true },
    showFavorite: { type: Boolean, default: true },
});

const { isFavorite, toggleFavorite } = useToolUsage();
</script>
