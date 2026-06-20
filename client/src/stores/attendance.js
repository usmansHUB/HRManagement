import { defineStore } from 'pinia';
import api from '../services/api';

export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    logs: [],
    todayLog: null,
    monthlySummary: null,
    isLoading: false,
  }),

  actions: {
    async clockIn(payload = {}) {
      try {
        const { data } = await api.post('/attendance/clock-in', payload);
        if (data.success) {
          this.todayLog = data.data;
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Clock-in failed.',
        };
      }
    },

    async clockOut() {
      try {
        const { data } = await api.post('/attendance/clock-out');
        if (data.success) {
          this.todayLog = data.data;
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Clock-out failed.',
        };
      }
    },

    async fetchLogs(params = {}) {
      this.isLoading = true;
      try {
        const { data } = await api.get('/attendance/logs', { params });
        if (data.success) {
          this.logs = data.data;
          
          // Identify if employee has clocked in today
          const todayStr = new Date().toISOString().split('T')[0];
          this.todayLog = this.logs.find(log => log.date.startsWith(todayStr)) || null;
        }
      } catch (error) {
        console.error('Error fetching attendance logs:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchMonthlySummary(params = {}) {
      try {
        const { data } = await api.get('/attendance/monthly-summary', { params });
        if (data.success) {
          this.monthlySummary = data.data;
        }
      } catch (error) {
        console.error('Error fetching monthly attendance summary:', error);
      }
    },
  },
});
