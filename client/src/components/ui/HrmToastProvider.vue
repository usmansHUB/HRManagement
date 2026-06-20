<script setup>
import { useToast } from '../../composables/useToast';

const { toasts, removeToast } = useToast();
</script>

<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
    <TransitionGroup 
      name="toast-slide" 
      tag="div" 
      class="flex flex-col gap-3 w-full"
    >
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        :class="[
          'pointer-events-auto p-4 rounded-lg shadow-xl flex items-start gap-3 border backdrop-blur-md transition-all duration-300 w-full',
          toast.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' : '',
          toast.type === 'error' ? 'bg-rose-950/80 text-rose-300 border-rose-500/40' : '',
          toast.type === 'warning' ? 'bg-amber-950/80 text-amber-300 border-amber-500/40' : '',
          toast.type === 'info' ? 'bg-blue-950/80 text-blue-300 border-blue-500/40' : ''
        ]"
      >
        <!-- Icon -->
        <span class="mt-0.5 shrink-0">
          <svg v-if="toast.type === 'success'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-emerald-400">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
          </svg>
          <svg v-else-if="toast.type === 'error'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-rose-400">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-blue-400">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
          </svg>
        </span>

        <!-- Message -->
        <p class="text-sm font-medium leading-5 flex-1">{{ toast.message }}</p>

        <!-- Close Button -->
        <button 
          @click="removeToast(toast.id)"
          class="shrink-0 p-0.5 rounded-full hover:bg-white/10 transition duration-150 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-slate-400 hover:text-white">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(100px) scale(0.9);
}
.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(100px) scale(0.9);
}
</style>
