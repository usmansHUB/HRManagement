import { defineStore } from 'pinia';
import api from '../services/api';

export const useLndStore = defineStore('lnd', {
  state: () => ({
    courses: [],
    assignments: [],
    isLoading: false,
  }),

  actions: {
    async fetchCourses() {
      try {
        const { data } = await api.get('/lnd/courses');
        if (data.success) {
          this.courses = data.data;
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    },

    async createCourse(payload) {
      try {
        const { data } = await api.post('/lnd/courses', payload);
        if (data.success) {
          this.courses.unshift(data.data);
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to create course.',
        };
      }
    },

    async updateCourse(id, payload) {
      try {
        const { data } = await api.put(`/lnd/courses/${id}`, payload);
        if (data.success) {
          const idx = this.courses.findIndex(c => c._id === id);
          if (idx !== -1) this.courses[idx] = data.data;
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update course.',
        };
      }
    },

    async deleteCourse(id) {
      try {
        await api.delete(`/lnd/courses/${id}`);
        this.courses = this.courses.filter(c => c._id !== id);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to delete course.',
        };
      }
    },

    async fetchAssignments(params = {}) {
      this.isLoading = true;
      try {
        const { data } = await api.get('/lnd/assignments', { params });
        if (data.success) {
          this.assignments = data.data;
        }
      } catch (error) {
        console.error('Error fetching course assignments:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async assignCourse(payload) {
      try {
        const { data } = await api.post('/lnd/assignments', payload);
        if (data.success) {
          return { success: true, message: data.message, data: data.data };
        }
        return { success: false, message: data.message || 'Assignment failed.' };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to assign course.',
        };
      }
    },

    async updateProgress(id, progress) {
      try {
        const { data } = await api.put(`/lnd/assignments/${id}/progress`, { progress });
        if (data.success) {
          const idx = this.assignments.findIndex(a => a._id === id);
          if (idx !== -1) this.assignments[idx] = data.data;
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update course progress.',
        };
      }
    },
  },
});
