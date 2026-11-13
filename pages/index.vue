<template>
    <div>
        <section class="relative">
            <div
                class="overflow-hidden absolute inset-0 pointer-events-none"
                aria-hidden="true"
            >
                <div class="absolute inset-0 bg-dots dots-fade"></div>
                <div
                    class="absolute left-1/2 top-[-14rem] h-[34rem] w-[64rem] -translate-x-1/2 rounded-full bg-primary-400/15 blur-3xl dark:bg-primary-500/10"
                ></div>
            </div>

            <div
                class="relative px-4 pt-14 mx-auto max-w-4xl text-center sm:px-6 sm:pt-20 lg:pt-24"
            >
                <p
                    class="inline-flex gap-2 items-center py-1 px-3 font-mono text-xs text-gray-500 rounded-full border shadow-xs border-gray-200/80 bg-white/80 dark:bg-gray-800/60 dark:border-gray-700 dark:text-gray-400"
                >
                    <span>{{ all.length }} tools</span>
                    <span class="text-gray-300 dark:text-gray-600">/</span>
                    <span>{{ converters.length }} converters</span>
                    <span class="text-gray-300 dark:text-gray-600">/</span>
                    <span>open source</span>
                </p>
                <h1
                    class="mt-6 text-[clamp(2.4rem,6.2vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-0.045em]"
                >
                    <span class="block text-gray-900 dark:text-white"
                        >Your toolbox,</span
                    >
                    <span class="block text-gray-400 dark:text-gray-500"
                        >running in the browser.</span
                    >
                </h1>
                <p
                    class="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-600 dark:text-gray-400"
                >
                    Format JSON, convert files, plan on a board or build a
                    resume. No installs, no accounts, and local tools never
                    upload a byte.
                </p>
            </div>

            <div class="relative px-4 pt-10 pb-20 mx-auto max-w-3xl sm:px-6 lg:pb-28">
                <div
                    class="overflow-hidden rounded-2xl border backdrop-blur launcher border-gray-200/80 bg-white/90 dark:bg-gray-800/80 dark:border-gray-700/70"
                >
                    <div
                        class="flex gap-3 items-center px-5 h-16 border-b border-gray-200/80 dark:border-gray-700/70"
                    >
                        <Icon
                            icon="lucide:search"
                            class="w-5 h-5 text-gray-400 shrink-0"
                        />
                        <input
                            v-model="query"
                            type="text"
                            :placeholder="`Search ${all.length + converters.length} tools and converters`"
                            aria-label="Search tools"
                            role="combobox"
                            aria-controls="launcher-results"
                            :aria-expanded="true"
                            autocomplete="off"
                            spellcheck="false"
                            class="flex-1 min-w-0 h-full text-base text-gray-900 bg-transparent sm:text-[17px] placeholder:text-gray-400 focus:outline-none dark:text-white"
                            @keydown.down.prevent="moveActive(1)"
                            @keydown.up.prevent="moveActive(-1)"
                            @keydown.enter.prevent="openActive"
                            @keydown.esc="query = ''"
                        />
                        <button
                            v-if="query"
                            type="button"
                            class="kbd hover:text-gray-900 dark:hover:text-white"
                            @click="query = ''"
                        >
                            esc
                        </button>
                    </div>

                    <div
                        class="flex overflow-x-auto gap-1 py-2 px-3 border-b border-gray-200/80 bg-gray-50/70 dark:border-gray-700/70 dark:bg-gray-900/30 [scrollbar-width:none]"
                        role="tablist"
                        aria-label="Filter by category"
                    >
                        <button
                            v-for="chip in chips"
                            :key="chip.key"
                            type="button"
                            role="tab"
                            :aria-selected="activeCat === chip.key"
                            class="inline-flex gap-2 items-center px-3 h-8 text-[13px] font-medium whitespace-nowrap rounded-lg transition shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                            :class="
                                activeCat === chip.key
                                    ? 'bg-gray-900 text-white shadow-xs dark:bg-white dark:text-gray-900'
                                    : 'text-gray-600 hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-white'
                            "
                            @click="activeCat = chip.key"
                        >
                            <span
                                v-if="chip.color"
                                class="w-1.5 h-1.5 rounded-full"
                                :style="{ background: chip.color }"
                            ></span>
                            {{ chip.label }}
                        </button>
                    </div>

                    <div id="launcher-results" class="p-2" role="listbox">
                        <p class="px-3 pt-1.5 pb-2 text-left eyebrow">
                            {{ listLabel }}
                        </p>
                        <div
                            v-if="visible.length"
                            class="grid grid-cols-1 gap-0.5 sm:grid-cols-2"
                        >
                            <NuxtLink
                                v-for="(tool, i) in visible"
                                :key="tool.path"
                                :to="tool.path"
                                role="option"
                                :aria-selected="i === activeIndex"
                                class="flex gap-3 items-center py-2.5 px-3 text-left rounded-xl transition-colors"
                                :class="
                                    i === activeIndex
                                        ? 'bg-gray-100 dark:bg-gray-700/60'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                                "
                                @mouseenter="activeIndex = i"
                            >
                                <ToolIcon :tool="tool" size="sm" />
                                <span class="flex-1 min-w-0">
                                    <span class="flex gap-2 items-center">
                                        <span
                                            class="text-sm font-semibold text-gray-900 truncate dark:text-white"
                                            >{{ tool.name }}</span
                                        >
                                        <span
                                            v-if="tool.apiOnly"
                                            class="api-tag"
                                            >API</span
                                        >
                                    </span>
                                    <span
                                        class="block text-xs text-gray-500 truncate dark:text-gray-400"
                                        >{{ tool.description }}</span
                                    >
                                </span>
                                <Icon
                                    icon="lucide:corner-down-left"
                                    class="hidden w-4 h-4 text-gray-400 transition-opacity shrink-0 sm:block"
                                    :class="
                                        i === activeIndex
                                            ? 'opacity-100'
                                            : 'opacity-0'
                                    "
                                />
                            </NuxtLink>
                        </div>
                        <p
                            v-else
                            class="py-10 px-3 text-sm text-center text-gray-500 dark:text-gray-400"
                        >
                            Nothing matches “{{ query.trim() }}”. Try a format
                            like PDF, CSV or WebP.
                        </p>
                    </div>

                    <div
                        class="flex gap-4 justify-between items-center py-2.5 px-4 text-xs text-gray-500 border-t border-gray-200/80 dark:border-gray-700/70 dark:text-gray-400"
                    >
                        <span class="font-mono"
                            >{{ visible.length }} of {{ pool.length }}</span
                        >
                        <a
                            href="#all-tools"
                            class="inline-flex gap-1 items-center font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                        >
                            Browse the full index
                            <Icon icon="lucide:arrow-down" class="w-3.5 h-3.5" />
                        </a>
                    </div>
                </div>
            </div>
        </section>

        <section
            id="all-tools"
            class="bg-white border-t border-gray-200/80 scroll-mt-16 dark:bg-gray-950/30 dark:border-gray-800"
        >
            <div class="px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:py-24">
                <div class="flex flex-wrap gap-4 justify-between items-end">
                    <div class="max-w-xl">
                        <h2
                            class="text-3xl font-extrabold tracking-[-0.035em] text-gray-900 sm:text-4xl dark:text-white"
                        >
                            The index
                        </h2>
                        <p
                            class="mt-3 text-base text-gray-500 dark:text-gray-400"
                        >
                            Every tool, grouped by the job it does.
                        </p>
                    </div>
                    <nav
                        class="flex flex-wrap gap-x-5 gap-y-2 text-sm"
                        aria-label="Jump to category"
                    >
                        <a
                            v-for="category in categoryList"
                            :key="category.key"
                            :href="`#cat-${category.key}`"
                            class="inline-flex gap-2 items-center font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        >
                            <span
                                class="w-1.5 h-1.5 rounded-full"
                                :style="{
                                    background: CATEGORY_META[category.key]?.color,
                                }"
                            ></span>
                            {{ CATEGORY_META[category.key]?.short }}
                        </a>
                    </nav>
                </div>

                <div class="mt-12">
                    <ClientOnly>
                        <div
                            v-if="favoriteTools.length"
                            class="grid grid-cols-1 gap-6 py-10 border-t border-gray-200/80 lg:grid-cols-[260px_1fr] lg:gap-10 dark:border-gray-800"
                        >
                            <div>
                                <ToolIcon
                                    icon="mdi:star"
                                    color="#D97706"
                                    size="md"
                                />
                                <h3
                                    class="mt-4 text-lg font-bold tracking-tight text-gray-900 dark:text-white"
                                >
                                    Pinned
                                </h3>
                                <p
                                    class="mt-1 text-sm text-gray-500 dark:text-gray-400"
                                >
                                    The tools you starred.
                                </p>
                            </div>
                            <div
                                class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
                            >
                                <ToolCard
                                    v-for="tool in favoriteTools"
                                    :key="tool.path"
                                    :tool="tool"
                                />
                            </div>
                        </div>
                    </ClientOnly>

                    <div
                        v-for="category in categoryList"
                        :id="`cat-${category.key}`"
                        :key="category.key"
                        class="grid grid-cols-1 gap-6 py-10 border-t border-gray-200/80 scroll-mt-20 lg:grid-cols-[260px_1fr] lg:gap-10 dark:border-gray-800"
                    >
                        <div class="min-w-0">
                            <ToolIcon
                                :icon="CATEGORY_META[category.key]?.icon"
                                :color="CATEGORY_META[category.key]?.color"
                                size="md"
                            />
                            <h3
                                class="mt-4 text-lg font-bold tracking-tight text-gray-900 dark:text-white"
                            >
                                {{ category.label }}
                            </h3>
                            <p
                                class="mt-1 text-sm text-gray-500 dark:text-gray-400"
                            >
                                {{ CATEGORY_META[category.key]?.blurb }}
                            </p>
                            <p
                                class="mt-3 font-mono text-xs text-gray-400 dark:text-gray-500"
                            >
                                {{ category.items.length }}
                                {{ category.items.length === 1 ? 'tool' : 'tools' }}
                            </p>
                        </div>
                        <div
                            class="grid grid-cols-1 gap-3 min-w-0 sm:grid-cols-2 xl:grid-cols-3"
                        >
                            <ToolCard
                                v-for="tool in category.items"
                                :key="tool.path"
                                :tool="tool"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:py-24">
            <div class="flex flex-wrap gap-6 justify-between items-end">
                <div class="max-w-xl">
                    <h2
                        class="text-3xl font-extrabold tracking-[-0.035em] text-gray-900 sm:text-4xl dark:text-white"
                    >
                        Convert between formats
                    </h2>
                    <p class="mt-3 text-base text-gray-500 dark:text-gray-400">
                        {{ localConverterCount }} converters run entirely on
                        your device. {{ apiConverterCount }} more use the
                        ConversionTools API with your own key.
                    </p>
                </div>
                <NuxtLink
                    to="/tools/convert"
                    class="inline-flex gap-2 items-center px-3.5 h-9 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-200 shadow-xs transition hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700/70"
                >
                    All converters
                    <Icon icon="lucide:arrow-right" class="w-4 h-4" />
                </NuxtLink>
            </div>

            <div
                class="grid grid-cols-1 gap-3 mt-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
                <NuxtLink
                    v-for="family in families"
                    :key="family.name"
                    to="/tools/convert"
                    class="flex flex-col p-5 bg-white rounded-2xl border transition border-gray-200/80 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lift dark:bg-gray-800/60 dark:border-gray-700/70 dark:hover:border-gray-600"
                >
                    <div class="flex gap-3 justify-between items-baseline">
                        <h3
                            class="text-[15px] font-semibold text-gray-900 dark:text-white"
                        >
                            {{ family.name }}
                        </h3>
                        <span
                            class="font-mono text-xs text-gray-400 dark:text-gray-500"
                            >{{ family.count }}</span
                        >
                    </div>
                    <div class="flex flex-wrap gap-1.5 mt-4">
                        <span
                            v-for="format in family.formats"
                            :key="format"
                            class="py-0.5 px-1.5 font-mono text-[11px] font-medium text-gray-600 bg-gray-50 rounded-md border border-gray-200/80 dark:text-gray-300 dark:bg-gray-900/50 dark:border-gray-700"
                            >{{ format }}</span
                        >
                    </div>
                    <p
                        class="pt-4 mt-auto text-xs text-gray-500 dark:text-gray-400"
                    >
                        <span v-if="family.local">{{ family.local }} local</span>
                        <span v-if="family.local && family.api"> · </span>
                        <span v-if="family.api">{{ family.api }} via API</span>
                    </p>
                </NuxtLink>
            </div>
        </section>

        <section
            class="bg-white border-t border-gray-200/80 dark:bg-gray-950/30 dark:border-gray-800"
        >
            <div
                class="grid grid-cols-1 gap-14 items-center px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:grid-cols-2 lg:py-24"
            >
                <div class="max-w-xl">
                    <h2
                        class="text-3xl font-extrabold tracking-[-0.035em] text-gray-900 sm:text-4xl dark:text-white"
                    >
                        Your files stay on your machine
                    </h2>
                    <p
                        class="mt-4 text-base leading-7 text-gray-500 dark:text-gray-400"
                    >
                        Local tools do their work inside this tab, using the
                        browser's own engines for images, audio, video, PDFs
                        and data. There's no upload to wait for and nothing
                        left on a server afterwards.
                    </p>
                    <ul class="mt-8 space-y-4">
                        <li
                            v-for="point in points"
                            :key="point.title"
                            class="flex gap-3"
                        >
                            <Icon
                                :icon="point.icon"
                                class="mt-0.5 w-5 h-5 text-gray-900 shrink-0 dark:text-white"
                            />
                            <span>
                                <span
                                    class="block text-sm font-semibold text-gray-900 dark:text-white"
                                    >{{ point.title }}</span
                                >
                                <span
                                    class="block mt-0.5 text-sm text-gray-500 dark:text-gray-400"
                                    >{{ point.body }}</span
                                >
                            </span>
                        </li>
                    </ul>
                    <p
                        class="flex gap-2 items-start mt-8 text-sm text-gray-500 dark:text-gray-400"
                    >
                        <span class="mt-0.5 api-tag">API</span>
                        Converters with this tag are the exception. They send
                        the file to ConversionTools and need your own key.
                    </p>
                </div>

                <div class="relative" aria-hidden="true">
                    <div
                        class="relative p-5 pt-8 rounded-3xl border-2 border-dashed border-gray-300/80 sm:p-8 sm:pt-10 dark:border-gray-700"
                    >
                        <span
                            class="absolute -top-3 left-6 px-2 font-mono text-xs text-gray-500 bg-white dark:bg-[#0a0d14] dark:text-gray-400"
                        >
                            this browser tab
                        </span>
                        <div
                            class="grid grid-cols-1 gap-3 items-center sm:grid-cols-[1fr_auto_1.1fr_auto_1fr]"
                        >
                            <div
                                class="flex gap-3 items-center p-3 min-w-0 bg-white rounded-xl border shadow-xs border-gray-200/80 dark:bg-gray-800 dark:border-gray-700"
                            >
                                <ToolIcon
                                    icon="lucide:file-image"
                                    color="#EA580C"
                                    size="sm"
                                />
                                <span class="min-w-0">
                                    <span
                                        class="block font-mono text-xs font-medium text-gray-900 truncate dark:text-white"
                                        >photo.heic</span
                                    >
                                    <span class="block text-[11px] text-gray-500"
                                        >3.1 MB</span
                                    >
                                </span>
                            </div>
                            <Icon
                                icon="lucide:arrow-right"
                                class="mx-auto w-4 h-4 text-gray-400 rotate-90 sm:rotate-0"
                            />
                            <div
                                class="p-3 text-white bg-gray-900 rounded-xl shadow-lift dark:bg-white dark:text-gray-900"
                            >
                                <span
                                    class="flex gap-2 items-center text-xs font-semibold"
                                >
                                    <Icon icon="lucide:cpu" class="w-4 h-4" />
                                    HEIC → JPG
                                </span>
                                <span
                                    class="block overflow-hidden mt-2.5 h-1 rounded-full bg-white/15 dark:bg-gray-900/10"
                                >
                                    <span
                                        class="block w-2/3 h-full rounded-full bg-primary-400 dark:bg-primary-600"
                                    ></span>
                                </span>
                            </div>
                            <Icon
                                icon="lucide:arrow-right"
                                class="mx-auto w-4 h-4 text-gray-400 rotate-90 sm:rotate-0"
                            />
                            <div
                                class="flex gap-3 items-center p-3 min-w-0 bg-white rounded-xl border shadow-xs border-gray-200/80 dark:bg-gray-800 dark:border-gray-700"
                            >
                                <ToolIcon
                                    icon="lucide:file-check"
                                    color="#0D9488"
                                    size="sm"
                                />
                                <span class="min-w-0">
                                    <span
                                        class="block font-mono text-xs font-medium text-gray-900 truncate dark:text-white"
                                        >photo.jpg</span
                                    >
                                    <span class="block text-[11px] text-gray-500"
                                        >1.2 MB</span
                                    >
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col items-center">
                        <span
                            class="h-10 border-l-2 border-gray-300 border-dashed dark:border-gray-700"
                        ></span>
                        <span
                            class="flex justify-center items-center -my-1 w-7 h-7 text-red-500 bg-white rounded-full border border-red-200 dark:bg-gray-900 dark:border-red-500/30"
                        >
                            <Icon icon="lucide:x" class="w-4 h-4" />
                        </span>
                        <span
                            class="h-10 border-l-2 border-gray-300 border-dashed dark:border-gray-700"
                        ></span>
                        <span
                            class="inline-flex gap-2.5 items-center py-2.5 px-4 text-sm text-gray-400 rounded-xl border border-gray-200 dark:border-gray-800 dark:text-gray-500"
                        >
                            <Icon icon="lucide:cloud-off" class="w-4 h-4" />
                            <span class="line-through">Upload server</span>
                            <span class="font-mono text-[11px]"
                                >not needed</span
                            >
                        </span>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import ToolIcon from '@/components/tool/ToolIcon.vue';
