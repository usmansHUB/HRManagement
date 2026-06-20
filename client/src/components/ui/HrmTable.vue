<script setup>
defineProps({
  headers: {
    type: Array,
    required: true, // Array of strings or objects { label, key }
  },
  items: {
    type: Array,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  }
});
</script>

<template>
  <div class="w-full overflow-hidden rounded-xl border border-brand-border glass-panel">
    <!-- Mobile Card-Stack Layout View (only shown if mobile-card slot is provided) -->
    <div v-if="$slots['mobile-card']" class="md:hidden p-4 space-y-4">
      <div v-if="isLoading" class="py-10 text-center text-slate-500">
        <div class="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Loading details...
      </div>
      <div v-else-if="items.length === 0" class="py-10 text-center text-slate-500">
        No records found.
      </div>
      <div 
        v-else 
        v-for="(item, index) in items" 
        :key="item._id || index"
        class="p-4 rounded-lg border border-brand-lightBorder dark:border-brand-border/60 bg-brand-lightCard dark:bg-brand-card/40 space-y-3 shadow-sm dark:shadow-none"
      >
        <slot name="mobile-card" :item="item" :index="index"></slot>
      </div>
    </div>

    <!-- Desktop View Table (Scrollable on mobile as fallback if no mobile-card slot) -->
    <div :class="[$slots['mobile-card'] ? 'hidden md:block' : 'block', 'overflow-x-auto']">
      <table class="w-full border-collapse text-left text-sm text-slate-750 dark:text-slate-300">
        <thead class="bg-brand-lightBorder/40 dark:bg-black/40 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-brand-lightBorder dark:border-brand-border/60">
          <tr>
            <th 
              v-for="(header, i) in headers" 
              :key="i"
              class="px-6 py-4 font-semibold"
            >
              {{ typeof header === 'object' ? header.label : header }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-brand-lightBorder dark:divide-brand-border/40 bg-transparent">
          <tr v-if="isLoading">
            <td :colspan="headers.length" class="px-6 py-10 text-center text-slate-500">
              <div class="flex items-center justify-center gap-3">
                <div class="w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                Loading data records...
              </div>
            </td>
          </tr>
          <tr v-else-if="items.length === 0">
            <td :colspan="headers.length" class="px-6 py-10 text-center text-slate-500">
              No matching records found.
            </td>
          </tr>
          <tr 
            v-else 
            v-for="(item, index) in items" 
            :key="item._id || index"
            class="hover:bg-brand-lightBorder/50 dark:hover:bg-brand-border/20 transition duration-150"
          >
            <slot name="row" :item="item" :index="index"></slot>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
