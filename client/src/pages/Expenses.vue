<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import api from '../services/api';
import HrmButton from '../components/ui/HrmButton.vue';
import HrmModal from '../components/ui/HrmModal.vue';
import HrmTable from '../components/ui/HrmTable.vue';
import HrmBadge from '../components/ui/HrmBadge.vue';
import { Receipt, Plus, FileText, Check, X, Sparkles } from 'lucide-vue-next';

const authStore = useAuthStore();
const { addToast } = useToast();

const expenses = ref([]);
const isLoading = ref(false);
const showClaimModal = ref(false);
const activeTab = ref('my'); // 'my' | 'team'

const claimForm = ref({
  title: '',
  category: 'Travel',
  amount: '',
  description: '',
});

const isHrOrAdmin = computed(() => ['Super Admin', 'HR Manager'].includes(authStore.userRole));

const currencySymbol = computed(() => {
  const currency = authStore.companySettings?.currency || 'PKR';
  const symbolMap = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    PKR: 'Rs. '
  };
  return symbolMap[currency] || (currency + ' ');
});

const fetchExpenses = async () => {
  isLoading.value = true;
  try {
    const { data } = await api.get('/expenses');
    if (data.success) {
      expenses.value = data.data;
    }
  } catch (err) {
    console.error('Error fetching expenses:', err);
    addToast('Failed to retrieve expense claims.', 'error');
  } finally {
    isLoading.value = false;
  }
};

const handleCreateClaim = async () => {
  if (!claimForm.value.title || !claimForm.value.amount) {
    return addToast('Please fill out all required fields.', 'warning');
  }
  try {
    const { data } = await api.post('/expenses', claimForm.value);
    if (data.success) {
      addToast('Expense claim logged successfully!', 'success');
      showClaimModal.value = false;
      claimForm.value = { title: '', category: 'Travel', amount: '', description: '' };
      fetchExpenses();
    }
  } catch (err) {
    addToast(err.response?.data?.message || 'Failed to submit claim.', 'error');
  }
};

const resolveClaim = async (id, status) => {
  try {
    const { data } = await api.put(`/expenses/${id}/approve`, { status });
    if (data.success) {
      addToast(`Expense claim has been ${status}!`, 'success');
      fetchExpenses();
    }
  } catch (err) {
    addToast(err.response?.data?.message || 'Failed to resolve claim.', 'error');
  }
};

const filteredExpenses = computed(() => {
  const currentEmpId = authStore.user?.employeeId;
  if (activeTab.value === 'my') {
    return expenses.value.filter(exp => exp.employeeId?._id === currentEmpId || exp.employeeId === currentEmpId);
  }
  return expenses.value; // Managers see all
});

