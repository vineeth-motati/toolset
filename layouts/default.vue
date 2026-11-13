<template>
    <div class="flex flex-col min-h-[calc(100vh-4rem)]">
        <main
            id="main"
            class="flex-1 px-4 pt-8 pb-4 mx-auto w-full max-w-7xl sm:px-6 sm:pt-10"
        >
            <slot />
        </main>
        <AppFooter />
    </div>
</template>

<script setup>
import AppFooter from '@/components/ui/AppFooter.vue';
</script>