import { useTools, CATEGORY_META } from '@/composables/useTools';
import { useToolUsage } from '@/composables/useToolUsage';
import converterConfigs from '@/config/converters';

definePageMeta({ layout: 'home' });

const { all, converters, byPath, categories, search, popular } = useTools();
const { recents, favorites } = useToolUsage();

useSeoMeta({
    title: 'Tools-Set — Free, Private, In-Browser Tools',
    description:
        'A collection of free online tools — JSON formatter, Kanban board, QR generator, converters and more. Runs entirely in your browser.',
});

const MAX_VISIBLE = 8;

const isMounted = ref(false);
onMounted(() => {
    isMounted.value = true;
});

const categoryList = categories();

const recentTools = computed(() =>
    isMounted.value
        ? recents.value.map((r) => byPath(r.path)).filter(Boolean)
        : []
);
const favoriteTools = computed(() =>
    favorites.value.map((p) => byPath(p)).filter(Boolean)
);

const suggestions = computed(() => {
    const seen = new Set();
    return [...recentTools.value, ...popular(), ...all].filter((t) => {
        if (seen.has(t.path)) return false;
        seen.add(t.path);
        return true;
    });
});

const chips = [
    { key: 'all', label: 'All' },
    ...Object.entries(CATEGORY_META).map(([key, meta]) => ({
        key,
        label: meta.short,
        color: meta.color,
    })),
];

