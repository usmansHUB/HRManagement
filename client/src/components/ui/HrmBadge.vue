<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: {
    type: String,
    required: true,
  }
});

const formattedStatus = computed(() => {
  if (!props.status) return 'N/A';
  const s = String(props.status);
  return s.charAt(0).toUpperCase() + s.slice(1);
});

const badgeStyles = computed(() => {
  if (!props.status) return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30';
  const s = String(props.status).toLowerCase();
  
  if (['present', 'approved', 'active', 'hired', 'completed', 'paid', 'achieved'].includes(s)) {
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
  }
  if (['pending', 'late', 'inactive', 'draft', 'in progress', 'screened', 'interview'].includes(s)) {
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30';
  }
  if (['absent', 'rejected', 'terminated', 'closed', 'missed'].includes(s)) {
    return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30';
  }
  if (['half-day', 'open', 'offer', 'full-time'].includes(s)) {
    return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30';
  }
  return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30';
});
</script>

<template>
  <span 
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold select-none',
      badgeStyles
    ]"
  >
    <slot>{{ formattedStatus }}</slot>
  </span>
</template>
