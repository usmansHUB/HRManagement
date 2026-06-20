<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useAttendanceStore } from '../stores/attendance';
import { useLeaveStore } from '../stores/leave';
import { useToast } from '../composables/useToast';
import { useGsap } from '../composables/useGsap';
import { formatDate, formatLocalDate } from '../utils/date';
import HrmButton from '../components/ui/HrmButton.vue';
import HrmModal from '../components/ui/HrmModal.vue';
import HrmTable from '../components/ui/HrmTable.vue';
import HrmBadge from '../components/ui/HrmBadge.vue';
import { Calendar, Clock, FileText, Send, UserCheck, CalendarRange, Eye } from 'lucide-vue-next';

const authStore = useAuthStore();
const attendanceStore = useAttendanceStore();
const leaveStore = useLeaveStore();
const { addToast } = useToast();
const { animateRowStagger } = useGsap();

const userRole = computed(() => authStore.userRole);
const isEmployee = computed(() => authStore.isRegularEmployee);

const activeTab = ref('attendance'); // 'attendance' | 'leaves' | 'approvals'

// Timecard States
const systemTime = ref(new Date().toLocaleTimeString());
let timerInterval = null;

// Modals
const showRequestModal = ref(false);
const showResolveModal = ref(false);

// Leave Request Form
const leaveForm = ref({
  leaveTypeId: '',
  startDate: '',
  endDate: '',
  reason: '',
  isHalfDay: false,
});
const leaveAttachment = ref(null);

// Leave Resolution workflow state
const selectedRequest = ref(null);
const resolveStatus = ref('approved'); // 'approved' | 'rejected'
const resolveComment = ref('');

// Calendar Heatmap configuration
const monthDays = ref([]);

const logs = computed(() => attendanceStore.logs);
const todayLog = computed(() => attendanceStore.todayLog);
const monthlySummary = computed(() => attendanceStore.monthlySummary?.summary || {});
const leaveBalances = computed(() => leaveStore.balances);
const leaveTypes = computed(() => leaveStore.leaveTypes);
const leaveRequests = computed(() => leaveStore.requests);
const teamCalendar = computed(() => leaveStore.teamCalendar);
const absenteeism = computed(() => leaveStore.absenteeismReport);

const formatTime = (isoString) => {
  if (!isoString) return '--';
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Generate calendar cells for current month heatmap
const generateHeatmap = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const cells = [];
  for (let i = 1; i <= daysInMonth; i++) {
    // Construct local ISO date string directly (YYYY-MM-DD) to prevent timezone shifts
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(i).padStart(2, '0');
    const dateStr = `${year}-${mStr}-${dStr}`;
    
    // Find attendance log for this date
    const log = logs.value.find(l => l.date && l.date.startsWith(dateStr));
    const cellDate = new Date(year, month, i);
    
    cells.push({
      day: i,
      dateStr,
      isWeekend: cellDate.getDay() === 0 || cellDate.getDay() === 6,
      status: log ? log.status : (cellDate > new Date() ? 'future' : 'none'),
    });
  }
  monthDays.value = cells;
};

// Refresh attendance
const loadAttendance = async () => {
  await attendanceStore.fetchLogs();
  await attendanceStore.fetchMonthlySummary();
  generateHeatmap();
};

const handleClockIn = async () => {
  const result = await attendanceStore.clockIn({
    location: 'Office Desk',
    device: 'Web Client',
  });

  if (result.success) {
    addToast('Clocked in successfully!', 'success');
    loadAttendance();
  } else {
    addToast(result.message, 'error');
  }
};

const handleClockOut = async () => {
  const result = await attendanceStore.clockOut();
  if (result.success) {
    addToast('Clocked out successfully!', 'success');
    loadAttendance();
  } else {
    addToast(result.message, 'error');
  }
};

const handleAttachmentChange = (e) => {
  leaveAttachment.value = e.target.files[0];
};

const submitLeaveRequest = async () => {
  const formData = new FormData();
  formData.append('leaveTypeId', leaveForm.value.leaveTypeId);
  formData.append('startDate', leaveForm.value.startDate);
  formData.append('endDate', leaveForm.value.endDate);
  formData.append('reason', leaveForm.value.reason);
  formData.append('isHalfDay', leaveForm.value.isHalfDay);
  if (leaveAttachment.value) {
    formData.append('attachment', leaveAttachment.value);
  }

  const result = await leaveStore.applyLeave(formData);
  if (result.success) {
    addToast('Leave request submitted!', 'success');
    showRequestModal.value = false;
    leaveForm.value = { leaveTypeId: '', startDate: '', endDate: '', reason: '', isHalfDay: false };
    leaveAttachment.value = null;
    leaveStore.fetchLeaveBalances();
  } else {
    addToast(result.message, 'error');
  }
};

