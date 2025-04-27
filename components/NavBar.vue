<template>
    <header
        class="sticky top-0 z-50 border-b border-gray-100 shadow-sm bg-white/90 backdrop-blur-md dark:bg-gray-900/90 dark:border-gray-800"
    >
        <div class="container relative px-4 mx-auto">
            <div class="flex items-center justify-between h-16">
                <!-- Logo and site title -->
                <NuxtLink to="/" class="z-10 flex items-center space-x-3 group">
                    <div
                        class="flex items-center justify-center w-10 h-10 text-white transition-transform duration-300 transform rounded-lg shadow-md bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:scale-105"
                    >
                        <Icon icon="carbon:tool-kit" class="w-6 h-6" />
                    </div>
                    <span
                        class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400"
                        >Tools-Set</span
                    >
                </NuxtLink>

                <!-- Search Bar - Absolute Positioning for Perfect Centering - Only on lg screens -->
                <div
                    class="absolute z-0 hidden w-full max-w-md transform -translate-x-1/2 -translate-y-1/2 lg:block left-1/2 top-1/2"
                >
                    <div class="relative">
                        <input
                            v-model="searchQuery"
                            type="text"
                            placeholder="Search tools..."
                            class="w-full py-2 pl-10 pr-4 text-sm border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                            @focus="isSearchFocused = true"
                            @blur="
                                setTimeout(() => {
                                    isSearchFocused = false;
                                }, 100)
                            "
                        />
                        <Icon
                            icon="heroicons:magnifying-glass"
                            class="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                        />

                        <!-- Search Results -->
                        <div
                            v-if="
                                isSearchFocused &&
                                searchQuery &&
                                filteredTools.length
                            "
                            class="absolute left-0 right-0 z-50 mt-1 overflow-hidden overflow-y-auto bg-white border rounded-lg shadow-lg top-full max-h-72 dark:bg-gray-800 dark:border-gray-700"
                        >
                            <div
                                v-for="tool in filteredTools"
                                :key="tool.path"
                                class="search-result"
                            >
                                <NuxtLink
                                    :to="tool.path"
                                    class="flex items-start px-4 py-3 border-b border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700 last:border-0"
                                    @click="searchQuery = ''"
                                >
                                    <div
                                        class="flex items-center justify-center flex-shrink-0 w-8 h-8 mr-3 bg-indigo-100 rounded-md dark:bg-indigo-900/50"
                                    >
                                        <Icon
                                            :icon="tool.icon"
                                            class="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                                        />
                                    </div>
                                    <div>
                                        <div
                                            class="font-medium text-gray-900 dark:text-white"
                                        >
                                            {{ tool.name }}
                                        </div>
                                        <div
                                            class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1"
                                        >
                                            {{ tool.description }}
                                        </div>
                                    </div>
                                </NuxtLink>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right section: theme toggle and search/menu buttons -->
                <div class="z-10 flex items-center space-x-3">
                    <!-- Theme toggle with animation -->
                    <!-- <button
                        @click="toggleTheme"
                        class="p-2 text-gray-600 transition-colors duration-200 rounded-full hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        aria-label="Toggle theme"
                    >
                        <Icon
                            v-if="isDark"
                            icon="heroicons:sun"
                            class="w-5 h-5 transition-transform duration-500"
                        />
                        <Icon
                            v-else
                            icon="heroicons:moon"
                            class="w-5 h-5 transition-transform duration-500"
                        />
                    </button> -->

                    <!-- GitHub link -->
                    <a
                        :href="'https://github.com/vineeth-motati/toolset'"
                        target="_blank"
                        class="p-2 text-gray-600 transition-colors duration-200 rounded-full hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        aria-label="GitHub"
                    >
                        <Icon
                            icon="mdi:github"
                            class="w-5 h-5 transition-transform duration-500"
                        />
                    </a>

                    <!-- Mobile search button - now shown on all screens below lg -->
                    <button
                        @click="isMobileSearchOpen = !isMobileSearchOpen"
                        class="p-2 text-gray-600 rounded-full hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
                    >
                        <Icon
                            icon="heroicons:magnifying-glass"
                            class="w-5 h-5"
                        />
                    </button>

                    <!-- Mobile menu button -->
                    <button
                        @click="mobileMenuOpen = !mobileMenuOpen"
                        class="p-2 text-gray-600 rounded-md lg:hidden dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Toggle menu"
                    >
                        <Icon
                            v-if="!mobileMenuOpen"
                            icon="heroicons:bars-3"
                            class="w-6 h-6"
                        />
                        <Icon v-else icon="heroicons:x-mark" class="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Mobile search - now shown on all screens below lg -->
        <div
            v-if="isMobileSearchOpen"
            class="p-3 border-t border-gray-100 lg:hidden dark:border-gray-800 animate-slideDown"
        >
            <div class="relative">
                <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search tools..."
                    class="w-full py-2 pl-10 pr-4 text-sm border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                    @focus="isSearchFocused = true"
                    @blur="
                        setTimeout(() => {
                            isSearchFocused = false;
                        }, 100)
                    "
                />
                <Icon
                    icon="heroicons:magnifying-glass"
                    class="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                />

                <!-- Mobile search results -->
                <div
                    v-if="
                        isSearchFocused && searchQuery && filteredTools.length
                    "
                    class="absolute left-0 right-0 z-50 mt-1 overflow-hidden overflow-y-auto bg-white border rounded-lg shadow-lg top-full max-h-60 dark:bg-gray-800 dark:border-gray-700"
                >
                    <div
                        v-for="tool in filteredTools"
                        :key="tool.path"
                        class="search-result"
                    >
                        <NuxtLink
                            :to="tool.path"
                            class="flex items-start px-4 py-3 border-b border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700 last:border-0"
                            @click="
                                searchQuery = '';
                                isMobileSearchOpen = false;
                            "
                        >
                            <div
                                class="flex items-center justify-center flex-shrink-0 w-8 h-8 mr-3 bg-indigo-100 rounded-md dark:bg-indigo-900/50"
                            >
                                <Icon
                                    :icon="tool.icon"
                                    class="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                                />
                            </div>
                            <div>
                                <div
                                    class="font-medium text-gray-900 dark:text-white"
                                >
                                    {{ tool.name }}
                                </div>
                                <div
                                    class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1"
                                >
                                    {{ tool.description }}
                                </div>
                            </div>
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </div>

        <!-- Mobile menu with animation - updated to use lg breakpoint -->
        <div
            v-if="mobileMenuOpen"
            class="absolute w-full bg-white border-b border-gray-200 shadow-lg lg:hidden dark:bg-gray-900 dark:border-gray-800 animate-slideDown"
        >
            <nav class="container px-6 pt-2 pb-4 max-h-[80vh] overflow-auto">
                <div class="mt-2 mb-4">
                    <div
                        class="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400"
                    >
                        Popular Tools
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <NuxtLink
                            v-for="tool in popularTools"
                            :key="tool.path"
                            :to="tool.path"
                            class="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                            @click="mobileMenuOpen = false"
                        >
                            <Icon
                                :icon="tool.icon"
                                class="w-4 h-4 mr-2 text-indigo-500 dark:text-indigo-400"
                            />
                            {{ tool.name }}
                        </NuxtLink>
                    </div>
                </div>
            </nav>
        </div>
    </header>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import { useTheme } from '~/composables/useTheme';

