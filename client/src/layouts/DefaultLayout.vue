<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useGsap } from '../composables/useGsap';
import HeaderCanvas from '../components/three/HeaderCanvas.vue';
import { 
  LayoutDashboard, Users, Calendar, DollarSign, 
  Briefcase, Award, BookOpen, Settings, User, LogOut, Sun, Moon,
  Menu, X, Bell, ChevronDown, Clock, Receipt, MessageSquare, ShieldAlert
} from 'lucide-vue-next';

const authStore = useAuthStore();
const route = useRoute();
const { animateSidebarLinks, animateMagnetic, killMagneticListeners } = useGsap();

const user = computed(() => authStore.user);
const role = computed(() => authStore.userRole);

// Dark/Mobile states
const isDarkMode = ref(true);
const isMobileMenuOpen = ref(false);
const showUserDropdown = ref(false);

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
  if (isDarkMode.value) {
    document.body.classList.remove('light-mode');
    document.documentElement.classList.add('dark');
  } else {
    document.body.classList.add('light-mode');
    document.documentElement.classList.remove('dark');
  }
};

const handleLogout = () => {
  showUserDropdown.value = false;
  authStore.logout('You have been logged out.');
};

// Get current page title from route
const pageTitle = computed(() => {
  const name = route.name || '';
  const titles = {
    Dashboard: 'Dashboard',
    Employees: 'Employees',
    EmployeeProfile: 'Employee Profile',
    Attendance: 'Attendance & Leaves',
    Payroll: 'Payroll',
    Recruitment: 'Recruitment',
    Performance: 'Performance',
    Lnd: 'Learning & Development',
    SelfService: 'My Portal',
    Settings: 'System Settings',
    Discipline: 'Discipline Cases',
  };
  return titles[name] || name;
});

// Compute menu items based on role
const menuItems = computed(() => {
  const items = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'HR Manager', 'Department Manager', 'Employee'] },
    { name: 'Employees', path: '/employees', icon: Users, roles: ['Super Admin', 'HR Manager', 'Department Manager'] },
    { name: 'Attendance & Leaves', path: '/attendance', icon: Calendar, roles: ['Super Admin', 'HR Manager', 'Department Manager', 'Employee'] },
    { name: 'Weekly Timesheets', path: '/timesheets', icon: Clock, roles: ['Super Admin', 'HR Manager', 'Department Manager', 'Employee'] },
    { name: 'Expense Claims', path: '/expenses', icon: Receipt, roles: ['Super Admin', 'HR Manager', 'Department Manager', 'Employee'] },
    { name: 'Payroll', path: '/payroll', icon: DollarSign, roles: ['Super Admin', 'HR Manager'] },
    { name: 'Recruitment', path: '/recruitment', icon: Briefcase, roles: ['Super Admin', 'HR Manager'] },
    { name: 'Performance', path: '/performance', icon: Award, roles: ['Super Admin', 'HR Manager', 'Department Manager', 'Employee'] },
    { name: 'Training (L&D)', path: '/lnd', icon: BookOpen, roles: ['Super Admin', 'HR Manager', 'Department Manager', 'Employee'] },
    { name: 'Company Buzz', path: '/buzz', icon: MessageSquare, roles: ['Super Admin', 'HR Manager', 'Department Manager', 'Employee'] },
    { name: 'Discipline Cases', path: '/discipline', icon: ShieldAlert, roles: ['Super Admin', 'HR Manager', 'Department Manager', 'Employee'] },
    { name: 'My Portal', path: '/self-service', icon: User, roles: ['Employee'] },
    { name: 'System Settings', path: '/settings', icon: Settings, roles: ['Super Admin'] },
  ];
  return items.filter(item => item.roles.includes(role.value));
});

// Close dropdown when clicking outside
const handleOutsideClick = (e) => {
  if (!e.target.closest('#user-menu-btn') && !e.target.closest('#user-dropdown')) {
    showUserDropdown.value = false;
  }
};

onMounted(async () => {
  animateSidebarLinks('.sidebar-nav');
  animateMagnetic('.magnetic-btn');
  document.documentElement.classList.add('dark');
  document.addEventListener('click', handleOutsideClick);
  if (!authStore.companySettings) {
    await authStore.fetchCompanySettings();
  }
});

