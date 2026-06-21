<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import HrmButton from '../components/ui/HrmButton.vue';

const router = useRouter();
const authStore = useAuthStore();
const { addToast } = useToast();

const email = ref('');
const password = ref('');
const isLoading = ref(false);

// Float Label states
const emailFocused = ref(false);
const passFocused = ref(false);

// Validation errors
const emailError = ref('');
const passError = ref('');

const validateForm = () => {
  let isValid = true;
  emailError.value = '';
  passError.value = '';

  if (!email.value) {
    emailError.value = 'Email address is required';
    isValid = false;
  } else if (!/\S+@\S+\.\S+/.test(email.value)) {
    emailError.value = 'Provide a valid email address';
    isValid = false;
  }

  if (!password.value) {
    passError.value = 'Password is required';
    isValid = false;
  } else if (password.value.length < 6) {
    passError.value = 'Password must be at least 6 characters';
    isValid = false;
  }

  return isValid;
};

const handleLogin = async () => {
  if (!validateForm()) return;

  isLoading.value = true;
  const result = await authStore.login(email.value, password.value);
  isLoading.value = false;

  if (result && result.success) {
    addToast('Logged in successfully! Welcome to your dashboard.', 'success');
    router.push('/dashboard');
  } else {
    addToast(result.message || 'Login failed. Please check credentials.', 'error');
  }
};
</script>

<template>
  <div>
    <div class="text-center mb-6">
      <p class="text-slate-400 text-xs font-mono uppercase tracking-widest">Sign In to Dashboard</p>
    </div>

    <form @submit.prevent="handleLogin" class="space-y-6">
      <!-- Email Input -->
      <div class="relative">
        <input
          id="email"
          type="email"
          v-model="email"
          @focus="emailFocused = true"
          @blur="emailFocused = false"
          class="w-full px-3 py-3 rounded-lg border bg-black/20 text-white outline-none border-brand-border/80 focus:border-brand-blue/80 transition duration-150 text-sm pt-5 pb-1.5"
          :class="[emailError ? 'border-rose-500 focus:border-rose-500' : '']"
          autocomplete="email"
        />
        <label
          for="email"
          class="absolute left-3 top-3.5 transition-all duration-200 pointer-events-none text-slate-500 origin-[0_0] text-sm select-none"
          :class="[emailFocused || email ? 'transform -translate-y-2.5 scale-75 text-brand-blue' : '']"
        >
          Email Address
        </label>
        <span v-if="emailError" class="text-rose-500 text-[11px] mt-1 block absolute left-1">{{ emailError }}</span>
      </div>

      <!-- Password Input -->
      <div class="relative pt-2">
        <input
          id="password"
          type="password"
          v-model="password"
          @focus="passFocused = true"
          @blur="passFocused = false"
          class="w-full px-3 py-3 rounded-lg border bg-black/20 text-white outline-none border-brand-border/80 focus:border-brand-blue/80 transition duration-150 text-sm pt-5 pb-1.5"
          :class="[passError ? 'border-rose-500 focus:border-rose-500' : '']"
          autocomplete="current-password"
        />
        <label
          for="password"
          class="absolute left-3 top-5.5 transition-all duration-200 pointer-events-none text-slate-500 origin-[0_0] text-sm select-none"
          :class="[passFocused || password ? 'transform -translate-y-2.5 scale-75 text-brand-blue' : '']"
        >
          Password
        </label>
        <span v-if="passError" class="text-rose-500 text-[11px] mt-1 block absolute left-1">{{ passError }}</span>
      </div>

      <!-- Links -->
      <div class="flex items-center justify-between text-xs pt-1">
        <router-link to="/forgot-password" class="text-brand-purple hover:underline">Forgot password?</router-link>
        <span class="text-slate-400">
          No account? <router-link to="/register" class="text-brand-blue hover:underline">Register</router-link>
        </span>
      </div>

      <!-- Submit Button -->
      <HrmButton
        type="submit"
        variant="primary"
        class="w-full py-3"
        :disabled="isLoading"
      >
        <span v-if="isLoading" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        <span v-else>Sign In</span>
      </HrmButton>
    </form>
  </div>
</template>
