<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import gsap from 'gsap';

const props = defineProps({
  variant: {
    type: String,
    default: 'primary', // 'primary' | 'secondary' | 'purple' | 'danger' | 'ghost'
  },
  type: {
    type: String,
    default: 'button',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  magnetic: {
    type: Boolean,
    default: true,
  }
});

const buttonRef = ref(null);

const onMouseMove = (e) => {
  if (!props.magnetic || props.disabled) return;
  const btn = buttonRef.value;
  if (!btn) return;
  
  const rect = btn.getBoundingClientRect();
  // Calculate relative offset from center of button
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;
  
  // Magnetic pull (30% intensity)
  gsap.to(btn, {
    x: x * 0.35,
    y: y * 0.35,
    duration: 0.3,
    ease: 'power2.out',
  });
};

const onMouseLeave = () => {
  if (!props.magnetic || props.disabled) return;
  const btn = buttonRef.value;
  if (!btn) return;
  
  // Snap back with elastic spring physics
  gsap.to(btn, {
    x: 0,
    y: 0,
    duration: 0.6,
    ease: 'elastic.out(1.1, 0.4)',
  });
};

onUnmounted(() => {
  // Clean up GSAP timelines on unmount
  if (buttonRef.value) {
    gsap.killTweensOf(buttonRef.value);
  }
});
</script>

<template>
  <button
    ref="buttonRef"
    :type="type"
    :disabled="disabled"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
    :class="[
      'relative overflow-hidden font-medium rounded-lg text-sm px-5 py-2.5 outline-none transition-all duration-200 flex items-center justify-center gap-2 select-none active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
      variant === 'primary' ? 'bg-brand-blue text-white hover:bg-brand-blue/80 shadow-md shadow-brand-blue/20' : '',
      variant === 'secondary' ? 'bg-transparent border border-brand-border text-slate-300 hover:bg-brand-border/40' : '',
      variant === 'purple' ? 'bg-brand-purple text-white hover:bg-brand-purple/80 shadow-md shadow-brand-purple/20' : '',
      variant === 'danger' ? 'bg-rose-600 text-white hover:bg-rose-700' : '',
      variant === 'ghost' ? 'bg-transparent text-slate-400 hover:text-white hover:bg-brand-border/30' : ''
    ]"
  >
    <slot />
  </button>
</template>
