import { ref, computed } from 'vue';

type Toast = {
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    timeout: number;
};

const toasts = ref<Toast[]>([]);
let toastId = 0;
const timers = new Map<number, ReturnType<typeof setTimeout>>();

export const useToast = () => {
    const removeToast = (id: number) => {
        clearTimeout(timers.get(id));
        timers.delete(id);
        toasts.value = toasts.value.filter((toast) => toast.id !== id);
    };

    const startTimer = (id: number, timeout: number) => {
        clearTimeout(timers.get(id));
        timers.set(
            id,
            setTimeout(() => removeToast(id), timeout)
        );
    };

    const addToast = (
        message: string,
        type: Toast['type'] = 'info',
        timeout = 3000
    ) => {
        const id = toastId++;
        toasts.value.push({ id, message, type, timeout });
        startTimer(id, timeout);
    };

    // Hover pauses auto-dismiss; leaving restarts the full timeout.
    const pauseToast = (id: number) => {
        clearTimeout(timers.get(id));
        timers.delete(id);
    };

    const resumeToast = (id: number) => {
        const toast = toasts.value.find((t) => t.id === id);
        if (toast) startTimer(id, toast.timeout);
    };

    const toastList = computed(() => toasts.value);

    return {
        toasts: toastList,
        removeToast,
        pauseToast,
        resumeToast,
        success: (message: string, timeout = 3000) =>
            addToast(message, 'success', timeout),
        error: (message: string, timeout = 3000) =>
            addToast(message, 'error', timeout),
        warning: (message: string, timeout = 3000) =>
            addToast(message, 'warning', timeout),
        info: (message: string, timeout = 3000) =>
            addToast(message, 'info', timeout),
    };
};
