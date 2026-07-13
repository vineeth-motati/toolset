<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <PageLoading />
        <NavBar />
        <Toast />
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </div>
</template>
<script setup>
import PageLoading from '@/components/ui/PageLoading.vue';
import Toast from '@/components/ui/Toast.vue';
</script>
