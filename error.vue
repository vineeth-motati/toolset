<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <main class="px-4 py-20 mx-auto max-w-5xl text-center sm:px-6">
            <p
                class="inline-flex items-center px-3 py-1 font-mono text-sm font-medium text-gray-600 bg-white rounded-full border border-gray-200 shadow-xs dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700"
            >
                Error {{ error?.statusCode || 500 }}
            </p>
            <h1
                class="mt-6 text-4xl font-extrabold tracking-[-0.035em] text-gray-900 sm:text-5xl dark:text-white"
            >
                {{
                    error?.statusCode === 404
                        ? "This page doesn't exist"
                        : 'Something went wrong'
                }}
            </h1>
            <p class="mt-3 text-base text-gray-500 dark:text-gray-400">
                Maybe one of these tools is what you were looking for.
            </p>
            <div class="mt-6">
                <BaseButton icon="lucide:arrow-left" size="lg" @click="goHome">
                    Back to all tools
                </BaseButton>
            </div>

            <section class="mt-16 text-left">
                <h2 class="mb-4 eyebrow">Popular tools</h2>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <ToolCard
                        v-for="tool in popularTools"
                        :key="tool.path"
                        :tool="tool"
                        :show-favorite="false"
                    />
                </div>
            </section>
        </main>
    </div>
</template>

<script setup>
import NavBar from '@/components/NavBar.vue';
import ToolCard from '@/components/tool/ToolCard.vue';
import { useTools } from '@/composables/useTools';

const props = defineProps({
    error: { type: Object, default: null },
});

const popularTools = useTools().popular();

useSeoMeta({
    title: `${props.error?.statusCode === 404 ? 'Page not found' : 'Error'} · Tools-Set`,
});

const goHome = () => clearError({ redirect: '/' });
</script>
