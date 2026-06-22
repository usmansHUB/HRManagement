import { defineStore } from 'pinia';
import api from '../services/api';

export const useLeaveStore = defineStore('leave', {
  state: () => ({
    leaveTypes: [],
    balances: [],
    requests: [],
    teamCalendar: [],
    absenteeismReport: null,
    isLoading: false,
  }),

  actions: {
    async fetchLeaveTypes() {
      try {
        const { data } = await api.get('/leave/types');
        if (data.success) {
          this.leaveTypes = data.data;
        }
      } catch (error) {
        console.error('Error fetching leave types:', error);
      }
    },

    async createLeaveType(payload) {
      try {
        const { data } = await api.post('/leave/types', payload);
        if (data.success) {
          this.leaveTypes.push(data.data);
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to create leave type.',
        };
      }
    },

    async updateLeaveType(id, payload) {
      try {
        const { data } = await api.put(`/leave/types/${id}`, payload);
        if (data.success) {
          const idx = this.leaveTypes.findIndex(t => t._id === id);
          if (idx !== -1) this.leaveTypes[idx] = data.data;
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update leave type.',
        };
      }
    },

    async deleteLeaveType(id) {
      try {
        await api.delete(`/leave/types/${id}`);
        this.leaveTypes = this.leaveTypes.filter(t => t._id !== id);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to delete leave type.',
        };
      }
    },

    async fetchLeaveBalances(params = {}) {
      try {
        const { data } = await api.get('/leave/balances', { params });
        if (data.success) {
          this.balances = data.data;
        }
      } catch (error) {
        console.error('Error fetching leave balances:', error);
      }
    },

    async fetchLeaveRequests(params = {}) {
      this.isLoading = true;
      try {
        const { data } = await api.get('/leave/requests', { params });
        if (data.success) {
          this.requests = data.data;
        }
      } catch (error) {
        console.error('Error fetching leave requests:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async applyLeave(formData) {
      try {
        const { data } = await api.post('/leave/requests', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (data.success) {
          this.requests.unshift(data.data);
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to apply for leave.',
        };
      }
    },

    async resolveLeaveRequest(id, status, comment) {
      try {
        const { data } = await api.put(`/leave/requests/${id}/approve`, { status, comment });
        if (data.success) {
          const idx = this.requests.findIndex(r => r._id === id);
          if (idx !== -1) this.requests[idx] = data.data;
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to process request.',
        };
      }
    },

    async fetchTeamCalendar() {
      try {
        const { data } = await api.get('/leave/team-calendar');
        if (data.success) {
          this.teamCalendar = data.data;
        }
      } catch (error) {
        console.error('Error fetching team calendar:', error);
      }
    },

    async fetchAbsenteeismReport() {
      try {
        const { data } = await api.get('/leave/absenteeism-report');
        if (data.success) {
          this.absenteeismReport = data.data;
        }
      } catch (error) {
        console.error('Error fetching absenteeism report:', error);
      }
    },

    async adjustLeaveBalance(payload) {
      try {
        const { data } = await api.post('/leave/balances/adjust', payload);
        return { success: true, data: data.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to adjust leave balance.',
        };
      }
    },
  },
});
