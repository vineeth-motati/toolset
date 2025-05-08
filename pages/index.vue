<template>
    <div class="max-w-4xl mx-auto">
        <h1 class="mb-8 text-4xl font-bold text-center">
            Welcome to Tools-Set
        </h1>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <NuxtLink
                v-for="tool in tools"
                :key="tool.path"
                :to="tool.path"
                class="p-6 transition-shadow bg-white shadow-sm rounded-xl group hover:shadow-md"
            >
                <div class="flex items-center space-x-4">
                    <div
                        class="p-2 transition-colors bg-indigo-100 rounded-lg group-hover:bg-indigo-200"
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
import toolsData from '@/data/tools.json';

const tools = toolsData;
</script>
