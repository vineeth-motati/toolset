<template>
    <section v-if="related.length" class="mt-12">
        <h2
            class="mb-4 text-sm font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400"
        >
            Related tools
        </h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
import { useTools } from '@/composables/useTools';

const props = defineProps({
    tool: { type: Object, required: true },
});

const { all } = useTools();

const related = computed(() =>
    all
        .filter(
            (t) =>
                t.category === props.tool.category &&
                t.path !== props.tool.path
        )
        .slice(0, 4)
);
</script>
