<script setup>
import { onUnmounted } from 'vue';
import gsap from 'gsap';

defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  maxWidth: {
    type: String,
    default: 'max-w-lg', // 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-3xl'
  }
});

const emit = defineEmits(['close']);

const onBeforeEnter = (el) => {
  const overlay = el.querySelector('.modal-overlay');
  const card = el.querySelector('.modal-card');
  gsap.set(overlay, { opacity: 0 });
  gsap.set(card, { scale: 0.92, opacity: 0 });
};

const onEnter = (el, done) => {
  const overlay = el.querySelector('.modal-overlay');
  const card = el.querySelector('.modal-card');
  
  gsap.to(overlay, {
    opacity: 1,
    duration: 0.2,
  });
  
  gsap.to(card, {
    scale: 1,
    opacity: 1,
    duration: 0.3,
    ease: 'power2.out',
    onComplete: done,
  });
};

const onLeave = (el, done) => {
  const overlay = el.querySelector('.modal-overlay');
  const card = el.querySelector('.modal-card');
  
  gsap.to(overlay, {
    opacity: 0,
    duration: 0.2,
  });
  
  gsap.to(card, {
    scale: 0.95,
    opacity: 0,
    duration: 0.2,
    ease: 'power2.in',
    onComplete: done,
  });
};

onUnmounted(() => {
  // Clean up references
  gsap.killTweensOf('.modal-overlay');
  gsap.killTweensOf('.modal-card');
});
</script>

<template>
  <Teleport to="body">
    <Transition
      :css="false"
      @before-enter="onBeforeEnter"
      @enter="onEnter"
      @leave="onLeave"
    >
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop Overlay -->
        <div 
          @click="emit('close')"
          class="modal-overlay fixed inset-0 bg-black/75 backdrop-blur-[4px]"
        ></div>

        <!-- Card Container -->
        <div 
          :class="[
            'modal-card w-full glass-panel border border-brand-border rounded-xl shadow-2xl relative flex flex-col max-h-[90vh]',
            maxWidth
          ]"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-brand-border/60">
            <h3 class="text-lg font-semibold text-brand-lightText dark:text-brand-text">{{ title }}</h3>
            <button 
              @click="emit('close')"
              class="text-slate-400 hover:text-brand-lightText dark:hover:text-white transition duration-150 p-1 hover:bg-brand-lightBorder dark:hover:bg-brand-border/40 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content Body -->
          <div class="p-6 overflow-y-auto flex-1">
            <slot />
          </div>

          <!-- Optional Footer Slot -->
          <div v-if="$slots.footer" class="px-6 py-4 border-t border-brand-lightBorder dark:border-brand-border/60 bg-brand-lightBorder/20 dark:bg-black/20 flex justify-end gap-3 rounded-b-xl">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