const query = ref('');
const activeCat = ref('all');
const activeIndex = ref(0);

const inCategory = (key) => {
    const tools = all.filter((t) => t.category === key);
    if (key !== 'convert') return tools;
    return [...tools, ...converters.filter((c) => !c.apiOnly)];
};

const pool = computed(() => {
    const q = query.value.trim();
    if (q) {
        const hits = search(q);
        return activeCat.value === 'all'
            ? hits
            : hits.filter((t) => t.category === activeCat.value);
    }
    return activeCat.value === 'all'
        ? suggestions.value
        : inCategory(activeCat.value);
});

const visible = computed(() => pool.value.slice(0, MAX_VISIBLE));

const listLabel = computed(() => {
    if (query.value.trim()) {
        const n = pool.value.length;
        return `${n} ${n === 1 ? 'result' : 'results'}`;
    }
    if (activeCat.value !== 'all') return CATEGORY_META[activeCat.value].label;
    return recentTools.value.length ? 'Recent and popular' : 'Popular';
});

watch([query, activeCat], () => {
    activeIndex.value = 0;
});

const moveActive = (delta) => {
    const n = visible.value.length;
    if (!n) return;
    activeIndex.value = (activeIndex.value + delta + n) % n;
};

const openActive = () => {
    const tool = visible.value[activeIndex.value];
    if (tool) navigateTo(tool.path);
};

