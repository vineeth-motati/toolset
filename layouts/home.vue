<template>
    <div class="flex flex-col min-h-[calc(100vh-4rem)]">
        <main id="main" class="flex-1">
            <slot />
        </main>
        <AppFooter class="!mt-0" />
    </div>
</template>

<script setup>
import AppFooter from '@/components/ui/AppFooter.vue';
</script>
