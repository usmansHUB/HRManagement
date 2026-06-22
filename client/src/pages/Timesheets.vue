<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import api from '../services/api';
import HrmButton from '../components/ui/HrmButton.vue';
import HrmTable from '../components/ui/HrmTable.vue';
import HrmBadge from '../components/ui/HrmBadge.vue';
import { Clock, Plus, Trash2, Check, X, Calendar } from 'lucide-vue-next';

const authStore = useAuthStore();
const { addToast } = useToast();

const timesheets = ref([]);
const pendingReviews = ref([]);
const isLoading = ref(false);
const activeTab = ref('log'); // 'log' | 'review'
const configuredProjects = ref([]);

// Target week start (Monday)
const selectedWeekStart = ref('');
const timesheetStatus = ref('draft');
const timesheetId = ref(null);

const projectsList = ref([
  { project: 'HRM Enterprise Portal', task: 'Dashboard Widgets', hours: [8, 8, 8, 8, 8, 0, 0] }
]);

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const isManagerOrAdmin = computed(() => ['Super Admin', 'HR Manager', 'Department Manager'].includes(authStore.userRole));

// Get Monday of the current week
const getMonday = (d) => {
  d = new Date(d);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const mon = new Date(d.setDate(diff));
  mon.setHours(0, 0, 0, 0);
  return mon;
};

const formatDateString = (dateObj) => {
  return dateObj.toISOString().split('T')[0];
};

const setInitialWeek = () => {
  const currentMon = getMonday(new Date());
  selectedWeekStart.value = formatDateString(currentMon);
};

const getEndOfWeekDateString = (startStr) => {
  if (!startStr) return '';
  const start = new Date(startStr);
  const end = new Date(start.setDate(start.getDate() + 6));
  return formatDateString(end);
};

const loadWeeklyTimesheet = async () => {
  if (!selectedWeekStart.value) return;
  isLoading.value = true;
  try {
    const start = selectedWeekStart.value;
    const { data } = await api.get(`/timesheets?startDate=${start}`);
    if (data.success && data.data.length > 0) {
      const ts = data.data[0];
      timesheetId.value = ts._id;
      timesheetStatus.value = ts.status;
      projectsList.value = ts.entries.map(e => ({
        project: e.project,
        task: e.task,
        hours: [...e.hours],
      }));
    } else {
      timesheetId.value = null;
      timesheetStatus.value = 'none';
      projectsList.value = [
        { project: '', task: '', hours: [0, 0, 0, 0, 0, 0, 0] }
      ];
    }
  } catch (err) {
    console.error('Failed to load weekly timesheet:', err);
  } finally {
    isLoading.value = false;
  }
};

const loadPendingReviews = async () => {
  if (!isManagerOrAdmin.value) return;
  try {
    const { data } = await api.get('/timesheets?status=submitted');
    if (data.success) {
      pendingReviews.value = data.data;
    }
  } catch (err) {
    console.error('Failed to load pending reviews:', err);
  }
};

const addRow = () => {
  projectsList.value.push({
    project: '',
    task: '',
    hours: [0, 0, 0, 0, 0, 0, 0]
  });
};

const removeRow = (index) => {
  projectsList.value.splice(index, 1);
  if (projectsList.value.length === 0) addRow();
};

const getRowTotal = (row) => {
  return row.hours.reduce((sum, h) => sum + (parseFloat(h) || 0), 0);
};

const getGrandTotal = () => {
  return projectsList.value.reduce((sum, row) => sum + getRowTotal(row), 0);
};

const handleSave = async (submitStatus) => {
  // Validate empty fields
  const invalid = projectsList.value.some(r => !r.project.trim() || !r.task.trim());
  if (invalid) {
    return addToast('Please enter a project and task name for all logged rows.', 'warning');
  }

  try {
    const start = new Date(selectedWeekStart.value);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const payload = {
      startDate: selectedWeekStart.value,
      endDate: formatDateString(end),
      entries: projectsList.value,
      status: submitStatus,
    };

    const { data } = await api.post('/timesheets', payload);
    if (data.success) {
      addToast(submitStatus === 'draft' ? 'Timesheet draft saved successfully!' : 'Timesheet submitted for review!', 'success');
      loadWeeklyTimesheet();
      loadPendingReviews();
    }
  } catch (err) {
    addToast(err.response?.data?.message || 'Failed to submit timesheet.', 'error');
  }
};

const resolveTimesheet = async (id, status) => {
  try {
    const { data } = await api.put(`/timesheets/${id}/approve`, { status });
    if (data.success) {
      addToast(`Timesheet has been ${status}!`, 'success');
      loadPendingReviews();
      loadWeeklyTimesheet();
    }
  } catch (err) {
    addToast(err.response?.data?.message || 'Failed to resolve timesheet.', 'error');
  }
};