const families = computed(() => {
    const map = new Map();
    for (const c of converterConfigs) {
        const name = c.category.replace(/ Converter$/, '');
        if (!map.has(name)) {
            map.set(name, { name, count: 0, local: 0, api: 0, formats: [] });
        }
        const family = map.get(name);
        family.count += 1;
        const isApi = converters.find((t) => t.path === c.path)?.apiOnly;
        family[isApi ? 'api' : 'local'] += 1;
        for (const f of [c.sourceFormat, c.targetFormat]) {
            if (/^[A-Za-z0-9]{2,5}$/.test(f) && !family.formats.includes(f)) {
                family.formats.push(f);
            }
        }
    }
    return [...map.values()]
        .map((f) => ({ ...f, formats: f.formats.slice(0, 8) }))
        .sort((a, b) => b.count - a.count);
});

const localConverterCount = converters.filter((c) => !c.apiOnly).length;
const apiConverterCount = converters.length - localConverterCount;

const points = [
    {
        icon: 'lucide:hard-drive',
        title: 'No upload step',
        body: 'Big files convert as fast as your machine allows, not your connection.',
    },
    {
        icon: 'lucide:shield-check',
        title: 'Nothing to clean up',
        body: 'Work saved by Notes, Kanban, Sheets and the Resume Builder lives in this browser only.',
    },
    {
        icon: 'lucide:link',
        title: 'Private share links',
        body: 'By default a link carries its data after the #, a part of the URL browsers never send to a server.',
    },
];
</script>

<style scoped>
.launcher {
    box-shadow:
        0 1px 2px rgb(12 15 23 / 0.04),
        0 30px 60px -28px rgb(12 15 23 / 0.28),
        0 0 0 6px rgb(255 255 255 / 0.6);
}

:global(.dark .launcher) {
    box-shadow:
        0 1px 2px rgb(0 0 0 / 0.3),
        0 30px 60px -28px rgb(0 0 0 / 0.7),
        0 0 0 6px rgb(255 255 255 / 0.03);
}

.bg-dots {
    background-image: radial-gradient(
        rgb(12 15 23 / 0.13) 1px,
        transparent 1px
    );
    background-size: 22px 22px;
}

:global(.dark .bg-dots) {
    background-image: radial-gradient(
        rgb(255 255 255 / 0.08) 1px,
        transparent 1px
    );
}

.dots-fade {
    -webkit-mask-image: radial-gradient(
        ellipse 70% 60% at 50% 30%,
        #000 20%,
        transparent 75%
    );
    mask-image: radial-gradient(
        ellipse 70% 60% at 50% 30%,
        #000 20%,
        transparent 75%
    );
}
</style>
