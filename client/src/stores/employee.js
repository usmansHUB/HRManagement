import { defineStore } from 'pinia';
import api from '../services/api';

export const useEmployeeStore = defineStore('employee', {
  state: () => ({
    employees: [],
    orgChart: [],
    currentEmployee: null,
    pagination: { page: 1, limit: 10, total: 0, pages: 1 },
    isLoading: false,
  }),

  actions: {
    async fetchEmployees(params = {}) {
      this.isLoading = true;
      try {
        const { data } = await api.get('/employees', { params });
        if (data.success) {
          this.employees = data.data;
          this.pagination = data.pagination;
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchOrgChart() {
      try {
        const { data } = await api.get('/employees/org-chart');
        if (data.success) {
          this.orgChart = data.data;
        }
      } catch (error) {
        console.error('Error fetching org chart:', error);
      }
    },

    async fetchEmployeeById(id) {
      this.isLoading = true;
      try {
        const { data } = await api.get(`/employees/${id}`);
        if (data.success) {
          this.currentEmployee = data.data;
        }
      } catch (error) {
        console.error('Error fetching employee by ID:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async createEmployee(formData) {
      try {
        const { data } = await api.post('/employees', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return { success: true, data: data.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to create employee.',
        };
      }
    },

    async updateEmployee(id, formData) {
      try {
        const { data } = await api.put(`/employees/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return { success: true, data: data.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update employee.',
        };
      }
    },

    async deleteEmployee(id) {
      try {
        const { data } = await api.delete(`/employees/${id}`);
        return { success: true, message: data.message };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to delete employee.',
        };
      }
    },

    async bulkImport(file) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const { data } = await api.post('/employees/bulk-import', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return { success: true, data: data.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'CSV Bulk Import failed.',
        };
      }
    },
  },
});
