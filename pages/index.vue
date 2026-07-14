<template>
    <div class="mx-auto max-w-5xl">
        <!-- Hero -->
        <section class="mb-10 text-center">
            <h1
                class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600 dark:from-primary-400 dark:to-accent-400"
            >
                Tools-Set
            </h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
                Free, private, in-browser tools — nothing leaves your machine.
            </p>
            <div class="relative mx-auto mt-6 max-w-xl">
                <Icon
                    icon="heroicons:magnifying-glass"
                    class="absolute left-4 top-1/2 w-5 h-5 text-gray-400 -translate-y-1/2"
                />
                <input
                    v-model="query"
                    type="search"
                    placeholder="Search tools…"
                    class="py-3 pr-4 pl-12 w-full text-sm bg-white rounded-full border border-gray-200 shadow-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    aria-label="Search tools"
                />
            </div>
        </section>

        <!-- Search results -->
        <section v-if="query.trim()">
            <h2
                class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
                Results
            </h2>
            <div
                v-if="results.length"
                class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
                <ToolCard
                    v-for="tool in results"
                    :key="tool.path"
                    :tool="tool"
                />
            </div>
            <BaseEmptyState
                v-else
                icon="mdi:magnify-close"
                title="No tools found"
                :description="`Nothing matches “${query}”.`"
            />
        </section>

        <template v-else>
            <!-- Recents + Favorites (client-only: localStorage) -->
            <ClientOnly>
                <section v-if="recentTools.length" class="mb-10">
                    <h2
                        class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100"
                    >
                        Continue where you left off
                    </h2>
                    <div
                        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        <ToolCard
                            v-for="tool in recentTools"
                            :key="tool.path"
                            :tool="tool"
                        />
                    </div>
                </section>

                <section v-if="favoriteTools.length" class="mb-10">
                    <h2
                        class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100"
                    >
                        Favorites
                    </h2>
                    <div
                        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        <ToolCard
                            v-for="tool in favoriteTools"
                            :key="tool.path"
                            :tool="tool"
                        />
                    </div>
                </section>
            </ClientOnly>

            <!-- Category sections -->
            <section
                v-for="category in categoryList"
                :key="category.key"
                class="mb-10"
            >
                <div class="flex gap-3 items-center mb-4">
                    <h2
                        class="text-lg font-semibold text-gray-900 dark:text-gray-100"
                    >
                        {{ category.label }}
                    </h2>
                    <BaseBadge>{{ category.items.length }}</BaseBadge>
                </div>
                <div
                    class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                    <ToolCard
                        v-for="tool in category.items"
                        :key="tool.path"
                        :tool="tool"
                    />
                </div>
            </section>
        </template>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import { useTools } from '@/composables/useTools';
import { useToolUsage } from '@/composables/useToolUsage';

const { byPath, categories, search } = useTools();
const { recents, favorites } = useToolUsage();

useSeoMeta({
    title: 'Tools-Set — Free, Private, In-Browser Tools',
    description:
        'A collection of free online tools — JSON formatter, Kanban board, QR generator, converters and more. Runs entirely in your browser.',
});

const query = ref('');
const results = computed(() => search(query.value));
const categoryList = categories();

const recentTools = computed(() =>
    recents.value.map((r) => byPath(r.path)).filter(Boolean)
);
const favoriteTools = computed(() =>
    favorites.value.map((p) => byPath(p)).filter(Boolean)
);
</script>
