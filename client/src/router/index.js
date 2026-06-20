import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import AuthLayout from '../layouts/AuthLayout.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Public landing page
    {
      path: '/',
      name: 'Landing',
      component: () => import('../pages/Landing.vue'),
      meta: { requiresGuest: true },
    },
    
    // Auth routes group (Login, register, recover)
    {
      path: '/auth',
      component: AuthLayout,
      meta: { requiresGuest: true },
      children: [
        {
          path: 'login',
          alias: '/login',
          name: 'Login',
          component: () => import('../pages/Login.vue'),
        },
        {
          path: 'register',
          alias: '/register',
          name: 'Register',
          component: () => import('../pages/Register.vue'),
        },
        {
          path: 'forgot-password',
          alias: '/forgot-password',
          name: 'ForgotPassword',
          component: () => import('../pages/ForgotPassword.vue'),
        }
      ]
    },

    // Main App dashboard and core workspace sections
    {
      path: '/',
      component: DefaultLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('../pages/Dashboard.vue'),
        },
        {
          path: 'employees',
          name: 'Employees',
          component: () => import('../pages/Employees.vue'),
          meta: { allowedRoles: ['Super Admin', 'HR Manager', 'Department Manager'] },
        },
        {
          path: 'employees/:id',
          name: 'EmployeeProfile',
          component: () => import('../pages/EmployeeProfile.vue'),
        },
        {
          path: 'attendance',
          name: 'Attendance',
          component: () => import('../pages/Attendance.vue'),
        },
        {
          path: 'payroll',
          name: 'Payroll',
          component: () => import('../pages/Payroll.vue'),
          meta: { allowedRoles: ['Super Admin', 'HR Manager'] },
        },
        {
          path: 'recruitment',
          name: 'Recruitment',
          component: () => import('../pages/Recruitment.vue'),
          meta: { allowedRoles: ['Super Admin', 'HR Manager'] },
        },
        {
          path: 'performance',
          name: 'Performance',
          component: () => import('../pages/Performance.vue'),
        },
        {
          path: 'lnd',
          name: 'Lnd',
          component: () => import('../pages/Lnd.vue'),
        },
        {
          path: 'self-service',
          name: 'SelfService',
          component: () => import('../pages/SelfService.vue'),
          meta: { allowedRoles: ['Employee'] },
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('../pages/Settings.vue'),
          meta: { allowedRoles: ['Super Admin'] },
        }
      ]
    },

    // Fallback redirect
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    }
  ],
});

// Route Guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;
  
  // Resolve allowed roles from current route or parent route metadata
  const requiredRoles = to.matched.flatMap(record => record.meta.allowedRoles || []);
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest);

  if (requiresAuth && !isAuthenticated) {
    return next({ name: 'Login' });
  }

  if (requiresGuest && isAuthenticated) {
    return next({ name: 'Dashboard' });
  }

  if (requiredRoles.length > 0) {
    const userRole = authStore.userRole;
    if (!requiredRoles.includes(userRole)) {
      // Silently redirect instead of using browser alert (better UX)
      console.warn(`[Router] Access denied: role '${userRole}' cannot access '${to.path}'.`);
      return next({ name: 'Dashboard' });
    }
  }

  next();
});

export default router;
