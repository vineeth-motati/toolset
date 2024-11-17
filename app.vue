<template>
  <div class="min-h-screen bg-gray-50">
    <PageLoading />
    <NavBar />
    <main class="container px-4 py-8 mx-auto">
      <NuxtPage />
    </main>
  </div>
</template>
<script setup>
import PageLoading from '~/components/ui/PageLoading.vue';
</script>
