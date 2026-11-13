<template>
    <footer
        class="mt-24 bg-white border-t border-gray-200/80 dark:bg-gray-950/40 dark:border-gray-800"
    >
        <div class="px-4 pt-14 pb-10 mx-auto max-w-7xl sm:px-6">
            <div class="grid gap-10 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
                <div class="max-w-xs">
                    <NuxtLink to="/" class="inline-flex gap-2.5 items-center">
                        <AppLogo />
                        <span
                            class="text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white"
                        >
                            Tools-Set
                        </span>
                    </NuxtLink>
                    <p
                        class="mt-4 text-sm leading-6 text-gray-500 dark:text-gray-400"
                    >
                        Free everyday tools that run on your device. No
                        accounts, no uploads, no waiting on a server.
                    </p>
                    <div
                        class="inline-flex gap-2 items-center px-3 py-1.5 mt-5 text-xs font-medium text-gray-600 bg-gray-50 rounded-full border border-gray-200 dark:text-gray-300 dark:bg-gray-800/60 dark:border-gray-700"
                    >
                        <span
                            class="w-1.5 h-1.5 bg-accent-500 rounded-full"
                        ></span>
                        Processing stays in your browser
                    </div>
                </div>

                <div
                    v-for="column in columns"
                    :key="column.title"
                    class="min-w-0"
                >
                    <h2
                        class="text-sm font-semibold text-gray-900 dark:text-white"
                    >
                        {{ column.title }}
                    </h2>
                    <ul class="mt-4 space-y-2.5">
                        <li v-for="link in column.links" :key="link.path">
                            <NuxtLink
                                :to="link.path"
                                class="text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            >
                                {{ link.name }}
                            </NuxtLink>
                        </li>
                    </ul>
                </div>
            </div>

            <div
                class="flex flex-col gap-4 justify-between items-start pt-8 mt-12 text-sm text-gray-500 border-t border-gray-200/80 sm:flex-row sm:items-center dark:border-gray-800 dark:text-gray-400"
            >
                <p>© {{ year }} Tools-Set. Free and open source.</p>
                <div class="flex gap-5 items-center">
                    <NuxtLink
                        to="/tools/convert/settings"
                        class="hover:text-gray-900 dark:hover:text-white"
                    >
                        Converter settings
                    </NuxtLink>
                    <a
                        href="https://github.com/vineeth-motati/toolset"
                        target="_blank"
                        rel="noopener"
                        class="inline-flex gap-1.5 items-center hover:text-gray-900 dark:hover:text-white"
                    >
                        <Icon icon="mdi:github" class="w-4 h-4" />
                        GitHub
                    </a>
                </div>
            </div>
        </div>
    </footer>
</template>

<script setup>
import { Icon } from '@iconify/vue';
import AppLogo from '@/components/ui/AppLogo.vue';
import { useTools } from '@/composables/useTools';
import converterConfigs from '@/config/converters';
import { getLocalConverter } from '@/utils/localConverters';

const { all } = useTools();

const pick = (cats) => all.filter((t) => cats.includes(t.category));

const columns = [
    { title: 'Developer', links: pick(['dev']) },
    { title: 'Productivity', links: pick(['productivity']) },
    { title: 'Design & media', links: pick(['design', 'media']) },
    {
        title: 'Converters',
        links: [
            { name: 'All converters', path: '/tools/convert' },
            ...pick(['convert']).filter((t) => t.path !== '/tools/convert'),
            ...converterConfigs
                .filter((c) => getLocalConverter(c.path))
                .filter(
                    (c, i, list) =>
                        list.findIndex((x) => x.category === c.category) === i
                )
                .slice(0, 5)
                .map((c) => ({ name: c.title, path: c.path })),
        ],
    },
];

const year = new Date().getFullYear();
</script>
