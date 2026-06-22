<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import { formatLocalDate } from '../utils/date';
import api from '../services/api';
import HrmButton from '../components/ui/HrmButton.vue';
import HrmModal from '../components/ui/HrmModal.vue';
import HrmTable from '../components/ui/HrmTable.vue';
import HrmBadge from '../components/ui/HrmBadge.vue';
import { ShieldAlert, Plus, CheckCircle, Search, FileText } from 'lucide-vue-next';

const authStore = useAuthStore();
const { addToast } = useToast();

const cases = ref([]);
const employees = ref([]);
const isLoading = ref(false);

const showCreateModal = ref(false);
const createForm = ref({ employeeId: '', title: '', description: '', actionTaken: '' });

const showResolveModal = ref(false);
const selectedCaseId = ref(null);
const resolveForm = ref({ actionTaken: '', status: 'resolved' });

const isHrOrAdmin = computed(() => ['Super Admin', 'HR Manager'].includes(authStore.userRole));

const headers = computed(() => {
  const list = [];
  if (isHrOrAdmin.value) {
    list.push('Employee');
  }
  list.push('Title', 'Description', 'Action Taken', 'Status', 'Logged Date');
  if (isHrOrAdmin.value) {
    list.push('Actions');
  }
  return list;
});

const fetchCases = async () => {
  isLoading.value = true;
  try {
    const { data } = await api.get('/discipline');
    if (data.success) {
      cases.value = data.data;
    }
  } catch (err) {
    console.error('Failed to fetch disciplinary cases:', err);
    addToast('Failed to load disciplinary records.', 'error');
  } finally {
    isLoading.value = false;
  }
};

const fetchEmployees = async () => {
  try {
    const { data } = await api.get('/employees?limit=100');
    if (data.success) {
      employees.value = data.data;
    }
  } catch (err) {
    console.error('Failed to fetch employees list:', err);
  }
};

const openCreateCase = () => {
  createForm.value = { employeeId: '', title: '', description: '', actionTaken: '' };
  showCreateModal.value = true;
};

const submitCreateCase = async () => {
  if (!createForm.value.employeeId || !createForm.value.title || !createForm.value.description) {
    return addToast('Please fill out all required fields.', 'warning');
  }
  try {
    const { data } = await api.post('/discipline', createForm.value);
    if (data.success) {
      addToast('Disciplinary case logged successfully.', 'success');
      showCreateModal.value = false;
      await fetchCases();
    }
  } catch (err) {
    addToast(err.response?.data?.message || 'Failed to register incident.', 'error');
  }
};

const openResolve = (c) => {
  selectedCaseId.value = c._id;
  resolveForm.value = { actionTaken: c.actionTaken || '', status: 'resolved' };
  showResolveModal.value = true;
};

const submitResolveCase = async () => {
  if (!resolveForm.value.actionTaken.trim()) {
    return addToast('Please provide the action taken details.', 'warning');
  }
  try {
    const { data } = await api.put(`/discipline/${selectedCaseId.value}/resolve`, resolveForm.value);
    if (data.success) {
      addToast('Case updated and resolved successfully.', 'success');
      showResolveModal.value = false;
      await fetchCases();
    }
  } catch (err) {
    addToast(err.response?.data?.message || 'Failed to update case.', 'error');
  }
};