onUnmounted(() => {
  killMagneticListeners('.magnetic-btn');
  document.removeEventListener('click', handleOutsideClick);
});
</script>

<template>
  <div class="h-screen flex flex-col bg-brand-lightBg dark:bg-brand-bg text-brand-lightText dark:text-brand-text transition-colors duration-300 overflow-hidden">

    <!-- ============ TOP NAVBAR ============ -->
    <header class="shrink-0 flex items-center justify-between px-4 md:px-6 h-14 border-b border-brand-lightBorder dark:border-brand-border/60 bg-brand-lightCard/80 dark:bg-brand-card/60 backdrop-blur-lg z-30">
      
      <!-- Left: Mobile hamburger + Logo -->
      <div class="flex items-center gap-3">
        <!-- Mobile hamburger -->
        <button 
          @click="isMobileMenuOpen = true"
          class="md:hidden p-1.5 rounded-lg bg-brand-lightBorder dark:bg-brand-border/30 text-slate-500 dark:text-slate-400 hover:text-brand-lightText dark:hover:text-white cursor-pointer transition"
        >
          <Menu class="w-5 h-5" />
        </button>

        <!-- Brand logo -->
        <div class="flex items-center gap-2.5">
          <HeaderCanvas />
          <span class="text-sm font-bold tracking-tight text-brand-blue hidden sm:block">{{ authStore.companySettings?.name || 'Vercel HR' }}</span>
        </div>

        <!-- Desktop page title separator -->
        <div class="hidden md:flex items-center gap-2 ml-2">
          <span class="text-brand-lightBorder dark:text-brand-border/60 text-lg font-thin">/</span>
          <span class="text-sm font-semibold text-brand-lightText dark:text-white">{{ pageTitle }}</span>
        </div>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-2">

        <!-- Theme Toggle -->
        <button
          @click="toggleTheme"
          class="magnetic-btn p-2 rounded-lg bg-brand-lightBorder dark:bg-brand-border/30 hover:bg-brand-lightBorder/80 dark:hover:bg-brand-border/50 text-slate-500 dark:text-slate-400 hover:text-brand-lightText dark:hover:text-white transition cursor-pointer"
          title="Toggle Light/Dark Theme"
        >
          <component :is="isDarkMode ? Sun : Moon" class="w-4 h-4" />
        </button>

        <!-- Notifications Bell (placeholder) -->
        <button class="hidden sm:flex p-2 rounded-lg bg-brand-lightBorder dark:bg-brand-border/30 hover:bg-brand-lightBorder/80 dark:hover:bg-brand-border/50 text-slate-500 dark:text-slate-400 transition cursor-pointer relative">
          <Bell class="w-4 h-4" />
          <span class="absolute top-1 right-1 w-1.5 h-1.5 bg-brand-blue rounded-full"></span>
        </button>

        <!-- Divider -->
        <div class="w-px h-6 bg-brand-lightBorder dark:bg-brand-border/50 mx-1 hidden sm:block"></div>

        <!-- User Menu Button -->
        <div class="relative">
          <button
            id="user-menu-btn"
            @click.stop="showUserDropdown = !showUserDropdown"
            class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-brand-lightBorder dark:hover:bg-brand-border/30 transition cursor-pointer"
          >
            <!-- Avatar -->
            <div class="w-7 h-7 rounded-full bg-brand-purple/25 border border-brand-purple/50 flex items-center justify-center font-bold text-xs text-brand-purple uppercase shrink-0">
              {{ user?.name ? user.name.slice(0, 2) : 'HR' }}
            </div>
            <div class="hidden md:block text-left">
              <p class="text-xs font-semibold text-brand-lightText dark:text-white leading-none truncate max-w-[120px]">{{ user?.name }}</p>
              <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-none">{{ role }}</p>
            </div>
            <ChevronDown 
              class="w-3.5 h-3.5 text-slate-400 hidden md:block transition-transform duration-200"
              :class="{ 'rotate-180': showUserDropdown }"
            />
          </button>

          <!-- Dropdown -->
          <Transition
            enter-active-class="transition ease-out duration-150"
            enter-from-class="opacity-0 scale-95 translate-y-1"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition ease-in duration-100"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-1"
          >
            <div
              v-if="showUserDropdown"
              id="user-dropdown"
              class="absolute right-0 top-full mt-2 w-52 rounded-xl border border-brand-lightBorder dark:border-brand-border/60 bg-brand-lightCard dark:bg-[#0E1322] shadow-xl z-50 overflow-hidden"
            >
              <!-- User info -->
              <div class="px-4 py-3 border-b border-brand-lightBorder dark:border-brand-border/50">
                <p class="text-xs font-semibold text-brand-lightText dark:text-white truncate">{{ user?.name }}</p>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{{ user?.email }}</p>
                <span class="inline-block mt-1.5 text-[9px] font-bold text-brand-purple bg-brand-purple/10 border border-brand-purple/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">{{ role }}</span>
              </div>

              <!-- Actions -->
              <div class="p-1.5 space-y-0.5">
                <router-link
                  v-if="role === 'Employee'"
                  to="/self-service"
                  @click="showUserDropdown = false"
                  class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-500 dark:text-slate-400 hover:bg-brand-lightBorder dark:hover:bg-brand-border/30 hover:text-brand-lightText dark:hover:text-white transition cursor-pointer"
                >
                  <User class="w-3.5 h-3.5" />
                  My Profile
                </router-link>
                <button
                  @click="toggleTheme"
                  class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-500 dark:text-slate-400 hover:bg-brand-lightBorder dark:hover:bg-brand-border/30 hover:text-brand-lightText dark:hover:text-white transition cursor-pointer"
                >
                  <component :is="isDarkMode ? Sun : Moon" class="w-3.5 h-3.5" />
                  {{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}
                </button>
              </div>

              <!-- Logout -->
              <div class="p-1.5 border-t border-brand-lightBorder dark:border-brand-border/50">
                <button
                  @click="handleLogout"
                  class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300 transition cursor-pointer"
                >
                  <LogOut class="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Standalone Logout Button (always visible) -->
        <button
          @click="handleLogout"
          class="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 hover:border-rose-500/40 text-rose-500 dark:text-rose-400 transition cursor-pointer"
          title="Sign Out"
        >
          <LogOut class="w-3.5 h-3.5" />
          Logout
        </button>
      </div>
    </header>

    <!-- ============ BODY: Sidebar + Main ============ -->
    <div class="flex flex-1 overflow-hidden">

      <!-- Sidebar - Desktop -->
      <aside class="hidden md:flex flex-col w-56 shrink-0 border-r border-brand-lightBorder dark:border-brand-border/60 bg-brand-lightCard/60 dark:bg-brand-card/30 overflow-hidden">
        <!-- Navigation Links -->
        <nav class="sidebar-nav flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <router-link 
            v-for="item in menuItems" 
            :key="item.name"
            :to="item.path"
            class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-lightText dark:hover:text-white hover:bg-brand-lightBorder/80 dark:hover:bg-brand-border/30 transition duration-150"
            active-class="bg-brand-blue/10 text-brand-blue dark:text-brand-blue border border-brand-blue/20 hover:text-brand-blue dark:hover:text-brand-blue"
          >
            <component :is="item.icon" class="w-4.5 h-4.5 shrink-0" />
            <span class="truncate text-xs">{{ item.name }}</span>
          </router-link>
        </nav>

        <!-- Sidebar bottom: role badge -->
        <div class="px-3 py-3 border-t border-brand-lightBorder dark:border-brand-border/40">
          <div class="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-brand-lightBorder/40 dark:bg-brand-border/10">
            <div class="w-6 h-6 rounded-full bg-brand-purple/20 border border-brand-purple/40 flex items-center justify-center font-bold text-[10px] text-brand-purple uppercase shrink-0">
              {{ user?.name ? user.name.slice(0, 1) : 'H' }}
            </div>
            <div class="overflow-hidden">
              <p class="text-[10px] font-semibold text-brand-lightText dark:text-white truncate leading-none">{{ user?.name }}</p>
              <p class="text-[9px] text-slate-500 dark:text-slate-500 font-mono truncate mt-0.5">{{ role }}</p>
            </div>
          </div>
        </div>
      </aside>

      <!-- Mobile Drawer Overlay -->
      <Transition name="drawer-fade">
        <div v-if="isMobileMenuOpen" class="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" @click="isMobileMenuOpen = false"></div>
      </Transition>

      <!-- Mobile Drawer Sidebar -->
      <Transition name="drawer-slide">
        <aside v-if="isMobileMenuOpen" class="md:hidden fixed top-0 left-0 bottom-0 w-72 z-50 flex flex-col border-r border-brand-lightBorder dark:border-brand-border/60 bg-brand-lightCard/95 dark:bg-brand-card/95 backdrop-blur-xl shadow-2xl">
          <div class="flex items-center justify-between px-5 py-4 border-b border-brand-lightBorder dark:border-brand-border/60">
            <div class="flex items-center gap-2.5">
              <HeaderCanvas />
              <div>
                <h2 class="text-sm font-bold tracking-tight text-brand-blue">{{ authStore.companySettings?.name || 'Vercel HR' }}</h2>
                <span class="text-[9px] text-brand-purple font-mono uppercase tracking-widest">{{ role }}</span>
              </div>
            </div>
            <button @click="isMobileMenuOpen = false" class="p-1.5 rounded-lg bg-brand-lightBorder dark:bg-brand-border/30 text-slate-500 dark:text-slate-400 hover:text-brand-lightText dark:hover:text-white cursor-pointer">
              <X class="w-5 h-5" />
            </button>
          </div>

          <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" @click="isMobileMenuOpen = false">
            <router-link 
              v-for="item in menuItems" 
              :key="item.name"
              :to="item.path"
              class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-brand-lightText dark:hover:text-white hover:bg-brand-lightBorder/80 dark:hover:bg-brand-border/30 transition duration-150"
              active-class="bg-brand-blue/10 text-brand-blue border border-brand-blue/20"
            >
              <component :is="item.icon" class="w-5 h-5 shrink-0" />
              {{ item.name }}
            </router-link>
          </nav>

          <!-- Mobile drawer footer with logout -->
          <div class="p-3 border-t border-brand-lightBorder dark:border-brand-border/50 space-y-2">
            <div class="flex items-center gap-3 px-3 py-2 rounded-lg bg-brand-lightBorder/40 dark:bg-brand-border/10">
              <div class="w-8 h-8 rounded-full bg-brand-purple/20 border border-brand-purple/40 flex items-center justify-center font-bold text-xs text-brand-purple uppercase shrink-0">
                {{ user?.name ? user.name.slice(0, 2) : 'HR' }}
              </div>
              <div class="overflow-hidden">
                <p class="text-xs font-semibold text-brand-lightText dark:text-white truncate">{{ user?.name }}</p>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate">{{ user?.email }}</p>
              </div>
            </div>
            <div class="flex gap-2">
              <button 
                @click="toggleTheme"
                class="flex items-center justify-center p-2.5 rounded-lg bg-brand-lightBorder dark:bg-brand-border/30 text-slate-500 dark:text-slate-400 transition cursor-pointer hover:text-brand-lightText dark:hover:text-white"
              >
                <component :is="isDarkMode ? Sun : Moon" class="w-4 h-4" />
              </button>
              <button 
                @click="handleLogout"
                class="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-500 dark:text-rose-400 transition cursor-pointer"
              >
                <LogOut class="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>
      </Transition>

      <!-- Main Content Area -->
      <main class="flex-1 overflow-y-auto p-5 md:p-7 pb-24 md:pb-7">
        <router-view v-slot="{ Component, route: r }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" :key="r.fullPath" />
          </transition>
        </router-view>
      </main>
    </div>

    <!-- Mobile Bottom Navigation Bar -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-brand-lightCard/95 dark:bg-brand-card/95 border-t border-brand-lightBorder dark:border-brand-border/70 flex items-center justify-around py-2.5 px-3">
      <router-link 
        v-for="item in menuItems.slice(0, 5)" 
        :key="item.name"
        :to="item.path"
        class="flex flex-col items-center justify-center text-slate-500 transition duration-150"
        active-class="text-brand-blue"
      >
        <component :is="item.icon" class="w-5 h-5" />
        <span class="text-[9px] mt-1 tracking-tight font-medium">{{ item.name.split(' ')[0] }}</span>
      </router-link>
    </nav>
  </div>
</template>

<style scoped>
.router-link-exact-active {
  @apply text-brand-blue;
}

/* Page fade slide transition */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Mobile Drawer transitions */
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.25s ease;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(-100%);
}
</style>
