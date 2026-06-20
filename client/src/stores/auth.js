import { defineStore } from 'pinia';
import api from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    accessToken: localStorage.getItem('accessToken') || null,
    companySettings: null,
    showSessionWarning: false,
    sessionWarningTimeout: null,
    sessionLogoutTimeout: null,
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    userRole: (state) => state.user?.role || 'Employee',
    isSuperAdmin: (state) => state.user?.role === 'Super Admin',
    isHrManager: (state) => state.user?.role === 'HR Manager',
    isDeptManager: (state) => state.user?.role === 'Department Manager',
    isRegularEmployee: (state) => state.user?.role === 'Employee',
  },

  actions: {
    // Start session timers (1 hour access token)
    // Warning displays at 58 minutes (3480 seconds). Logout happens at 60 minutes (3600 seconds).
    startSessionTimers() {
      this.clearSessionTimers();

      // Warning at 58 minutes
      this.sessionWarningTimeout = setTimeout(() => {
        this.showSessionWarning = true;
      }, 58 * 60 * 1000);

      // Automatic logout at 60 minutes
      this.sessionLogoutTimeout = setTimeout(() => {
        this.logout('Session expired. You have been logged out.');
      }, 60 * 60 * 1000);
    },

    clearSessionTimers() {
      if (this.sessionWarningTimeout) clearTimeout(this.sessionWarningTimeout);
      if (this.sessionLogoutTimeout) clearTimeout(this.sessionLogoutTimeout);
      this.showSessionWarning = false;
    },

    async keepSessionAlive() {
      try {
        const { data } = await api.post('/auth/refresh');
        if (data.success && data.data?.accessToken) {
          this.accessToken = data.data.accessToken;
          localStorage.setItem('accessToken', this.accessToken);
          this.startSessionTimers();
          this.showSessionWarning = false;
          return true;
        }
      } catch (error) {
        console.error('Failed to refresh token manually:', error);
        this.logout();
      }
      return false;
    },

    async login(email, password) {
      try {
        const { data } = await api.post('/auth/login', { email, password });
        if (data.success) {
          this.user = data.data.user;
          this.accessToken = data.data.accessToken;
          
          localStorage.setItem('user', JSON.stringify(this.user));
          localStorage.setItem('accessToken', this.accessToken);
          
          this.startSessionTimers();
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Login failed. Please check your credentials.',
        };
      }
    },

    async register(name, email, password, role) {
      try {
        const { data } = await api.post('/auth/register', { name, email, password, role });
        if (data.success) {
          this.user = data.data.user;
          this.accessToken = data.data.accessToken;
          
          localStorage.setItem('user', JSON.stringify(this.user));
          localStorage.setItem('accessToken', this.accessToken);
          
          this.startSessionTimers();
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Registration failed.',
        };
      }
    },

    async logout(message = '') {
      // Clear state first so guards immediately see unauthenticated
      this.user = null;
      this.accessToken = null;
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      this.clearSessionTimers();

      // Fire-and-forget server logout (do not await so UI is responsive)
      api.post('/auth/logout').catch(() => {});

      // Show alert BEFORE redirect so it is visible
      if (message) {
        // Use setTimeout so the DOM can update before potential redirect
        setTimeout(() => alert(message), 50);
      }

      // Redirect to login
      window.location.href = '/login';
    },

    async fetchCompanySettings() {
      try {
        const { data } = await api.get('/settings/company');
        if (data.success) {
          this.companySettings = data.data;
        }
      } catch (error) {
        console.error('Failed to fetch company profile settings:', error);
      }
    },
  },
});
