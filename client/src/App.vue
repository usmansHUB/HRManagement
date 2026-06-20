<script setup>
import { computed, onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import HrmToastProvider from './components/ui/HrmToastProvider.vue';

const authStore = useAuthStore();

const showWarning = computed(() => authStore.showSessionWarning);

const extendSession = async () => {
  await authStore.keepSessionAlive();
};

const handleLogout = () => {
  authStore.logout('You have logged out successfully.');
};

// Start session timers if already authenticated on mount
onMounted(() => {
  if (authStore.isAuthenticated) {
    authStore.startSessionTimers();
  }
});
</script>

<template>
  <div class="min-h-screen">
    <!-- Router View for Pages -->
    <router-view />

    <!-- Global Toast Notification Provider -->
    <HrmToastProvider />

    <!-- Session Expiration Warning Modal -->
    <Transition name="fade">
      <div v-if="showWarning" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div class="w-full max-w-md p-6 glass-panel rounded-xl border border-brand-border text-center shadow-2xl scale-100">
          <div class="w-16 h-16 bg-brand-purple/20 text-brand-purple rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h3 class="text-xl font-bold text-brand-text mb-2">Session Expiry Warning</h3>
          <p class="text-slate-400 text-sm mb-6">
            Your login session is about to expire due to inactivity in 2 minutes. Would you like to stay logged in?
          </p>
          
          <div class="flex gap-4">
            <button 
              @click="handleLogout"
              class="flex-1 py-2 px-4 rounded bg-transparent border border-slate-600 hover:border-brand-purple hover:bg-brand-purple/10 text-slate-300 font-medium transition duration-200"
            >
              Log Out
            </button>
            <button 
              @click="extendSession"
              class="flex-1 py-2 px-4 rounded bg-brand-blue hover:bg-brand-blue/80 text-white font-medium shadow-md shadow-brand-blue/30 transition duration-200"
            >
              Stay Logged In
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
