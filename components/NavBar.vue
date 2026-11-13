<template>
    <header
        class="sticky top-0 z-50 border-b backdrop-blur-xl transition-colors border-gray-200/70 bg-white/80 supports-[backdrop-filter]:bg-white/70 dark:border-gray-800/80 dark:bg-gray-900/80 dark:supports-[backdrop-filter]:bg-gray-900/65"
    >
        <div
            class="flex gap-4 items-center mx-auto h-16"
            :class="isFullBleed ? 'px-4' : 'px-4 max-w-7xl sm:px-6'"
        >
            <NuxtLink
                to="/"
                class="flex gap-2.5 items-center -m-1 p-1 rounded-lg shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label="Tools-Set home"
            >
                <AppLogo />
                <span
                    class="text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white"
                >
                    Tools-Set
                </span>
            </NuxtLink>

            <nav class="hidden gap-1 items-center ml-4 lg:flex" aria-label="Main">
                <Popover v-slot="{ open, close }">
                    <PopoverButton
                        :class="[
                            navLinkBase,
                            open || isToolRoute
                                ? 'text-gray-900 dark:text-white'
                                : '',
                        ]"
                    >
                        Tools
                        <Icon
                            icon="lucide:chevron-down"
                            class="w-3.5 h-3.5 transition-transform"
                            :class="open ? 'rotate-180' : ''"
                        />
                    </PopoverButton>
                    <transition
                        enter-active-class="transition duration-150 ease-out"
                        enter-from-class="opacity-0 translate-y-1"
                        enter-to-class="opacity-100 translate-y-0"
                        leave-active-class="transition duration-100 ease-in"
                        leave-from-class="opacity-100 translate-y-0"
                        leave-to-class="opacity-0 translate-y-1"
                    >
                        <PopoverPanel
                            class="fixed inset-x-0 top-[4.25rem] mx-auto w-[min(64rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-pop dark:border-gray-700/80 dark:bg-gray-800"
                        >
                            <div class="grid grid-cols-5 gap-x-2 p-3">
                                <div
                                    v-for="category in categoryList"
                                    :key="category.key"
                                    class="p-2"
                                >
                                    <div
                                        class="flex gap-2 items-center px-2 mb-2"
                                    >
                                        <span
                                            class="w-1.5 h-1.5 rounded-full"
                                            :style="{
                                                background: CATEGORY_META[category.key]?.color,
                                            }"
                                        />
                                        <span class="eyebrow">{{
                                            CATEGORY_META[category.key]?.short ||
                                            category.label
                                        }}</span>
                                    </div>
                                    <ul class="space-y-0.5">
                                        <li
                                            v-for="tool in category.items"
                                            :key="tool.path"
                                        >
                                            <NuxtLink
                                                :to="tool.path"
                                                class="flex gap-2.5 items-center px-2 py-1.5 text-sm font-medium text-gray-700 rounded-lg transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700/60 dark:hover:text-white"
                                                @click="close()"
                                            >
                                                <ToolIcon
                                                    :tool="tool"
                                                    size="xs"
                                                />
                                                <span class="truncate">{{
                                                    tool.name
                                                }}</span>
                                            </NuxtLink>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div
                                class="flex justify-between items-center px-5 py-3 text-sm bg-gray-50 border-t border-gray-200/70 dark:border-gray-700/70 dark:bg-gray-900/40"
                            >
                                <span class="text-gray-500 dark:text-gray-400">
                                    {{ toolCount }} tools ·
                                    {{ converterCount }} converters · all
                                    in your browser
                                </span>
                                <NuxtLink
                                    to="/#all-tools"
                                    class="inline-flex gap-1 items-center font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                                    @click="close()"
                                >
                                    Browse everything
                                    <Icon
                                        icon="lucide:arrow-right"
                                        class="w-4 h-4"
                                    />
                                </NuxtLink>
                            </div>
                        </PopoverPanel>
                    </transition>
                </Popover>
                <NuxtLink
                    to="/tools/convert"
                    :class="[
                        navLinkBase,
                        route.path.startsWith('/tools/convert')
                            ? 'text-gray-900 dark:text-white'
                            : '',
                    ]"
                >
                    Converters
                </NuxtLink>
                <NuxtLink
                    to="/tools/resume"
                    :class="[
                        navLinkBase,
                        route.path === '/tools/resume'
                            ? 'text-gray-900 dark:text-white'
                            : '',
                    ]"
                >
                    Resume Builder
                </NuxtLink>
            </nav>

            <div class="flex flex-1 gap-1.5 justify-end items-center">
                <button
                    type="button"
                    class="hidden gap-2 items-center pr-1.5 pl-3 w-60 h-9 text-sm text-gray-500 bg-gray-100/80 rounded-lg ring-1 ring-inset ring-gray-200/80 transition md:flex hover:bg-gray-100 hover:text-gray-700 hover:ring-gray-300 dark:bg-gray-800/80 dark:text-gray-400 dark:ring-gray-700/80 dark:hover:text-gray-200 dark:hover:ring-gray-600"
                    @click="openPalette"
                >
                    <Icon icon="lucide:search" class="w-4 h-4" />
                    <span class="flex-1 text-left">Search tools…</span>
                    <span class="kbd">{{ modKey }}K</span>
                </button>
                <BaseIconButton
                    class="md:hidden"
                    icon="lucide:search"
                    label="Search tools"
                    @click="openPalette"
                />
                <ClientOnly>
                    <BaseIconButton
                        :icon="isDark ? 'lucide:sun' : 'lucide:moon'"
                        :label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
                        @click="toggleTheme"
                    />
                    <template #fallback>
                        <span class="inline-block w-9 h-9"></span>
                    </template>
                </ClientOnly>
                <a
                    href="https://github.com/vineeth-motati/toolset"
                    target="_blank"
                    rel="noopener"
                    class="hidden justify-center items-center w-9 h-9 text-gray-500 rounded-lg transition-colors sm:inline-flex hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                    aria-label="Source on GitHub"
                    title="Source on GitHub"
                >
                    <Icon icon="mdi:github" class="w-5 h-5" />
                </a>
                <BaseIconButton
                    class="lg:hidden"
                    :icon="mobileMenuOpen ? 'lucide:x' : 'lucide:menu'"
                    label="Toggle menu"
                    :aria-expanded="mobileMenuOpen"
                    @click="mobileMenuOpen = !mobileMenuOpen"
                />
            </div>
        </div>

        <transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 -translate-y-1"
            leave-active-class="transition duration-100 ease-in"
            leave-to-class="opacity-0 -translate-y-1"
        >
            <div
                v-if="mobileMenuOpen"
                class="absolute inset-x-0 top-full bg-white border-b border-gray-200 shadow-lift lg:hidden dark:bg-gray-900 dark:border-gray-800"
            >
                <nav
                    class="overflow-auto px-4 pt-3 pb-6 mx-auto max-w-7xl max-h-[75vh] sm:px-6"
                    aria-label="Mobile"
                >
                    <div
                        v-for="category in categoryList"
                        :key="category.key"
                        class="py-3 border-b border-gray-100 last:border-0 dark:border-gray-800"
                    >
                        <div class="flex gap-2 items-center px-2 mb-2">
                            <span
                                class="w-1.5 h-1.5 rounded-full"
                                :style="{
                                    background: CATEGORY_META[category.key]?.color,
                                }"
                            />
                            <span class="eyebrow">{{ category.label }}</span>
                        </div>
                        <div class="grid grid-cols-1 gap-1 sm:grid-cols-2">
                            <NuxtLink
                                v-for="tool in category.items"
                                :key="tool.path"
                                :to="tool.path"
                                class="flex gap-3 items-center px-2 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                @click="mobileMenuOpen = false"
                            >
                                <ToolIcon :tool="tool" size="sm" />
                                {{ tool.name }}
                            </NuxtLink>
                        </div>
                    </div>
                </nav>
            </div>
        </transition>
    </header>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue';
import AppLogo from '@/components/ui/AppLogo.vue';
import ToolIcon from '@/components/tool/ToolIcon.vue';
import { useTheme } from '@/composables/useTheme';
import { useTools, CATEGORY_META } from '@/composables/useTools';
import { useCommandPalette } from '@/composables/useCommandPalette';

const route = useRoute();
const mobileMenuOpen = ref(false);

watch(
    () => route.fullPath,
    () => {
        mobileMenuOpen.value = false;
    }
);

const { isDark, toggleTheme } = useTheme();
const { open: openPalette } = useCommandPalette();
const { categories, all, converters } = useTools();

const categoryList = categories();
const toolCount = all.length;
const converterCount = converters.length;

const isFullBleed = computed(() => route.meta.layout === 'fullscreen');

const isToolRoute = computed(
    () =>
        route.path.startsWith('/tools/') &&
        !route.path.startsWith('/tools/convert') &&
        route.path !== '/tools/resume'
);

const modKey = ref('Ctrl ');
onMounted(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform || '')) modKey.value = '⌘';
});

const navLinkBase =
    'inline-flex items-center gap-1 h-9 px-3 rounded-lg text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800';
</script>