watch(selectedWeekStart, () => {
  loadWeeklyTimesheet();
});

watch(activeTab, (tab) => {
  if (tab === 'review') {
    loadPendingReviews();
  }
});

const fetchConfiguredProjects = async () => {
  try {
    const { data } = await api.get('/settings/projects?status=active');
    if (data.success) {
      configuredProjects.value = data.data;
    }
  } catch (err) {
    console.error('Failed to load configured projects:', err);
  }
};

onMounted(() => {
  setInitialWeek();
  loadWeeklyTimesheet();
  loadPendingReviews();
  fetchConfiguredProjects();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header banner -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white flex items-center gap-2">
          <Clock class="w-6 h-6 text-brand-blue" />
          Weekly Timesheets
        </h1>
        <p class="text-slate-400 text-xs mt-1">Track billable or operational client hours against corporate projects.</p>
      </div>
    </div>

    <!-- Navigation Tabs if Manager / Admin -->
    <div v-if="isManagerOrAdmin" class="flex border-b border-brand-border/60">
      <button 
        @click="activeTab = 'log'"
        :class="['px-5 py-3 text-sm font-semibold border-b-2 transition duration-200 cursor-pointer', activeTab === 'log' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-400 hover:text-white']"
      >
        Log My Hours
      </button>
      <button 
        @click="activeTab = 'review'"
        :class="['px-5 py-3 text-sm font-semibold border-b-2 transition duration-200 cursor-pointer', activeTab === 'review' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-400 hover:text-white']"
      >
        Review Submissions ({{ pendingReviews.length }})
      </button>
    </div>

    <!-- ==================== Tab 1: Log Timesheet ==================== -->
    <div v-if="activeTab === 'log'" class="space-y-6">
      
      <!-- Week Selector & Action Row -->
      <div class="flex flex-wrap items-center justify-between p-4 bg-brand-card/30 border border-brand-border/60 rounded-xl glass-panel gap-4">
        <div class="flex items-center gap-3">
          <Calendar class="w-4 h-4 text-brand-blue" />
          <span class="text-xs text-slate-400 font-mono">Week starting (Monday):</span>
          <input 
            type="date" 
            v-model="selectedWeekStart" 
            class="bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2 rounded-lg outline-none cursor-pointer"
          />
          <span class="text-xs text-slate-500 font-mono">to {{ getEndOfWeekDateString(selectedWeekStart) }}</span>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-400 font-mono mr-2">Status: <HrmBadge :status="timesheetStatus" /></span>
          <div v-if="['draft', 'none', 'rejected'].includes(timesheetStatus)" class="flex gap-2">
            <HrmButton variant="secondary" @click="handleSave('draft')">Save Draft</HrmButton>
            <HrmButton variant="primary" @click="handleSave('submitted')">Submit for Review</HrmButton>
          </div>
          <div v-else-if="timesheetStatus === 'submitted'" class="text-xs text-amber-400 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            Awaiting Manager Approval
          </div>
          <div v-else-if="timesheetStatus === 'approved'" class="text-xs text-emerald-400 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            ✓ Approved & Locked
          </div>
        </div>
      </div>

      <!-- Timesheet Grid -->
      <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr class="border-b border-brand-border/50 text-[10px] text-slate-400 uppercase font-mono font-semibold">
              <th class="pb-3 w-[20%]">Project</th>
              <th class="pb-3 w-[20%]">Task Description</th>
              <th v-for="day in daysOfWeek" :key="day" class="pb-3 text-center w-[7%]">{{ day.slice(0,3) }}</th>
              <th class="pb-3 text-center w-[8%]">Total</th>
              <th class="pb-3 w-[5%]"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-border/30">
            <tr v-for="(row, idx) in projectsList" :key="idx" class="group">
              <td class="py-3 pr-2">
                <select 
                  v-model="row.project" 
                  :disabled="['submitted', 'approved'].includes(timesheetStatus)"
                  class="w-full bg-[#0E1322]/50 border border-brand-border rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-brand-blue cursor-pointer"
                >
                  <option value="" disabled>Select Project</option>
                  <option v-for="p in configuredProjects" :key="p._id" :value="p.name">{{ p.name }}</option>
                  <option v-if="configuredProjects.length === 0" disabled>No active projects found.</option>
                </select>
              </td>
              <td class="py-3 pr-2">
                <input 
                  type="text" 
                  v-model="row.task" 
                  placeholder="e.g. Backend seeding"
                  :disabled="['submitted', 'approved'].includes(timesheetStatus)"
                  class="w-full bg-[#0E1322]/50 border border-brand-border rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-brand-blue"
                />
              </td>
              <td v-for="(h, dIdx) in 7" :key="dIdx" class="py-3 px-1 text-center">
                <input 
                  type="number" 
                  v-model="row.hours[dIdx]" 
                  min="0" 
                  max="24"
                  :disabled="['submitted', 'approved'].includes(timesheetStatus)"
                  class="w-12 text-center bg-[#0E1322]/50 border border-brand-border rounded py-1.5 text-xs text-white outline-none focus:border-brand-blue"
                />
              </td>
              <td class="py-3 text-center text-xs font-mono font-bold text-slate-300">
                {{ getRowTotal(row) }}h
              </td>
              <td class="py-3 text-center">
                <button 
                  v-if="['draft', 'none', 'rejected'].includes(timesheetStatus)"
                  @click="removeRow(idx)"
                  class="text-rose-500 hover:text-rose-400 cursor-pointer p-1 rounded hover:bg-rose-500/10 transition"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Timesheet Grid Footer -->
        <div class="mt-6 flex items-center justify-between pt-4 border-t border-brand-border/40">
          <HrmButton 
            v-if="['draft', 'none', 'rejected'].includes(timesheetStatus)"
            variant="secondary" 
            class="text-xs" 
            @click="addRow"
          >
            <Plus class="w-3.5 h-3.5 mr-1" />
            Add Project Row
          </HrmButton>
          <div v-else></div>

          <div class="text-right">
            <span class="text-[10px] text-slate-500 font-mono">GRAND TOTAL HOURS</span>
            <div class="text-xl font-bold text-brand-blue font-mono">{{ getGrandTotal() }}h</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== Tab 2: Review Submissions ==================== -->
    <div v-else class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel">
      <h3 class="text-md font-bold text-white mb-6">Review Submissions</h3>

      <div v-if="pendingReviews.length === 0" class="text-center text-slate-500 py-12">
        No pending timesheets require approval.
      </div>

      <div v-else class="space-y-6">
        <div 
          v-for="ts in pendingReviews" 
          :key="ts._id"
          class="p-5 rounded-lg border border-brand-border/60 bg-black/25 space-y-4"
        >
          <!-- User info -->
          <div class="flex items-center justify-between border-b border-brand-border/30 pb-3">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center font-bold text-xs text-white">
                <img v-if="ts.employeeId?.avatar" :src="ts.employeeId.avatar" class="w-full h-full object-cover" />
                <span v-else>{{ ts.employeeId?.firstName.slice(0, 1) + ts.employeeId?.lastName.slice(0,1) }}</span>
              </div>
              <div>
                <h5 class="text-xs font-bold text-white">{{ ts.employeeId?.firstName }} {{ ts.employeeId?.lastName }}</h5>
                <span class="text-[9px] text-slate-500 font-mono">Code: {{ ts.employeeId?.employeeCode }} | {{ ts.employeeId?.designation }}</span>
              </div>
            </div>
            
            <div class="flex items-center gap-3">
              <span class="text-xs text-slate-400 font-mono">Period: {{ new Date(ts.startDate).toLocaleDateString() }} to {{ new Date(ts.endDate).toLocaleDateString() }}</span>
              <div class="flex gap-2">
                <button 
                  @click="resolveTimesheet(ts._id, 'approved')"
                  class="flex items-center justify-center w-6 h-6 rounded bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 cursor-pointer transition"
                  title="Approve Timesheet"
                >
                  <Check class="w-3.5 h-3.5" />
                </button>
                <button 
                  @click="resolveTimesheet(ts._id, 'rejected')"
                  class="flex items-center justify-center w-6 h-6 rounded bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 cursor-pointer transition"
                  title="Reject Timesheet"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <!-- Entries rows details -->
          <div class="space-y-2.5">
            <div 
              v-for="(entry, entryIdx) in ts.entries" 
              :key="entryIdx"
              class="flex justify-between items-center bg-[#0E1322]/30 p-2.5 rounded border border-brand-border/40 text-xs"
            >
              <div>
                <span class="font-bold text-slate-200">Project:</span> {{ entry.project }} | <span class="font-bold text-slate-300">Task:</span> {{ entry.task }}
              </div>
              <div class="font-mono text-slate-400">
                Logged: [{{ entry.hours.join('h, ') }}h] | <span class="text-brand-blue font-bold">Total: {{ entry.hours.reduce((a,b)=>a+b, 0) }}h</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass-panel {
  backdrop-filter: blur(10px);
}
</style>
