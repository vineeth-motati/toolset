<template>
  <div
    class="flex fixed right-4 bottom-4 z-50 flex-col space-y-4"
    aria-live="polite"
  >
    <!-- Transition group for toast list -->
    <transition-group
      name="toast-slide"
      tag="div"
      class="flex flex-col space-y-4"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :style="{ zIndex: toasts.length - index }"
        :class="getToastClasses(toast.type)"
      >
        <div class="flex items-center p-4">
          <!-- Icon and Message -->
          <div class="flex items-center space-x-2">
            <Icon :icon="getIcon(toast.type)" class="text-xl" />
            <span>{{ toast.message }}</span>
          </div>

          <!-- Close Button -->
          <button
            @click="removeToast(toast.id)"
            class="ml-4 text-lg font-bold focus:outline-none"
            aria-label="Close toast"
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

const getToastClasses = (type) => {
  return [
    'flex flex-col items-center justify-between rounded-lg shadow-lg text-white',
    type === 'success' && 'bg-green-500',
    type === 'error' && 'bg-red-500',
    type === 'warning' && 'bg-yellow-500',
    type === 'info' && 'bg-blue-500',
  ];
};
</script>

<style scoped>
.toast-slide-enter-active {
  transition:
    transform 0.5s ease,
    opacity 0.5s ease;

  -webkit-animation: roll-in-blurred-right 0.65s cubic-bezier(0.23, 1, 0.32, 1)
    both;
  animation: roll-in-blurred-right 0.65s cubic-bezier(0.23, 1, 0.32, 1) both;
}

.toast-slide-leave-active {
  transition:
    transform 0.5s ease,
    opacity 0.5s ease;

  -webkit-animation: roll-in-blurred-right 0.65s cubic-bezier(0.23, 1, 0.32, 1)
    reverse both;
  animation: roll-in-blurred-right 0.65s cubic-bezier(0.23, 1, 0.32, 1) reverse
    both;
}

@-webkit-keyframes roll-in-blurred-right {
  0% {
    -webkit-transform: translateX(1000px) rotate(720deg);
    transform: translateX(1000px) rotate(720deg);
    -webkit-filter: blur(50px);
    filter: blur(50px);
    opacity: 0;
  }
  100% {
    -webkit-transform: translateX(0) rotate(0deg);
    transform: translateX(0) rotate(0deg);
    -webkit-filter: blur(0);
    filter: blur(0);
    opacity: 1;
  }
}
@keyframes roll-in-blurred-right {
  0% {
    -webkit-transform: translateX(1000px) rotate(720deg);
    transform: translateX(1000px) rotate(720deg);
    -webkit-filter: blur(50px);
    filter: blur(50px);
    opacity: 0;
  }
  100% {
    -webkit-transform: translateX(0) rotate(0deg);
    transform: translateX(0) rotate(0deg);
    -webkit-filter: blur(0);
    filter: blur(0);
    opacity: 1;
  }
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-slide-enter-to {
  opacity: 1;
  transform: translateX(0);
}

.toast-slide-leave-from {
  opacity: 1;
  transform: translateX(0);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Smooth movement for existing toasts */
.toast-slide-move {
  transition: transform 0.5s ease;
}
</style>
