<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '../composables/useToast';
import api from '../services/api';
import HrmButton from '../components/ui/HrmButton.vue';

const router = useRouter();
const { addToast } = useToast();

const step = ref(1); // 1: Send OTP, 2: Reset Password
const email = ref('');
const otp = ref('');
const newPassword = ref('');
const isLoading = ref(false);

const emailFocused = ref(false);
const otpFocused = ref(false);
const passFocused = ref(false);

const handleRequestOtp = async () => {
  if (!email.value) return addToast('Please enter your email', 'error');

  isLoading.value = true;
  try {
    const { data } = await api.post('/auth/forgot-password', { email: email.value });
    if (data.success) {
      addToast(data.message || 'OTP sent successfully! Check your inbox/logs.', 'success');
      step.value = 2;
    }
  } catch (error) {
    addToast(error.response?.data?.message || 'Failed to send OTP.', 'error');
  } finally {
    isLoading.value = false;
  }
};

const handleResetPassword = async () => {
  if (!otp.value || !newPassword.value) return addToast('All fields are required', 'error');

  isLoading.value = true;
  try {
    const { data } = await api.post('/auth/reset-password', {
      email: email.value,
      otp: otp.value,
      newPassword: newPassword.value,
    });
    if (data.success) {
      addToast('Password has been reset successfully! You can now log in.', 'success');
      router.push('/login');
    }
  } catch (error) {
    addToast(error.response?.data?.message || 'Failed to reset password.', 'error');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div>
    <div class="text-center mb-6">
      <p class="text-slate-400 text-xs font-mono uppercase tracking-widest">Reset Account Password</p>
    </div>

    <!-- Step 1: Request OTP -->
    <form v-if="step === 1" @submit.prevent="handleRequestOtp" class="space-y-6">
      <div class="relative">
        <input
          id="email"
          type="email"
          v-model="email"
          @focus="emailFocused = true"
          @blur="emailFocused = false"
          class="w-full px-3 py-3 rounded-lg border bg-black/20 text-white outline-none border-brand-border/80 focus:border-brand-blue/80 transition duration-150 text-sm pt-5 pb-1.5"
          required
        />
        <label
          for="email"
          class="absolute left-3 top-3.5 transition-all duration-200 pointer-events-none text-slate-500 origin-[0_0] text-sm select-none"
          :class="[emailFocused || email ? 'transform -translate-y-2.5 scale-75 text-brand-blue' : '']"
        >
          Email Address
        </label>
      </div>

      <HrmButton
        type="submit"
        variant="primary"
        class="w-full py-3"
        :disabled="isLoading"
      >
        <span v-if="isLoading" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        <span v-else>Request Reset OTP</span>
      </HrmButton>

      <div class="text-center text-xs">
        <router-link to="/login" class="text-brand-blue hover:underline">Back to Login</router-link>
      </div>
    </form>

    <!-- Step 2: Input OTP and Reset Password -->
    <form v-else @submit.prevent="handleResetPassword" class="space-y-5">
      <div class="p-3 bg-brand-blue/10 border border-brand-blue/30 rounded-lg text-xs text-brand-blue leading-relaxed">
        If an account exists, a 6-digit OTP code has been sent. If local SMTP is unconfigured, check the backend console log for your mock OTP mail message.
      </div>

      <!-- OTP code input -->
      <div class="relative pt-2">
        <input
          id="otp"
          type="text"
          v-model="otp"
          @focus="otpFocused = true"
          @blur="otpFocused = false"
          class="w-full px-3 py-3 rounded-lg border bg-black/20 text-white outline-none border-brand-border/80 focus:border-brand-blue/80 transition duration-150 text-sm pt-5 pb-1.5"
          required
        />
        <label
          for="otp"
          class="absolute left-3 top-5.5 transition-all duration-200 pointer-events-none text-slate-500 origin-[0_0] text-sm select-none"
          :class="[otpFocused || otp ? 'transform -translate-y-2.5 scale-75 text-brand-blue' : '']"
        >
          6-Digit Verification Code
        </label>
      </div>

      <!-- New password input -->
      <div class="relative pt-2">
        <input
          id="newPassword"
          type="password"
          v-model="newPassword"
          @focus="passFocused = true"
          @blur="passFocused = false"
          class="w-full px-3 py-3 rounded-lg border bg-black/20 text-white outline-none border-brand-border/80 focus:border-brand-blue/80 transition duration-150 text-sm pt-5 pb-1.5"
          required
        />
        <label
          for="newPassword"
          class="absolute left-3 top-5.5 transition-all duration-200 pointer-events-none text-slate-500 origin-[0_0] text-sm select-none"
          :class="[passFocused || newPassword ? 'transform -translate-y-2.5 scale-75 text-brand-blue' : '']"
        >
          New Password
        </label>
      </div>

      <HrmButton
        type="submit"
        variant="primary"
        class="w-full py-3"
        :disabled="isLoading"
      >
        <span v-if="isLoading" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        <span v-else>Update Account Password</span>
      </HrmButton>

      <div class="text-center text-xs">
        <button type="button" @click="step = 1" class="text-slate-400 hover:text-white hover:underline cursor-pointer">
          Resend OTP code
        </button>
      </div>
    </form>
  </div>
</template>
