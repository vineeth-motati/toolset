<template>
  <div class="flex fixed right-4 bottom-4 z-50 flex-col space-y-4">
    <!-- Transition group for toast list -->
    <transition-group name="toast" tag="div" class="flex flex-col space-y-4">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'flex flex-col items-center justify-between rounded-lg shadow-lg text-white',
          toast.type === 'success' && 'bg-green-500',
          toast.type === 'error' && 'bg-red-500',
          toast.type === 'warning' && 'bg-yellow-500',
          toast.type === 'info' && 'bg-blue-500',
        ]"
      >
        <div class="flex items-center p-4">
          <!-- Icon and Message -->
          <div class="flex items-center space-x-2">
            <Icon :icon="getIcon(toast.type)" class="text-xl" :ssr="true" />
            <span>{{ toast.message }}</span>
          </div>

          <!-- Close Button -->
          <button
            @click="removeToast(toast.id)"
            class="ml-4 text-lg font-bold focus:outline-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToast } from '~/composables/useToast';
import { Icon } from '@iconify/vue';

const { toasts, removeToast } = useToast();

const getIcon = (type) => {
  switch (type) {
    case 'success':
      return 'mdi:check-circle';
    case 'error':
      return 'mdi:alert-circle';
    case 'warning':
      return 'mdi:alert';
    case 'info':
      return 'mdi:information';
    default:
      return 'mdi:bell';
  }
};
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.5s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.toast-enter-to {
  opacity: 1;
  transform: translateX(0);
}

.toast-leave-from {
  opacity: 1;
  transform: translateX(0);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
