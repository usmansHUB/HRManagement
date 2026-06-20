<script setup>
import ParticlesBg from '../components/three/ParticlesBg.vue';
</script>

<template>
  <div class="relative min-h-screen flex items-center justify-center p-4">
    <!-- WebGL Particle System Background -->
    <ParticlesBg />
    
    <!-- Child Page Container (with glassmorphism visual styling) -->
    <main class="w-full max-w-md p-8 glass-panel border border-brand-border/60 rounded-xl shadow-2xl relative z-10">
      <div class="text-center mb-6">
        <h1 class="text-3xl font-extrabold text-brand-blue tracking-tight select-none flex items-center justify-center gap-2">
          🌌 HRM Portal
        </h1>
        <p class="text-slate-400 text-xs mt-1">Enterprise Resource Planner</p>
      </div>
      <router-view />
    </main>
  </div>
</template>