const mobileMenuOpen = ref(false);
const isMobileSearchOpen = ref(false);
const isSearchFocused = ref(false);
const searchQuery = ref('');

// Use the theme composable - make sure we're using these variables in the template
const { isDark, toggleTheme } = useTheme();

// All available tools (Using the same data structure as on the homepage)
const allTools = [
    {
        name: 'Kanban Board',
        path: '/tools/kanban',
        icon: 'material-symbols:view-kanban-outline',
        description: 'Organize your tasks with a drag-and-drop Kanban board',
    },
    {
        name: 'Notes',
        path: '/tools/notes',
        icon: 'mdi:note',
        description: 'Take and organize your notes with markdown support',
    },
    {
        name: 'Code Editor',
        path: '/tools/code',
        icon: 'mdi:code-tags',
        description: 'Write and share code with syntax highlighting',
    },
    {
        name: 'QR Generator',
        path: '/tools/qr',
        icon: 'mdi:qrcode',
        description: 'Generate QR codes for any text or URL',
    },
    {
        name: 'Flexbox',
        path: '/tools/flexbox',
        icon: 'mdi:page-layout-body',
        description: 'Create and experiment with CSS Flexbox layouts',
    },
    {
        name: 'Image Tools',
        path: '/tools/image',
        icon: 'mdi:image',
        description: 'Compress and optimize your images',
    },
    {
        name: 'Markdown Editor',
        path: '/tools/markdown',
        icon: 'mdi:markdown',
        description: 'Write and save markdown notes',
    },
    {
        name: 'CSS Unit Converter',
        path: '/tools/css',
        icon: 'ph:file-css',
        description: 'Convert between different CSS units',
    },
    {
        name: 'Animations',
        path: '/tools/animation',
        icon: 'mdi:animation',
        description: 'Create custom animations with ease',
    },
    {
        name: 'Color Palette',
        path: '/tools/palette',
        icon: 'mdi:palette',
        description: 'Generate color palettes from any color',
    },
    {
        name: 'Sheets',
        path: '/tools/sheets',
        icon: 'mdi:table',
        description: 'Create and edit spreadsheets',
    },
    {
        name: 'JSONGrid',
        path: '/tools/jsongrid',
        icon: 'mdi:table-large',
        description: 'Visualize and edit JSON data in grid format',
    },
    {
        name: 'API',
        path: '/tools/api',
        icon: 'mdi:api',
        description: 'Interact with APIs and make HTTP requests',
    },
    {
        name: 'JSON Formatter',
        path: '/tools/json',
        icon: 'mdi:json',
        description: 'Format and validate JSON data',
    },
];

// Popular tools for mobile menu
const popularTools = [
    {
        name: 'Kanban Board',
        path: '/tools/kanban',
        icon: 'material-symbols:view-kanban-outline',
    },
    {
        name: 'Code Editor',
        path: '/tools/code',
        icon: 'mdi:code-tags',
    },
    {
        name: 'API Tester',
        path: '/tools/api',
        icon: 'mdi:api',
    },
    {
        name: 'Notes',
        path: '/tools/notes',
        icon: 'mdi:note',
    },
    {
        name: 'Color Palette',
        path: '/tools/palette',
        icon: 'mdi:palette',
    },
    {
        name: 'Flexbox',
        path: '/tools/flexbox',
        icon: 'mdi:page-layout-body',
    },
];

// Filter tools based on search query
const filteredTools = computed(() => {
    if (!searchQuery.value) return [];

    const query = searchQuery.value.toLowerCase();
    return allTools.filter(
        (tool) =>
            tool.name.toLowerCase().includes(query) ||
            tool.description.toLowerCase().includes(query)
    );
});
</script>

<style scoped>
.animate-slideDown {
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Hide scrollbar for Chrome, Safari and Opera */
::-webkit-scrollbar {
    display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.search-result {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
}
</style>
