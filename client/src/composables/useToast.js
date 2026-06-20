import { ref } from 'vue';

const toasts = ref([]);

export const useToast = () => {
  /**
   * Triggers a global toast notification
   * @param {string} message 
   * @param {string} type 'success' | 'error' | 'info' | 'warning'
   * @param {number} duration 
   */
  const addToast = (message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    const toast = { id, message, type };
    
    toasts.value.push(toast);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  };

  return {
    toasts,
    addToast,
    removeToast,
  };
};
