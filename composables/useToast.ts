import { ref, computed } from 'vue';

type Toast = {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timeout: number;
};

const toasts = ref<Toast[]>([]);
let toastId = 0;

export const useToast = () => {
  const addToast = (
    message: string,
    type: Toast['type'] = 'info',
    timeout = 3000
  ) => {
    const id = toastId++;
    toasts.value.push({ id, message, type, timeout });

    setTimeout(() => {
      removeToast(id);
    }, timeout);
  };

  const removeToast = (id: number) => {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  };

  const toastList = computed(() => toasts.value);

  return {
    toasts: toastList,
    removeToast,
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
