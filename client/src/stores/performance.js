import { defineStore } from 'pinia';
import api from '../services/api';

export const usePerformanceStore = defineStore('performance', {
  state: () => ({
    goals: [],
    cycles: [],
    reviews: [],
    reviewSummary: null,
    isLoading: false,
  }),

  actions: {
    async fetchGoals(params = {}) {
      this.isLoading = true;
      try {
        const { data } = await api.get('/performance/goals', { params });
        if (data.success) {
          this.goals = data.data;
        }
      } catch (error) {
        console.error('Error fetching goals:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async createGoal(payload) {
      try {
        const { data } = await api.post('/performance/goals', payload);
        if (data.success) {
          this.goals.push(data.data);
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to create goal.',
        };
      }
    },

    async updateGoal(id, payload) {
      try {
        const { data } = await api.put(`/performance/goals/${id}`, payload);
        if (data.success) {
          const idx = this.goals.findIndex(g => g._id === id);
          if (idx !== -1) this.goals[idx] = data.data;
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update goal.',
        };
      }
    },

    async deleteGoal(id) {
      try {
        await api.delete(`/performance/goals/${id}`);
        this.goals = this.goals.filter(g => g._id !== id);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to delete goal.',
        };
      }
    },

    async fetchCycles() {
      try {
        const { data } = await api.get('/performance/cycles');
        if (data.success) {
          this.cycles = data.data;
        }
      } catch (error) {
        console.error('Error fetching review cycles:', error);
      }
    },

    async createCycle(payload) {
      try {
        const { data } = await api.post('/performance/cycles', payload);
        if (data.success) {
          this.cycles.unshift(data.data);
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to create review cycle.',
        };
      }
    },

    async fetchReviews(params = {}) {
      this.isLoading = true;
      try {
        const { data } = await api.get('/performance/reviews', { params });
        if (data.success) {
          this.reviews = data.data;
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async submitReview(payload) {
      try {
        const { data } = await api.post('/performance/reviews', payload);
        if (data.success) {
          this.reviews.unshift(data.data);
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to submit review.',
        };
      }
    },

    async fetchReviewSummary(employeeId) {
      try {
        const { data } = await api.get(`/performance/reviews/summary/${employeeId}`);
        if (data.success) {
          this.reviewSummary = data.data;
        }
      } catch (error) {
        console.error('Error fetching review summary:', error);
      }
    },
  },
});
