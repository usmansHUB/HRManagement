<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import HeroCanvas from '../components/three/HeroCanvas.vue';
import HrmButton from '../components/ui/HrmButton.vue';
import { useGsap } from '../composables/useGsap';

const { 
  animatePageIn, 
  animateFadeInScroll, 
  animateTextReveal, 
  animateCardParallax, 
  animateMagnetic, 
  killScrollTriggers 
} = useGsap();
const rootRef = ref(null);

const features = [
  { title: 'Interactive Organization Charts', desc: 'Real-time structural visualizations mapping employee profiles, reporting managers, and departments dynamically.', icon: '📊' },
  { title: 'Clock-In & Monthly Heatmaps', desc: 'Biometric web punches capturing location tracking coordinates alongside calendar heatmap logs.', icon: '⏰' },
  { title: 'Self-Service Payslips', desc: 'Auto-calculated tax deductions, allowances, net payments, and downloadable PDF payslips in one click.', icon: '💵' },
  { title: 'Recruitment Kanban Pipeline', desc: 'ATS applicant review boards supporting drag-and-drop actions, resumes, and interview feedback records.', icon: '💼' },
];

onMounted(() => {
  animatePageIn(rootRef.value);

  // Text Reveal Masking on Hero text
  animateTextReveal('.reveal-text');
  animateTextReveal('.reveal-subtext');

  // Parallax motion scrolling features cards
  animateCardParallax('.feature-card');

  // Activate magnetic physics pull triggers
  animateMagnetic('.magnetic-btn');

  animateFadeInScroll('.pricing-section', 0.1);
  animateFadeInScroll('.cta-banner', 0.1);
});

onUnmounted(() => {
  killScrollTriggers();
});
</script>

