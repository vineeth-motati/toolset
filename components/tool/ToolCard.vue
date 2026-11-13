<template>
    <NuxtLink
        :to="tool.path"
        class="flex relative gap-3.5 items-start p-4 bg-white rounded-2xl border transition duration-200 group border-gray-200/80 hover:-translate-y-0.5 hover:shadow-lift hover:border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:bg-gray-800/60 dark:border-gray-700/70 dark:hover:border-gray-600 dark:hover:bg-gray-800"
    >
        <ToolIcon :tool="tool" />
        <div class="flex-1 pr-6 min-w-0">
            <div class="flex gap-2 items-center">
                <h3
                    class="text-[15px] font-semibold leading-5 text-gray-900 truncate dark:text-gray-100"
                >
                    {{ tool.name }}
                </h3>
                <span
                    v-if="tool.apiOnly"
                    class="api-tag"
                    title="Runs on the external ConversionTools API — needs an API key and uploads your file"
                >
                    API
                </span>
            </div>
            <p
                class="mt-1 text-[13px] leading-5 text-gray-500 line-clamp-2 dark:text-gray-400"
            >
                {{ tool.description }}
            </p>
        </div>
        <Icon
            icon="lucide:arrow-up-right"
            class="absolute right-3.5 bottom-3.5 w-4 h-4 text-gray-300 transition group-hover:text-gray-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-gray-600 dark:group-hover:text-white"
        />
        <ClientOnly>
            <button
                v-if="showFavorite"
                class="flex absolute top-2.5 right-2.5 justify-center items-center w-7 h-7 rounded-lg opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                :class="{ '!opacity-100': isFavorite(tool.path) }"
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
import ToolIcon from '@/components/tool/ToolIcon.vue';
import { useToolUsage } from '@/composables/useToolUsage';

defineProps({
    tool: { type: Object, required: true },
    showFavorite: { type: Boolean, default: true },
});

const { isFavorite, toggleFavorite } = useToolUsage();
</script>