const openResolveModal = (req) => {
  selectedRequest.value = req;
  resolveStatus.value = 'approved';
  resolveComment.value = '';
  showResolveModal.value = true;
};

const submitResolveRequest = async () => {
  const result = await leaveStore.resolveLeaveRequest(
    selectedRequest.value._id,
    resolveStatus.value,
    resolveComment.value
  );
  if (result.success) {
    addToast(`Leave request ${resolveStatus.value} successfully.`, 'success');
    showResolveModal.value = false;
    leaveStore.fetchLeaveRequests();
    leaveStore.fetchAbsenteeismReport();
  } else {
    addToast(result.message, 'error');
  }
};

onMounted(() => {
  loadAttendance();
  leaveStore.fetchLeaveBalances();
  leaveStore.fetchLeaveTypes();
  leaveStore.fetchLeaveRequests();
  leaveStore.fetchTeamCalendar();
  leaveStore.fetchAbsenteeismReport();

  timerInterval = setInterval(() => {
    systemTime.value = new Date().toLocaleTimeString();
  }, 1000);
});

onUnmounted(() => {
  clearInterval(timerInterval);
});

// Watch logs changes to regenerate calendar maps and animate table rows
watch(logs, () => {
  generateHeatmap();
  nextTick(() => {
    animateRowStagger('.hrm-table tbody tr');
  });
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header banner -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">Time & Leaves Operations</h1>
        <p class="text-slate-400 text-xs mt-1">Clock check-ins, heatmaps, balance accruals, and approvals.</p>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex border-b border-brand-border/60">
      <button 
        @click="activeTab = 'attendance'"
        :class="['px-5 py-3 text-sm font-semibold border-b-2 transition duration-200 cursor-pointer', activeTab === 'attendance' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-400 hover:text-white']"
      >
        My Timecard (Attendance)
      </button>
      <button 
        @click="activeTab = 'leaves'"
        :class="['px-5 py-3 text-sm font-semibold border-b-2 transition duration-200 cursor-pointer', activeTab === 'leaves' ? 'border-brand-purple text-brand-purple' : 'border-transparent text-slate-400 hover:text-white']"
      >
        My Leaves & Balances
      </button>
      <button 
        v-if="userRole !== 'Employee'"
        @click="activeTab = 'approvals'"
        :class="['px-5 py-3 text-sm font-semibold border-b-2 transition duration-200 cursor-pointer', activeTab === 'approvals' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-400 hover:text-white']"
      >
        Team Approvals & Reports
      </button>
    </div>

    <!-- ==================== Tab 1: Attendance card view ==================== -->
    <div v-if="activeTab === 'attendance'" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Punch controls -->
      <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel flex flex-col justify-between text-center min-h-[300px]">
        <div class="space-y-2">
          <Clock class="w-10 h-10 text-brand-blue mx-auto animate-pulse" />
          <h2 class="text-3xl font-extrabold text-white tracking-widest font-mono">{{ systemTime }}</h2>
          <p class="text-slate-400 text-xs uppercase font-mono tracking-wider">{{ new Date().toDateString() }}</p>
        </div>

        <div class="space-y-4 my-6">
          <div v-if="todayLog?.clockIn" class="p-3 bg-brand-blue/10 border border-brand-blue/30 rounded-lg text-xs">
            <span class="text-slate-400">Clocked In: </span>
            <span class="font-bold text-white font-mono">{{ formatTime(todayLog.clockIn) }}</span>
            <span v-if="todayLog.clockOut" class="block mt-1">
              <span class="text-slate-400">Clocked Out: </span>
              <span class="font-bold text-white font-mono">{{ formatTime(todayLog.clockOut) }}</span>
            </span>
          </div>

          <div v-else class="text-xs text-slate-500 italic">
            You are not clocked in for today yet.
          </div>
        </div>

        <div class="flex gap-4">
          <HrmButton 
            variant="primary" 
            class="flex-1 py-3" 
            :disabled="!!todayLog?.clockIn"
            @click="handleClockIn"
          >
            Clock In
          </HrmButton>
          <HrmButton 
            variant="purple" 
            class="flex-1 py-3" 
            :disabled="!todayLog?.clockIn || !!todayLog?.clockOut"
            @click="handleClockOut"
          >
            Clock Out
          </HrmButton>
        </div>
      </div>

      <!-- Calendar heatmap & summary stats -->
      <div class="lg:col-span-2 space-y-6">
        <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-md font-bold text-white">Monthly Attendance Heatmap</h3>
            <span class="text-xs text-slate-400 font-mono">Present (Green) / Late (Yellow) / Absent (Red)</span>
          </div>

          <!-- Heatmap grid -->
          <div class="grid grid-cols-7 gap-3 text-center py-2">
            <div 
              v-for="cell in monthDays" 
              :key="cell.day"
              :class="[
                'aspect-square flex items-center justify-center text-xs font-bold rounded-md border font-mono select-none transition-all duration-200',
                cell.status === 'present' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/5' : '',
                cell.status === 'late' ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-md shadow-amber-500/5' : '',
                cell.status === 'absent' ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-md shadow-rose-500/5' : '',
                cell.status === 'future' ? 'bg-transparent border-brand-border/20 text-slate-600' : '',
                cell.status === 'none' && !cell.isWeekend ? 'bg-brand-border/30 border-brand-border/50 text-slate-400' : '',
                cell.status === 'none' && cell.isWeekend ? 'bg-[#0E1322] border-brand-border/10 text-slate-600' : ''
              ]"
              :title="cell.dateStr"
            >
              {{ cell.day }}
            </div>
          </div>
        </div>

        <!-- Punch logs table -->
        <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel">
          <h3 class="text-md font-bold text-white mb-4">Recent Time Logs</h3>
          <HrmTable :headers="['Date', 'Clock In', 'Clock Out', 'Work Hours', 'Overtime', 'Status']" :items="logs.slice(0, 5)">
            <template #row="{ item }">
              <td class="px-6 py-3 text-xs font-mono">{{ formatDate(item.date) }}</td>
              <td class="px-6 py-3 text-xs font-mono text-slate-300">{{ formatTime(item.clockIn) }}</td>
              <td class="px-6 py-3 text-xs font-mono text-slate-300">{{ formatTime(item.clockOut) }}</td>
              <td class="px-6 py-3 text-xs font-mono font-semibold">{{ item.totalHours }}h</td>
              <td class="px-6 py-3 text-xs font-mono text-brand-blue">{{ item.overtime > 0 ? `${item.overtime}h` : '--' }}</td>
              <td class="px-6 py-3"><HrmBadge :status="item.status" /></td>
            </template>
          </HrmTable>
        </div>
      </div>
    </div>

    <!-- ==================== Tab 2: Leaves management view ==================== -->
    <div v-else-if="activeTab === 'leaves'" class="space-y-6">
      <!-- Leave balances grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          v-for="bal in leaveBalances" 
          :key="bal._id"
          class="p-5 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel relative overflow-hidden group"
        >
          <p class="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">{{ bal.leaveTypeId?.name }}</p>
          <div class="flex items-baseline gap-2 mt-3">
            <span class="text-3xl font-extrabold text-white">{{ bal.remaining }}</span>
            <span class="text-xs text-slate-400">/ {{ bal.allocated }} days left</span>
          </div>
          <!-- Bar indicators -->
          <div class="w-full h-1.5 bg-brand-border/40 rounded-full mt-4 overflow-hidden">
            <div 
              class="h-full bg-brand-purple transition-all duration-300"
              :style="{ width: `${(bal.remaining / bal.allocated) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Action & Request list split -->
      <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-md font-bold text-white">My Leave Requests History</h3>
          <HrmButton variant="primary" @click="showRequestModal = true">
            <CalendarRange class="w-4 h-4" />
            Apply For Leave
          </HrmButton>
        </div>

        <HrmTable :headers="['Leave Type', 'Period', 'Days requested', 'Reason', 'Status', 'Resolved By']" :items="leaveRequests.filter(r => String(r.employeeId?._id || r.employeeId) === String(authStore.user?.employeeId))">
          <template #row="{ item }">
            <td class="px-6 py-3 text-xs font-semibold text-slate-200">{{ item.leaveTypeId?.name }}</td>
            <td class="px-6 py-3 text-xs text-slate-400 font-mono">
              {{ formatDate(item.startDate) }} - {{ formatDate(item.endDate) }}
            </td>
            <td class="px-6 py-3 text-xs font-mono font-bold">{{ item.totalDays }} days</td>
            <td class="px-6 py-3 text-xs truncate max-w-[200px]" :title="item.reason">{{ item.reason }}</td>
            <td class="px-6 py-3"><HrmBadge :status="item.status" /></td>
            <td class="px-6 py-3 text-xs text-slate-400">
              {{ item.approverId ? `${item.approverId.firstName} ${item.approverId.lastName}` : '--' }}
            </td>
          </template>
        </HrmTable>
      </div>
    </div>

    <!-- ==================== Tab 3: HR Admin workflow and reports ==================== -->
    <div v-else-if="activeTab === 'approvals' && userRole !== 'Employee'" class="space-y-8">
      <!-- Absenteeism Report Panel -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel">
          <span class="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Leaves Today</span>
          <h3 class="text-3xl font-extrabold text-white mt-3">{{ absenteeism?.onLeaveToday || 0 }}</h3>
          <p class="text-[10px] text-slate-400 mt-2">Employees currently out of office</p>
        </div>
        <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel">
          <span class="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Absenteeism Ratio</span>
          <h3 class="text-3xl font-extrabold text-brand-purple mt-3">{{ absenteeism?.absenteeismRate || 0 }}%</h3>
          <p class="text-[10px] text-slate-400 mt-2">Active personnel absence rate</p>
        </div>
        <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel">
          <span class="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Calendar schedule</span>
          <h3 class="text-sm font-semibold text-white mt-3">Approved weekly schedules</h3>
          <p class="text-[10px] text-brand-blue mt-2 font-medium">Synced with operations logs</p>
        </div>
      </div>

      <!-- Pending leaves list -->
      <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel">
        <h3 class="text-md font-bold text-white mb-6">Pending Leave Applications</h3>
        
        <HrmTable :headers="['Employee', 'Leave Category', 'Date Period', 'Total Days', 'Attachment', 'Actions']" :items="leaveRequests.filter(r => r.status === 'pending')">
          <template #row="{ item }">
            <td class="px-6 py-3">
              <div class="text-xs font-semibold text-white">{{ item.employeeId?.firstName }} {{ item.employeeId?.lastName }}</div>
              <span class="text-[10px] text-slate-500 font-mono">{{ item.employeeId?.employeeCode }}</span>
            </td>
            <td class="px-6 py-3 text-xs">{{ item.leaveTypeId?.name }}</td>
            <td class="px-6 py-3 text-xs font-mono text-slate-400">
              {{ formatDate(item.startDate) }} - {{ formatDate(item.endDate) }}
            </td>
            <td class="px-6 py-3 text-xs font-mono font-bold text-slate-300">{{ item.totalDays }} days</td>
            <td class="px-6 py-3">
              <a v-if="item.attachmentUrl" :href="item.attachmentUrl" target="_blank" class="text-brand-purple hover:underline text-xs flex items-center gap-1">
                <FileText class="w-3.5 h-3.5" />
                View File
              </a>
              <span v-else class="text-slate-600 text-xs">None</span>
            </td>
            <td class="px-6 py-3">
              <HrmButton variant="primary" class="py-1 px-3 text-xs" @click="openResolveModal(item)">
                <UserCheck class="w-3.5 h-3.5" />
                Process
              </HrmButton>
            </td>
          </template>
        </HrmTable>
      </div>

      <!-- Weekly Calendar view -->
      <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel">
        <h3 class="text-md font-bold text-white mb-4">Approved Team Leaves (Next 30 days)</h3>
        
        <div v-if="teamCalendar.length === 0" class="text-xs text-slate-500 py-6 text-center">
          No approved leaves scheduled in the upcoming weeks.
        </div>

        <div v-else class="space-y-3.5">
          <div 
            v-for="l in teamCalendar" 
            :key="l._id"
            class="flex items-center justify-between p-3 rounded-lg border border-brand-border/40 bg-black/10"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center font-bold text-xs text-white">
                <img v-if="l.employeeId?.avatar" :src="l.employeeId?.avatar" />
                <span v-else>{{ l.employeeId?.firstName.slice(0,1) }}</span>
              </div>
              <div>
                <h5 class="text-xs font-bold text-white">{{ l.employeeId?.firstName }} {{ l.employeeId?.lastName }}</h5>
                <p class="text-[10px] text-brand-purple font-mono uppercase tracking-widest">{{ l.employeeId?.designation }}</p>
              </div>
            </div>

            <div class="text-right">
              <span class="text-xs font-mono text-slate-400 block">
                {{ formatDate(l.startDate) }} - {{ formatDate(l.endDate) }}
              </span>
              <span class="text-[10px] text-slate-500 font-bold block mt-1">{{ l.totalDays }} days ({{ l.leaveTypeId?.name }})</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Apply Leave Request Modal -->
    <HrmModal :show="showRequestModal" title="Apply for Leave" @close="showRequestModal = false" maxWidth="max-w-md">
      <form @submit.prevent="submitLeaveRequest" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Leave Category</label>
          <select v-model="leaveForm.leaveTypeId" required class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white cursor-pointer">
            <option value="">Select Category</option>
            <option v-for="t in leaveTypes" :key="t._id" :value="t._id">{{ t.name }} (Paid: {{ t.isPaid ? 'Yes' : 'No' }})</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Start Date</label>
            <input type="date" v-model="leaveForm.startDate" required class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white cursor-pointer" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">End Date</label>
            <input type="date" v-model="leaveForm.endDate" required class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white cursor-pointer" />
          </div>
        </div>

        <div class="flex items-center gap-2 py-1">
          <input type="checkbox" id="isHalfDay" v-model="leaveForm.isHalfDay" class="rounded bg-black border-brand-border text-brand-blue cursor-pointer" />
          <label for="isHalfDay" class="text-xs text-slate-400 cursor-pointer select-none">Apply as Half-Day Leave</label>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Reason for request</label>
          <textarea v-model="leaveForm.reason" rows="3" required placeholder="Write details..." class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white resize-none"></textarea>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Attach medical/verification document (Optional)</label>
          <input type="file" @change="handleAttachmentChange" class="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:bg-brand-blue/10 file:text-brand-blue hover:file:bg-brand-blue/20 cursor-pointer" />
        </div>

        <div class="pt-4 flex justify-end gap-3 border-t border-brand-border/40">
          <HrmButton type="button" variant="secondary" @click="showRequestModal = false">Cancel</HrmButton>
          <HrmButton type="submit" variant="primary">
            <Send class="w-4 h-4" />
            Submit Request
          </HrmButton>
        </div>
      </form>
    </HrmModal>

    <!-- Resolve Leave Application Modal -->
    <HrmModal :show="showResolveModal" title="Process Leave Application" @close="showResolveModal = false" maxWidth="max-w-md">
      <div v-if="selectedRequest" class="space-y-4">
        <!-- Request info summary -->
        <div class="p-3 bg-black/25 rounded-lg border border-brand-border/60 text-xs space-y-1.5">
          <div><span class="text-slate-500">Applicant:</span> <span class="text-white font-semibold">{{ selectedRequest.employeeId?.firstName }} {{ selectedRequest.employeeId?.lastName }}</span></div>
          <div><span class="text-slate-500">Leave Category:</span> {{ selectedRequest.leaveTypeId?.name }}</div>
          <div><span class="text-slate-500">Period:</span> {{ formatDate(selectedRequest.startDate) }} to {{ formatDate(selectedRequest.endDate) }} ({{ selectedRequest.totalDays }} days)</div>
          <div class="pt-1.5 border-t border-brand-border/30 text-slate-300 italic">"{{ selectedRequest.reason }}"</div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-2">Workflow Action</label>
          <div class="flex gap-4">
            <label class="flex-1 p-3 rounded-lg border border-brand-border cursor-pointer flex items-center gap-2 hover:bg-brand-border/10 select-none">
              <input type="radio" v-model="resolveStatus" value="approved" class="text-brand-blue" />
              <span class="text-xs font-bold text-emerald-400">Approve Request</span>
            </label>
            <label class="flex-1 p-3 rounded-lg border border-brand-border cursor-pointer flex items-center gap-2 hover:bg-brand-border/10 select-none">
              <input type="radio" v-model="resolveStatus" value="rejected" class="text-brand-blue" />
              <span class="text-xs font-bold text-rose-400">Reject Request</span>
            </label>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Approver Comments</label>
          <textarea v-model="resolveComment" rows="3" placeholder="Add details or context for the decision..." class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white resize-none"></textarea>
        </div>
      </div>

      <template #footer>
        <HrmButton variant="secondary" @click="showResolveModal = false">Cancel</HrmButton>
        <HrmButton variant="primary" @click="submitResolveRequest">Save decision</HrmButton>
      </template>
    </HrmModal>
  </div>
</template>
