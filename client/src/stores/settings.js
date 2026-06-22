import { defineStore } from 'pinia';
import api from '../services/api';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    companySettings: null,
    departments: [],
    projects: [],
    isLoading: false,
  }),

  actions: {
    async fetchCompanySettings() {
      try {
        const { data } = await api.get('/settings/company');
        if (data.success) {
          this.companySettings = data.data;
        }
      } catch (error) {
        console.error('Error fetching company settings:', error);
      }
    },

    async updateCompanySettings(formData) {
      try {
        const { data } = await api.put('/settings/company', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (data.success) {
          this.companySettings = data.data;
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update company settings.',
        };
      }
    },

    async fetchDepartments() {
      this.isLoading = true;
      try {
        const { data } = await api.get('/settings/departments');
        if (data.success) {
          this.departments = data.data;
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async createDepartment(payload) {
      try {
        const { data } = await api.post('/settings/departments', payload);
        if (data.success) {
          this.departments.push(data.data);
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to create department.',
        };
      }
    },

    async updateDepartment(id, payload) {
      try {
        const { data } = await api.put(`/settings/departments/${id}`, payload);
        if (data.success) {
          const idx = this.departments.findIndex(d => d._id === id);
          if (idx !== -1) this.departments[idx] = data.data;
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update department.',
        };
      }
    },

    async deleteDepartment(id) {
      try {
        await api.delete(`/settings/departments/${id}`);
        this.departments = this.departments.filter(d => d._id !== id);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to delete department.',
        };
      }
    },

    async fetchProjects() {
      this.isLoading = true;
      try {
        const { data } = await api.get('/settings/projects');
        if (data.success) {
          this.projects = data.data;
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async createProject(payload) {
      try {
        const { data } = await api.post('/settings/projects', payload);
        if (data.success) {
          this.projects.push(data.data);
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to create project.',
        };
      }
    },

    async deleteProject(id) {
      try {
        await api.delete(`/settings/projects/${id}`);
        this.projects = this.projects.filter(p => p._id !== id);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to delete project.',
        };
      }
    },
  },
});