<template>
  <div ref="rootRef" class="min-h-screen bg-[#05070F] text-slate-100 overflow-x-hidden">
    <!-- Navbar -->
    <header class="fixed top-0 left-0 right-0 z-50 border-b border-brand-border/30 bg-[#05070F]/80 backdrop-blur-md">
      <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="magnetic-btn text-xl font-bold tracking-tight text-brand-blue cursor-pointer">🌌 Vercel HR</span>
        </div>
        <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#features" class="magnetic-btn hover:text-white transition duration-150">Features</a>
          <a href="#pricing" class="magnetic-btn hover:text-white transition duration-150">Pricing</a>
          <a href="#testimonials" class="magnetic-btn hover:text-white transition duration-150">Testimonials</a>
        </nav>
        <div class="flex items-center gap-3">
          <router-link to="/login" class="magnetic-btn text-sm font-semibold hover:text-white transition duration-150">Sign In</router-link>
          <router-link to="/register" class="hidden sm:block">
            <HrmButton variant="primary" class="magnetic-btn">Start Free Trial</HrmButton>
          </router-link>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="min-h-screen flex flex-col md:flex-row items-center max-w-7xl mx-auto px-6 pt-24 gap-12 relative">
      <!-- Floating Background Orbs -->
      <div class="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-brand-blue/10 blur-[120px] pointer-events-none -z-10"></div>
      <div class="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-brand-purple/10 blur-[130px] pointer-events-none -z-10"></div>

      <!-- Text Content -->
      <div class="flex-1 space-y-6 text-center md:text-left z-10">
        <div class="overflow-hidden py-1">
          <h1 class="reveal-text text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            The Premium Operating System for <span class="bg-gradient-to-r from-brand-blue to-brand-purple bg-clip-text text-transparent">Modern Teams</span>
          </h1>
        </div>
        <div class="overflow-hidden py-1">
          <p class="reveal-subtext text-slate-400 text-lg md:text-xl max-w-xl font-light leading-relaxed">
            Streamline payroll calculations, clock heatmaps, applicant pipelines, and performance reviews on a unified, high-performance platform.
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
          <router-link to="/register">
            <HrmButton variant="primary" class="magnetic-btn w-full sm:w-auto px-8 py-3.5 text-base">Get Started Now</HrmButton>
          </router-link>
          <a href="#features">
            <HrmButton variant="secondary" class="magnetic-btn w-full sm:w-auto px-8 py-3.5 text-base">Explore Features</HrmButton>
          </a>
        </div>
      </div>

      <!-- Three.js 3D Hero Render Canvas -->
      <div class="flex-1 w-full h-[400px] md:h-[600px] flex items-center justify-center relative cursor-grab active:cursor-grabbing">
        <HeroCanvas />
        <!-- Floating Interactive Metric Badge overlay -->
        <div class="absolute bottom-10 left-10 glass-panel border border-brand-border/40 p-4 rounded-xl shadow-xl animate-bounce pointer-events-none hidden md:block">
          <div class="flex items-center gap-3">
            <span class="text-2xl">⚡</span>
            <div class="text-left">
              <h5 class="text-xs font-bold text-slate-400">Headcount Trend</h5>
              <p class="text-lg font-bold text-brand-blue">+24% This Quarter</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Grid Section -->
    <section id="features" class="py-32 border-t border-brand-border/40 bg-black/10">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center max-w-2xl mx-auto mb-20">
          <span class="text-brand-purple font-semibold text-sm uppercase tracking-wider">Features</span>
          <h2 class="text-4xl font-bold mt-2">Built for Performance. Scaled for Growth.</h2>
          <p class="text-slate-400 mt-4 leading-relaxed">Eliminate disconnected sheets and fragmented tools. Experience all HR modules fully integrated into a single glassmorphic workspace.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div 
            v-for="feat in features" 
            :key="feat.title"
            class="feature-card p-6 rounded-xl border border-brand-border/50 bg-[#0C0E1A]/30 hover:border-brand-blue/40 hover:bg-[#0C0E1A]/60 transition-all duration-300 shadow-lg group"
          >
            <div class="w-12 h-12 rounded-lg bg-brand-border/40 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 group-hover:bg-brand-blue/10 transition duration-200">
              {{ feat.icon }}
            </div>
            <h3 class="text-lg font-bold text-white mb-2">{{ feat.title }}</h3>
            <p class="text-slate-400 text-sm leading-relaxed">{{ feat.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Plans Section -->
    <section id="pricing" class="pricing-section py-32 border-t border-brand-border/30">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center max-w-2xl mx-auto mb-20">
          <span class="text-brand-blue font-semibold text-sm uppercase tracking-wider">Pricing</span>
          <h2 class="text-4xl font-bold mt-2">Flexible plans for any size of team</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <!-- Standard -->
          <div class="p-8 rounded-xl border border-brand-border bg-[#0C0E1A]/20 flex flex-col justify-between">
            <div>
              <h3 class="text-xl font-bold">Standard</h3>
              <p class="text-slate-400 text-sm mt-1">For small startups</p>
              <div class="text-3xl font-extrabold text-white mt-6">$4<span class="text-sm font-normal text-slate-400">/emp/month</span></div>
              <ul class="space-y-3.5 mt-8 text-sm text-slate-300">
                <li class="flex items-center gap-2">✓ Self-Service Portal</li>
                <li class="flex items-center gap-2">✓ Clock Heatmaps</li>
                <li class="flex items-center gap-2">✓ Standard Org Chart</li>
              </ul>
            </div>
            <router-link to="/register" class="mt-8">
              <HrmButton variant="secondary" class="w-full">Get Started</HrmButton>
            </router-link>
          </div>

          <!-- Enterprise -->
          <div class="p-8 rounded-xl border border-brand-blue bg-[#0C0E1A]/40 flex flex-col justify-between relative shadow-xl shadow-brand-blue/5">
            <span class="absolute top-0 right-6 -translate-y-1/2 bg-brand-blue text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full">POPULAR</span>
            <div>
              <h3 class="text-xl font-bold">Pro</h3>
              <p class="text-slate-400 text-sm mt-1">For scaling businesses</p>
              <div class="text-3xl font-extrabold text-brand-blue mt-6">$8<span class="text-sm font-normal text-slate-400">/emp/month</span></div>
              <ul class="space-y-3.5 mt-8 text-sm text-slate-300">
                <li class="flex items-center gap-2">✓ All Standard Features</li>
                <li class="flex items-center gap-2">✓ Automated Payroll Runs</li>
                <li class="flex items-center gap-2">✓ ATS Kanban Boards</li>
                <li class="flex items-center gap-2">✓ OKR Goal Appraisals</li>
              </ul>
            </div>
            <router-link to="/register" class="mt-8">
              <HrmButton variant="primary" class="w-full">Start Free Trial</HrmButton>
            </router-link>
          </div>

          <!-- Custom -->
          <div class="p-8 rounded-xl border border-brand-border bg-[#0C0E1A]/20 flex flex-col justify-between">
            <div>
              <h3 class="text-xl font-bold">Enterprise</h3>
              <p class="text-slate-400 text-sm mt-1">For larger companies</p>
              <div class="text-3xl font-extrabold text-white mt-6">Custom</div>
              <ul class="space-y-3.5 mt-8 text-sm text-slate-300">
                <li class="flex items-center gap-2">✓ Unlimited Employees</li>
                <li class="flex items-center gap-2">✓ Multi-Manager Approvals</li>
                <li class="flex items-center gap-2">✓ Dedicated SLA Support</li>
              </ul>
            </div>
            <router-link to="/register" class="mt-8">
              <HrmButton variant="secondary" class="w-full">Contact Sales</HrmButton>
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section id="testimonials" class="testimonials-section py-32 border-t border-brand-border/30 bg-black/5">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center max-w-2xl mx-auto mb-20">
          <span class="text-brand-purple font-semibold text-sm uppercase tracking-wider">Testimonials</span>
          <h2 class="text-4xl font-bold mt-2">What Modern Teams Say</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="p-8 rounded-xl border border-brand-border/60 bg-[#0C0E1A]/20 glass-panel">
            <p class="text-slate-300 text-sm leading-relaxed italic">"Vercel HR completely consolidated our HR stack. Generating monthly payslip PDFs and tracking team clock-in heatmaps is now a single-click breeze."</p>
            <div class="flex items-center gap-3 mt-6">
              <div class="w-10 h-10 rounded-full bg-brand-blue/20 text-brand-blue flex items-center justify-center font-bold text-xs">AM</div>
              <div>
                <h5 class="text-xs font-bold text-white">Alex Morgan</h5>
                <p class="text-[10px] text-slate-500 font-mono">HR Director, FinTech ScaleUp</p>
              </div>
            </div>
          </div>
          
          <div class="p-8 rounded-xl border border-brand-purple/45 bg-[#0C0E1A]/40 glass-panel shadow-lg shadow-brand-purple/5">
            <p class="text-slate-300 text-sm leading-relaxed italic">"The performance OKR system and 360-review cycles are clean and intuitive. It is the first time our engineers actually enjoyed performance reviews."</p>
            <div class="flex items-center gap-3 mt-6">
              <div class="w-10 h-10 rounded-full bg-brand-purple/20 text-brand-purple flex items-center justify-center font-bold text-xs">SK</div>
              <div>
                <h5 class="text-xs font-bold text-white">Sarah Kowalski</h5>
                <p class="text-[10px] text-slate-500 font-mono">VP of Engineering, SaaS Lab</p>
              </div>
            </div>
          </div>

          <div class="p-8 rounded-xl border border-brand-border/60 bg-[#0C0E1A]/20 glass-panel">
            <p class="text-slate-300 text-sm leading-relaxed italic">"Our employees love the self-service portal. They can download their PDF tax summaries and check their remaining leave balances instantly without emailing HR."</p>
            <div class="flex items-center gap-3 mt-6">
              <div class="w-10 h-10 rounded-full bg-brand-blue/20 text-brand-blue flex items-center justify-center font-bold text-xs">DH</div>
              <div>
                <h5 class="text-xs font-bold text-white">David Harris</h5>
                <p class="text-[10px] text-slate-500 font-mono">Operations Manager, CloudCorp</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer Banner -->
    <section class="cta-banner py-24 bg-gradient-to-b from-transparent to-[#0C0E1A]/30 text-center border-t border-brand-border/20">
      <div class="max-w-2xl mx-auto px-6 space-y-6">
        <h2 class="text-3xl md:text-4xl font-bold">Ready to modernize your workforce?</h2>
        <p class="text-slate-400 leading-relaxed">Join hundreds of companies managing employee experiences on a modern portal workspace.</p>
        <router-link to="/register" class="inline-block mt-4">
          <HrmButton variant="primary" class="px-8 py-3">Create Free Account</HrmButton>
        </router-link>
      </div>
    </section>
  </div>
</template>
