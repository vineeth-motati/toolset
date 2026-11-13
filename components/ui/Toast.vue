<template>
    <div
        class="flex fixed right-4 bottom-4 z-[80] flex-col gap-2 w-[min(380px,calc(100vw-2rem))] pointer-events-none"
        aria-live="polite"
    >
        <transition-group name="toast" tag="div" class="flex flex-col gap-2">
            <div
                v-for="(toast, index) in visibleToasts"
                :key="toast.id"
                role="status"
                :style="{ zIndex: visibleToasts.length - index }"
                class="flex gap-3 items-start py-3 pr-2 pl-3.5 text-sm bg-white rounded-xl border shadow-pop pointer-events-auto border-gray-200/80 dark:bg-gray-800 dark:border-gray-700"
                @mouseenter="pauseToast(toast.id)"
                @mouseleave="resumeToast(toast.id)"
            >
                <Icon
                    :icon="getIcon(toast.type)"
                    class="mt-px w-5 h-5 shrink-0"
                    :class="iconClass[toast.type] || 'text-gray-400'"
                />
                <span
                    class="flex-1 min-w-0 font-medium leading-5 text-gray-800 break-words dark:text-gray-100"
                    >{{ toast.message }}</span
                >
                <button
                    type="button"
                    class="flex justify-center items-center -my-0.5 w-6 h-6 text-gray-400 rounded-md shrink-0 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    aria-label="Dismiss notification"
                    @click="removeToast(toast.id)"
                >
                    <Icon icon="lucide:x" class="w-4 h-4" />
                </button>
            </div>
        </transition-group>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useToast } from '@/composables/useToast';
import { Icon } from '@iconify/vue';

const { toasts, removeToast, pauseToast, resumeToast } = useToast();

// Cap the stack; older toasts stay queued and appear as newer ones expire
const MAX_VISIBLE = 3;
const visibleToasts = computed(() => toasts.value.slice(0, MAX_VISIBLE));

const getIcon = (type) => {
    switch (type) {
        case 'success':
            return 'lucide:circle-check';
        case 'error':
            return 'lucide:circle-alert';
        case 'warning':
            return 'lucide:triangle-alert';
        case 'info':
            return 'lucide:info';
        default:
            return 'lucide:bell';
    }
};

const iconClass = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-primary-500',
};
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
    transition:
        opacity 0.2s ease,
        transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.toast-enter-from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
}

.toast-leave-to {
    opacity: 0;
    transform: translateX(16px);
}

.toast-move {
    transition: transform 0.25s ease;
}
</style>
