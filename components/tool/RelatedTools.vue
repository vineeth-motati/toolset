<template>
    <section
        v-if="related.length"
        class="pt-10 mt-16 border-t border-gray-200/80 dark:border-gray-800"
    >
        <div class="flex gap-4 justify-between items-baseline mb-5">
            <h2
                class="text-lg font-bold tracking-tight text-gray-900 dark:text-white"
            >
                More in {{ label }}
            </h2>
            <NuxtLink
                :to="`/#cat-${tool.category}`"
                class="inline-flex gap-1 items-center text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
                View all
                <Icon icon="lucide:arrow-right" class="w-4 h-4" />
            </NuxtLink>
        </div>
        <div
            class="grid grid-cols-1 gap-3 sm:grid-cols-2"
            :class="narrow ? '' : 'xl:grid-cols-4'"
        >
            <ToolCard
                v-for="item in related"
                :key="item.path"
                :tool="item"
                :show-favorite="false"
            />
        </div>
    </section>
</template>

<script setup>
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import { useTools, CATEGORY_META } from '@/composables/useTools';

const props = defineProps({
    tool: { type: Object, required: true },
    narrow: { type: Boolean, default: false },
});

const { all } = useTools();

const label = computed(
    () => CATEGORY_META[props.tool.category]?.label || 'Tools-Set'
);

const related = computed(() => {
    const same = all.filter(
        (t) => t.category === props.tool.category && t.path !== props.tool.path
    );
    const fill = all.filter(
        (t) =>
            t.category !== props.tool.category &&
            t.path !== props.tool.path &&
            t.popular
    );
    return [...same, ...fill].slice(0, 4);
});
</script>
