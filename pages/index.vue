<template>
    <div class="mx-auto max-w-4xl">
        <h1
            class="mb-8 text-4xl font-bold text-center text-gray-900 dark:text-gray-100"
        >
            Welcome to Tools-Set
        </h1>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <NuxtLink
                v-for="tool in tools"
                :key="tool.path"
                :to="tool.path"
                class="p-6 bg-white rounded-card border border-gray-100 shadow-sm transition-shadow group hover:shadow-md dark:bg-gray-800 dark:border-gray-700"
            >
                <div class="flex items-center space-x-4">
                    <div
                        class="p-2 rounded-lg transition-colors bg-primary-100 group-hover:bg-primary-200 dark:bg-primary-900/40 dark:group-hover:bg-primary-900/60"
                    >
                        <Icon
                            :icon="tool.icon"
                            class="w-6 h-6 text-primary-600 dark:text-primary-400"
                        />
                    </div>
                    <div>
                        <h2
                            class="text-lg font-semibold text-gray-900 dark:text-gray-100"
                        >
                            {{ tool.name }}
                        </h2>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
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
import toolsData from '@/data/tools.json';

const tools = toolsData;
</script>
