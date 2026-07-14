<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <a
            href="#main"
            class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[70] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:rounded-lg focus:bg-primary-600"
        >
            Skip to content
        </a>
        <NuxtLoadingIndicator color="#6366f1" />
        <NavBar />
        <Toast />
        <CommandPalette />
        <ShareModal />
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </div>
</template>
<script setup>
import Toast from '@/components/ui/Toast.vue';
import CommandPalette from '@/components/palette/CommandPalette.vue';
import ShareModal from '@/components/tool/ShareModal.vue';
</script>
