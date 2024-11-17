import { useToast as useVueToast } from 'vue-toastification';

export const useToast = () => {
  const toast = useVueToast();

  return {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    warning: (message: string) => toast.warning(message),
    info: (message: string) => toast.info(message),
  };
};
