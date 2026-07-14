<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <main class="container px-4 py-16 mx-auto max-w-4xl text-center">
            <p
                class="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600 dark:from-primary-400 dark:to-accent-400"
            >
                {{ error?.statusCode || 500 }}
            </p>
            <h1
                class="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100"
            >
                {{
                    error?.statusCode === 404
                        ? "This page doesn't exist"
                        : 'Something went wrong'
                }}
            </h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
                Maybe one of these tools is what you were looking for.
            </p>
            <div class="mt-6">
                <BaseButton icon="mdi:home" @click="goHome">
                    Back to all tools
                </BaseButton>
            </div>

            <section class="mt-12 text-left">
                <h2
                    class="mb-4 text-sm font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400"
                >
                    Popular tools
                </h2>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
