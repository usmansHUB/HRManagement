<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import ParticlesBg from '../components/three/ParticlesBg.vue';
import HrmButton from '../components/ui/HrmButton.vue';

const router = useRouter();
const authStore = useAuthStore();
const { addToast } = useToast();

const name = ref('');
const email = ref('');
const password = ref('');
const role = ref('Employee');
const isLoading = ref(false);

const nameFocused = ref(false);
const emailFocused = ref(false);
const passFocused = ref(false);

const nameError = ref('');
const emailError = ref('');
const passError = ref('');

const validateForm = () => {
  let isValid = true;
  nameError.value = '';
  emailError.value = '';
  passError.value = '';

  if (!name.value) {
    nameError.value = 'Full name is required';
    isValid = false;
  }

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

const handleRegister = async () => {
  if (!validateForm()) return;

  isLoading.value = true;
  const result = await authStore.register(name.value, email.value, password.value, role.value);
  isLoading.value = false;

  if (result && result.success) {
    addToast('Account created successfully!', 'success');
    router.push('/dashboard');
  } else {
    addToast(result.message || 'Registration failed.', 'error');
  }
};
</script>

<template>
  <div class="relative min-h-screen flex items-center justify-center p-4">
    <!-- Starfield backdrop -->
    <ParticlesBg />

    <!-- Glassmorphic card -->
    <div class="w-full max-w-md p-8 glass-panel border border-brand-border/60 rounded-2xl shadow-2xl relative z-10">
      <div class="text-center mb-6">
        <h1 class="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2 select-none">
          🌌 HRM Portal
        </h1>
        <p class="text-slate-400 text-xs mt-1 font-mono uppercase tracking-widest">Create New Account</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-5">
        <!-- Name Input -->
        <div class="relative">
          <input
            id="name"
            type="text"
            v-model="name"
            @focus="nameFocused = true"
            @blur="nameFocused = false"
            class="w-full px-3 py-3 rounded-lg border bg-black/20 text-white outline-none border-brand-border/80 focus:border-brand-blue/80 transition duration-150 text-sm pt-5 pb-1.5"
            :class="[nameError ? 'border-rose-500 focus:border-rose-500' : '']"
            autocomplete="name"
          />
          <label
            for="name"
            class="absolute left-3 top-3.5 transition-all duration-200 pointer-events-none text-slate-500 origin-[0_0] text-sm select-none"
            :class="[nameFocused || name ? 'transform -translate-y-2.5 scale-75 text-brand-blue' : '']"
          >
            Full Name
          </label>
          <span v-if="nameError" class="text-rose-500 text-[11px] mt-1 block absolute left-1">{{ nameError }}</span>
        </div>

        <!-- Email Input -->
        <div class="relative pt-1">
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
            class="absolute left-3 top-4.5 transition-all duration-200 pointer-events-none text-slate-500 origin-[0_0] text-sm select-none"
            :class="[emailFocused || email ? 'transform -translate-y-2.5 scale-75 text-brand-blue' : '']"
          >
            Email Address
          </label>
          <span v-if="emailError" class="text-rose-500 text-[11px] mt-1 block absolute left-1">{{ emailError }}</span>
        </div>

        <!-- Password Input -->
        <div class="relative pt-1">
          <input
            id="password"
            type="password"
            v-model="password"
            @focus="passFocused = true"
            @blur="passFocused = false"
            class="w-full px-3 py-3 rounded-lg border bg-black/20 text-white outline-none border-brand-border/80 focus:border-brand-blue/80 transition duration-150 text-sm pt-5 pb-1.5"
            :class="[passError ? 'border-rose-500 focus:border-rose-500' : '']"
            autocomplete="new-password"
          />
          <label
            for="password"
            class="absolute left-3 top-4.5 transition-all duration-200 pointer-events-none text-slate-500 origin-[0_0] text-sm select-none"
            :class="[passFocused || password ? 'transform -translate-y-2.5 scale-75 text-brand-blue' : '']"
          >
            Password
          </label>
          <span v-if="passError" class="text-rose-500 text-[11px] mt-1 block absolute left-1">{{ passError }}</span>
        </div>

        <!-- Role Selection -->
        <div class="pt-1 flex flex-col gap-1.5">
          <label class="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Select Testing Role</label>
          <select 
            v-model="role" 
            class="w-full px-3 py-2.5 rounded-lg border bg-[#0C0E1A]/80 text-white outline-none border-brand-border/80 focus:border-brand-blue/80 transition duration-150 text-sm cursor-pointer"
          >
            <option value="Super Admin">Super Admin</option>
            <option value="HR Manager">HR Manager</option>
            <option value="Department Manager">Department Manager</option>
            <option value="Employee">Employee</option>
          </select>
        </div>

        <!-- Links -->
        <div class="text-xs text-center pt-2">
          <span class="text-slate-400">
            Already registered? <router-link to="/login" class="text-brand-blue hover:underline">Sign In</router-link>
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
          <span v-else>Register</span>
        </HrmButton>
      </form>
    </div>
  </div>
</template>
