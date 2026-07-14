<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <PageLoading />
        <NavBar />
        <Toast />
        <CommandPalette />
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </div>
</template>
<script setup>
import PageLoading from '@/components/ui/PageLoading.vue';
import Toast from '@/components/ui/Toast.vue';
import CommandPalette from '@/components/palette/CommandPalette.vue';
</script>
