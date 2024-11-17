<template>
  <div
    :class="[
      'fixed bottom-4 right-4 max-w-md rounded-lg shadow-lg transition-all duration-300 transform',
      showing ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
    ]"
  >
    <div :class="['relative rounded-lg p-4', typeClasses[type]]">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <component :is="icons[type]" class="h-5 w-5" />
        </div>
        <div class="ml-3 w-0 flex-1 pt-0.5">
          <p class="text-sm font-medium text-gray-900">{{ title }}</p>
          <p v-if="message" class="mt-1 text-sm text-gray-500">{{ message }}</p>
        </div>
        <div class="ml-4 flex flex-shrink-0">
          <button
            @click="close"
            class="inline-flex rounded-md text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>
      </div>
      <div
        class="absolute bottom-0 left-0 h-1 rounded-b-lg transition-all duration-300"
        :class="typeClasses[type]"
        :style="{ width: `${progress}%` }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/vue';

const props = defineProps({
  title: String,
  message: String,
  duration: {
    type: Number,
    default: 3000,
  },
  type: {
    type: String,
    default: 'success',
    validator: (value) => ['success', 'warning', 'error'].includes(value),
  },
});

const emit = defineEmits(['close']);

const showing = ref(false);
const progress = ref(100);
let progressInterval;
let timeout;

const typeClasses = {
  success: 'bg-green-50 text-green-800',
  warning: 'bg-yellow-50 text-yellow-800',
  error: 'bg-red-50 text-red-800',
};

const icons = {
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  error: XCircleIcon,
};

const close = () => {
  showing.value = false;
  setTimeout(() => {
    emit('close');
  }, 300);
};

onMounted(() => {
  showing.value = true;

  const startTime = Date.now();
  const updateProgress = () => {
    const elapsed = Date.now() - startTime;
    progress.value = 100 - (elapsed / props.duration) * 100;
    if (progress.value <= 0) {
      close();
    }
  };

  progressInterval = setInterval(updateProgress, 10);
  timeout = setTimeout(close, props.duration);
});

onBeforeUnmount(() => {
  clearInterval(progressInterval);
  clearTimeout(timeout);
});
</script>
