import { defineStore } from 'pinia';
import api from '../services/api';

export const useRecruitmentStore = defineStore('recruitment', {
  state: () => ({
    jobs: [],
    applicants: [],
    isLoading: false,
  }),

  actions: {
    async fetchJobs(params = {}) {
      try {
        const { data } = await api.get('/recruitment/jobs', { params });
        if (data.success) {
          this.jobs = data.data;
        }
      } catch (error) {
        console.error('Error fetching job postings:', error);
      }
    },

    async createJob(payload) {
      try {
        const { data } = await api.post('/recruitment/jobs', payload);
        if (data.success) {
          this.jobs.unshift(data.data);
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to create job posting.',
        };
      }
    },

    async updateJob(id, payload) {
      try {
        const { data } = await api.put(`/recruitment/jobs/${id}`, payload);
        if (data.success) {
          const idx = this.jobs.findIndex(j => j._id === id);
          if (idx !== -1) this.jobs[idx] = data.data;
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update job posting.',
        };
      }
    },

    async deleteJob(id) {
      try {
        await api.delete(`/recruitment/jobs/${id}`);
        this.jobs = this.jobs.filter(j => j._id !== id);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to delete job posting.',
        };
      }
    },

    async fetchApplicants(params = {}) {
      this.isLoading = true;
      try {
        const { data } = await api.get('/recruitment/applicants', { params });
        if (data.success) {
          this.applicants = data.data;
        }
      } catch (error) {
        console.error('Error fetching applicants:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async applyForJob(formData) {
      try {
        const { data } = await api.post('/recruitment/apply', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return { success: true, data: data.data };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Application submission failed.',
        };
      }
    },

    async updateApplicantStage(id, stage) {
      try {
        const { data } = await api.put(`/recruitment/applicants/${id}/stage`, { stage });
        if (data.success) {
          const idx = this.applicants.findIndex(a => a._id === id);
          if (idx !== -1) this.applicants[idx] = data.data;
          return { success: true };
        }
      } catch (error) {
        console.error('Error updating applicant stage:', error);
        return { success: false, message: 'Failed to update stage.' };
      }
    },

    async addApplicantNote(id, text) {
      try {
        const { data } = await api.post(`/recruitment/applicants/${id}/notes`, { text });
        if (data.success) {
          const idx = this.applicants.findIndex(a => a._id === id);
          if (idx !== -1) this.applicants[idx] = data.data;
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to add note.',
        };
      }
    },
  },
});
