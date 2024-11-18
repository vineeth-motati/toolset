<template>
    <div
        v-if="isLoading"
        class="fixed top-0 right-0 left-0 z-50 h-1 bg-gray-200"
    >
        <div
            class="h-full bg-blue-600 transition-all duration-300"
            :style="{ width: `${progress}%` }"
        ></div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
const route = useRoute();

const isLoading = ref(false);
const progress = ref(0);
let progressInterval;

watch(
    () => route.fullPath,
    () => {
        isLoading.value = true;
        progress.value = 0;

        const increment = () => {
            if (progress.value < 90) {
                progress.value += (90 - progress.value) * 0.1;
            }
        };

        progressInterval = setInterval(increment, 100);

        // Simulate navigation completion
        setTimeout(() => {
            progress.value = 100;
            setTimeout(() => {
                isLoading.value = false;
                clearInterval(progressInterval);
            }, 200);
        }, 0);
    }
);
</script>
