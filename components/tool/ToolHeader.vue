<template>
    <div v-if="compact" class="flex gap-3 items-center mb-3 min-h-[40px]">
        <slot name="leading">
            <NuxtLink
                :to="parent.to"
                :aria-label="`Back to ${parent.label}`"
                :title="parent.label"
                class="inline-flex justify-center items-center w-8 h-8 text-gray-500 rounded-lg transition-colors shrink-0 hover:bg-gray-200/70 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
                <Icon icon="lucide:arrow-left" class="w-[18px] h-[18px]" />
            </NuxtLink>
        </slot>
        <ToolIcon :tool="tool" :icon="tool?.icon || icon" size="sm" />
        <div class="flex gap-3 items-baseline min-w-0">
            <h1
                class="text-base font-semibold tracking-tight text-gray-900 whitespace-nowrap dark:text-white"
            >
                {{ tool?.name || title }}
            </h1>
            <p
                v-if="tool?.description || description"
                class="hidden text-sm text-gray-500 truncate md:block dark:text-gray-400"
            >
                {{ tool?.description || description }}
            </p>
        </div>
        <div class="flex gap-2 items-center ml-auto shrink-0">
            <slot name="actions" />
            <FavoriteToggle v-if="tool" :tool="tool" />
        </div>
    </div>

    <div v-else class="mb-7 sm:mb-8">
        <nav
            class="flex flex-wrap gap-1.5 items-center mb-5 text-[13px] text-gray-500 dark:text-gray-400"
            aria-label="Breadcrumb"
        >
            <slot name="leading" />
            <NuxtLink
                to="/"
                class="transition-colors hover:text-gray-900 dark:hover:text-white"
                >All tools</NuxtLink
            >
            <template v-if="crumb">
                <Icon
                    icon="lucide:chevron-right"
                    class="w-3.5 h-3.5 text-gray-300 dark:text-gray-600"
                />
                <NuxtLink
                    :to="crumb.to"
                    class="transition-colors hover:text-gray-900 dark:hover:text-white"
                    >{{ crumb.label }}</NuxtLink
                >
            </template>
            <Icon
                icon="lucide:chevron-right"
                class="w-3.5 h-3.5 text-gray-300 dark:text-gray-600"
            />
            <span
                class="font-medium text-gray-700 truncate dark:text-gray-200"
                aria-current="page"
                >{{ tool?.name || title }}</span
            >
        </nav>

        <div
            class="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center"
        >
            <div class="flex gap-4 items-center min-w-0">
                <ToolIcon
                    :tool="tool"
                    :icon="tool?.icon || icon"
                    size="lg"
                    class="!w-[52px] !h-[52px] !rounded-2xl"
                />
                <div class="min-w-0">
                    <div class="flex gap-2 items-center">
                        <h1
                            class="text-2xl font-bold tracking-[-0.025em] text-gray-900 sm:text-[28px] sm:leading-9 dark:text-white"
                        >
                            {{ tool?.name || title }}
                        </h1>
                        <span v-if="tool?.apiOnly" class="api-tag">API</span>
                    </div>
                    <p
                        v-if="tool?.description || description"
                        class="mt-0.5 text-sm text-gray-500 sm:text-[15px] dark:text-gray-400"
                    >
                        {{ tool?.description || description }}
                    </p>
                </div>
            </div>
            <div class="flex flex-wrap gap-2 items-center sm:shrink-0">
                <slot name="actions" />
                <FavoriteToggle v-if="tool" :tool="tool" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import ToolIcon from '@/components/tool/ToolIcon.vue';
import FavoriteToggle from '@/components/tool/FavoriteToggle.vue';
import { CATEGORY_META } from '@/composables/useTools';

const props = defineProps({
    tool: { type: Object, default: null },
    title: { type: String, default: null },
    description: { type: String, default: null },
    icon: { type: String, default: null },
    compact: { type: Boolean, default: false },
});

const route = useRoute();

const isConvertChild = computed(
    () =>
        route.path.startsWith('/tools/convert/') &&
        route.path !== '/tools/convert'
);

const crumb = computed(() => {
    if (isConvertChild.value) {
        return { label: 'Converters', to: '/tools/convert' };
    }
    const key = props.tool?.category;
    if (!key || !CATEGORY_META[key]) return null;
    return {
        label: CATEGORY_META[key].label,
        to: `/#cat-${key}`,
    };
});

const parent = computed(() =>
    isConvertChild.value
        ? { label: 'Converters', to: '/tools/convert' }
        : { label: 'All tools', to: '/' }
);
</script>