onMounted(async () => {
  await fetchExpenses();
  if (!authStore.companySettings) {
    await authStore.fetchCompanySettings();
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header banner -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white flex items-center gap-2">
          <Receipt class="w-6 h-6 text-brand-blue" />
          Expense Reimbursements
        </h1>
        <p class="text-slate-400 text-xs mt-1">Submit expenditures, upload verification receipts, and monitor approval status.</p>
      </div>

      <HrmButton variant="primary" @click="showClaimModal = true">
        <Plus class="w-4 h-4" />
        New Expense Claim
      </HrmButton>
    </div>

    <!-- Navigation Tabs if HR / Admin -->
    <div v-if="isHrOrAdmin" class="flex border-b border-brand-border/60">
      <button 
        @click="activeTab = 'my'"
        :class="['px-5 py-3 text-sm font-semibold border-b-2 transition duration-200 cursor-pointer', activeTab === 'my' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-400 hover:text-white']"
      >
        My Claims
      </button>
      <button 
        @click="activeTab = 'team'"
        :class="['px-5 py-3 text-sm font-semibold border-b-2 transition duration-200 cursor-pointer', activeTab === 'team' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-400 hover:text-white']"
      >
        Pending Review / All Claims
      </button>
    </div>

    <!-- Expense Claims Table Card -->
    <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel">
      <h3 class="text-md font-bold text-white mb-6">Reimbursement Directory</h3>

      <HrmTable 
        :headers="['Employee', 'Claim Title', 'Category', 'Amount', 'Filed Date', 'Status', 'Actions']" 
        :items="filteredExpenses" 
        :isLoading="isLoading"
      >
        <template #row="{ item }">
          <td class="px-6 py-4">
            <div class="text-xs font-semibold text-white">{{ item.employeeId?.firstName }} {{ item.employeeId?.lastName }}</div>
            <span class="text-[9px] text-slate-500 font-mono block mt-0.5">{{ item.employeeId?.employeeCode }}</span>
          </td>
          <td class="px-6 py-4 text-xs font-semibold text-slate-200">{{ item.title }}</td>
          <td class="px-6 py-4">
            <span class="text-[10px] font-medium text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
              {{ item.category }}
            </span>
          </td>
          <td class="px-6 py-4 text-xs font-mono text-white font-semibold">
            {{ currencySymbol }}{{ (item.amount || 0).toLocaleString() }}
          </td>
          <td class="px-6 py-4 text-xs font-mono text-slate-400">
            {{ new Date(item.createdAt).toLocaleDateString() }}
          </td>
          <td class="px-6 py-4">
            <HrmBadge :status="item.status" />
          </td>
          <td class="px-6 py-4">
            <div v-if="item.status === 'pending' && isHrOrAdmin && (item.employeeId?._id !== authStore.user?.employeeId)" class="flex items-center gap-2">
              <button 
                @click="resolveClaim(item._id, 'approved')"
                class="flex items-center justify-center w-6 h-6 rounded bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 cursor-pointer transition"
                title="Approve claim"
              >
                <Check class="w-3.5 h-3.5" />
              </button>
              <button 
                @click="resolveClaim(item._id, 'rejected')"
                class="flex items-center justify-center w-6 h-6 rounded bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 cursor-pointer transition"
                title="Reject claim"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
            <div v-else-if="item.status !== 'pending'" class="text-[10px] text-slate-500 italic font-mono">
              Processed by: {{ item.approvedBy?.firstName || 'System' }}
            </div>
            <div v-else class="text-[10px] text-slate-500 italic font-mono">
              Awaiting review
            </div>
          </td>
        </template>
      </HrmTable>
    </div>

    <!-- Create Claim Modal -->
    <HrmModal :show="showClaimModal" title="Log Expense Reimbursement Claim" @close="showClaimModal = false" maxWidth="max-w-sm">
      <form @submit.prevent="handleCreateClaim" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Claim Title</label>
          <input type="text" v-model="claimForm.title" required placeholder="e.g. Flight to Lahore Client Meetup" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white focus:border-brand-blue outline-none" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
            <select v-model="claimForm.category" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white focus:border-brand-blue outline-none cursor-pointer">
              <option value="Travel">Travel</option>
              <option value="Meals">Meals</option>
              <option value="Hardware">Hardware</option>
              <option value="Training">Training</option>
              <option value="Utilities">Utilities</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Amount ({{ currencySymbol.trim() }})</label>
            <input type="number" v-model="claimForm.amount" required min="1" placeholder="e.g. 5000" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white focus:border-brand-blue outline-none" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
          <textarea v-model="claimForm.description" rows="2" placeholder="Details of business-related expense..." class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white focus:border-brand-blue outline-none resize-none"></textarea>
        </div>

        <div class="pt-4 flex justify-end gap-3 border-t border-brand-border/40">
          <HrmButton type="button" variant="secondary" @click="showClaimModal = false">Cancel</HrmButton>
          <HrmButton type="submit" variant="primary">Submit Request</HrmButton>
        </div>
      </form>
    </HrmModal>
  </div>
</template>

<style scoped>
.glass-panel {
  backdrop-filter: blur(10px);
}
</style>
