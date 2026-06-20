import { defineStore } from 'pinia';
import api from '../services/api';

export const usePayrollStore = defineStore('payroll', {
  state: () => ({
    draftPayrolls: [],
    history: [],
    isLoading: false,
  }),

  actions: {
    async fetchPayrollDraft(params = {}) {
      this.isLoading = true;
      try {
        const { data } = await api.get('/payroll/run', { params });
        if (data.success) {
          this.draftPayrolls = data.data;
        }
      } catch (error) {
        console.error('Error fetching payroll draft:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async processPayroll(payload) {
      try {
        const { data } = await api.post('/payroll/run', payload);
        return { success: true, message: data.message };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to process payroll.',
        };
      }
    },

    async fetchPayrollHistory(params = {}) {
      this.isLoading = true;
      try {
        const { data } = await api.get('/payroll/history', { params });
        if (data.success) {
          this.history = data.data;
        }
      } catch (error) {
        console.error('Error fetching payroll history:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async downloadPayslip(id) {
      try {
        const response = await api.get(`/payroll/payslip/${id}`, {
          responseType: 'blob', // Expect PDF binary file
        });
        
        // Create browser download link dynamically
        const file = new Blob([response.data], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = fileURL;
        link.setAttribute('download', `payslip_${id}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return { success: true };
      } catch (error) {
        console.error('Error downloading payslip:', error);
        return { success: false, message: 'Failed to download PDF payslip.' };
      }
    },
  },
});