onMounted(() => {
  fetchCases();
  if (isHrOrAdmin.value) {
    fetchEmployees();
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldAlert class="w-6 h-6 text-brand-purple" />
          Disciplinary Cases
        </h1>
        <p class="text-slate-400 text-xs mt-1">
          {{ isHrOrAdmin ? 'Create, document, and track corporate disciplinary incidents and actions taken.' : 'View logged incidents related to your account.' }}
        </p>
      </div>

      <HrmButton v-if="isHrOrAdmin" variant="primary" @click="openCreateCase">
        <Plus class="w-4 h-4 mr-1" />
        Report Incident
      </HrmButton>
    </div>

    <!-- Table Container -->
    <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel">
      <div v-if="cases.length === 0" class="text-center py-12 text-slate-500 text-sm">
        No disciplinary cases recorded.
      </div>
      <HrmTable v-else :headers="headers" :items="cases" :isLoading="isLoading">
        <template #row="{ item }">
          <!-- Employee Details (Admin/HR Only) -->
          <td v-if="isHrOrAdmin" class="px-6 py-3.5 text-xs text-slate-300">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center font-bold text-xs text-white">
                <img v-if="item.employeeId?.avatar" :src="item.employeeId.avatar" class="w-full h-full object-cover" />
                <span v-else>{{ item.employeeId?.firstName.slice(0, 1) + item.employeeId?.lastName.slice(0, 1) }}</span>
              </div>
              <div>
                <h5 class="text-xs font-bold text-white leading-none mb-1">
                  {{ item.employeeId?.firstName }} {{ item.employeeId?.lastName }}
                </h5>
                <span class="text-[9px] text-slate-500 font-mono block">Code: {{ item.employeeId?.employeeCode }}</span>
              </div>
            </div>
          </td>

          <!-- Title -->
          <td class="px-6 py-3.5 text-xs font-bold text-slate-100">{{ item.title }}</td>

          <!-- Description -->
          <td class="px-6 py-3.5 text-xs text-slate-300 max-w-[220px] truncate" :title="item.description">
            {{ item.description }}
          </td>

          <!-- Action Taken -->
          <td class="px-6 py-3.5 text-xs text-slate-400 max-w-[180px] truncate animate-pulse-subtle" :title="item.actionTaken">
            {{ item.actionTaken || '--' }}
          </td>

          <!-- Status Badge -->
          <td class="px-6 py-3.5 text-xs text-slate-400 font-semibold font-mono">
            <HrmBadge :status="item.status === 'active' ? 'pending' : 'completed'">
              {{ item.status === 'active' ? 'Active Case' : 'Resolved' }}
            </HrmBadge>
          </td>

          <!-- Logged Date -->
          <td class="px-6 py-3.5 text-xs text-slate-400 font-mono">{{ formatLocalDate(item.createdAt) }}</td>

          <!-- Action Buttons (Admin/HR Only) -->
          <td v-if="isHrOrAdmin" class="px-6 py-3.5">
            <div class="flex items-center gap-2">
              <button 
                v-if="item.status === 'active'"
                @click="openResolve(item)" 
                class="text-[10px] text-emerald-400 hover:text-emerald-300 px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded cursor-pointer font-bold transition flex items-center gap-1"
              >
                <CheckCircle class="w-3 h-3" />
                Resolve
              </button>
              <span v-else class="text-[10px] text-slate-500 font-semibold flex items-center gap-1 font-mono">
                ✓ Resolved
              </span>
            </div>
          </td>
        </template>
      </HrmTable>
    </div>

    <!-- Create Case Modal -->
    <HrmModal :show="showCreateModal" title="Report Disciplinary Incident" @close="showCreateModal = false" maxWidth="max-w-md">
      <form @submit.prevent="submitCreateCase" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">Select Employee</label>
          <select 
            v-model="createForm.employeeId" 
            required 
            class="w-full bg-[#0E1322] border border-brand-border rounded px-3 py-2 text-sm text-white focus:border-brand-blue outline-none cursor-pointer"
          >
            <option value="" disabled>Choose Employee</option>
            <option v-for="emp in employees" :key="emp._id" :value="emp._id">
              {{ emp.firstName }} {{ emp.lastName }} ({{ emp.employeeCode }})
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1.5">Case Title / Incident</label>
          <input 
            type="text" 
            v-model="createForm.title" 
            required 
            placeholder="e.g. Unexcused Absenteeism" 
            class="w-full bg-[#0E1322] border border-brand-border rounded px-3 py-2 text-sm text-white focus:border-brand-blue outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1.5">Description of Incident</label>
          <textarea 
            v-model="createForm.description" 
            required 
            placeholder="Document detailed notes about the incident..." 
            class="w-full bg-[#0E1322] border border-brand-border rounded px-3 py-2 text-sm text-white h-28 focus:border-brand-blue outline-none resize-none"
          ></textarea>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1.5">Action Plan (Optional)</label>
          <input 
            type="text" 
            v-model="createForm.actionTaken" 
            placeholder="e.g. Written warning issued" 
            class="w-full bg-[#0E1322] border border-brand-border rounded px-3 py-2 text-sm text-white focus:border-brand-blue outline-none"
          />
        </div>

        <div class="pt-4 flex justify-end gap-3 border-t border-brand-border/40">
          <HrmButton type="button" variant="secondary" @click="showCreateModal = false">Cancel</HrmButton>
          <HrmButton type="submit" variant="primary">Log Incident</HrmButton>
        </div>
      </form>
    </HrmModal>

    <!-- Resolve Case Modal -->
    <HrmModal :show="showResolveModal" title="Update / Resolve Disciplinary Case" @close="showResolveModal = false" maxWidth="max-w-md">
      <form @submit.prevent="submitResolveCase" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1.5 font-mono">Case Status</label>
          <select 
            v-model="resolveForm.status" 
            required 
            class="w-full bg-[#0E1322] border border-brand-border rounded px-3 py-2 text-sm text-white focus:border-brand-blue outline-none cursor-pointer"
          >
            <option value="active">Active (Keep Open)</option>
            <option value="resolved">Resolved (Close Case)</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1.5">Action Taken & Resolutions</label>
          <textarea 
            v-model="resolveForm.actionTaken" 
            required 
            placeholder="Document details of resolutions, discussions, or penalty details..." 
            class="w-full bg-[#0E1322] border border-brand-border rounded px-3 py-2 text-sm text-white h-32 focus:border-brand-blue outline-none resize-none"
          ></textarea>
        </div>

        <div class="pt-4 flex justify-end gap-3 border-t border-brand-border/40">
          <HrmButton type="button" variant="secondary" @click="showResolveModal = false">Cancel</HrmButton>
          <HrmButton type="submit" variant="primary">Update Case</HrmButton>
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
