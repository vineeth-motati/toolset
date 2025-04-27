<template>
    <div class="mx-auto max-w-4xl">
        <h1 class="mb-8 text-4xl font-bold text-center">
            Welcome to Tools-Set
        </h1>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <NuxtLink
                v-for="tool in tools"
                :key="tool.path"
                :to="tool.path"
                class="p-6 bg-white rounded-xl shadow-sm transition-shadow group hover:shadow-md"
            >
                <div class="flex items-center space-x-4">
                    <div
                        class="p-2 bg-indigo-100 rounded-lg transition-colors group-hover:bg-indigo-200"
                    >
                        <Icon
                            :icon="tool.icon"
                            class="w-6 h-6 text-indigo-600"
                        />
                    </div>
                    <div>
                        <h2 class="text-lg font-semibold">{{ tool.name }}</h2>
                        <p class="text-sm text-gray-600">
                            {{ tool.description }}
                        </p>
                    </div>
                </div>
            </NuxtLink>
        </div>
    </div>
</template>

<script setup>
import { Icon } from '@iconify/vue';

const tools = [
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
</script>
