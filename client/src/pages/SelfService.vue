<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import api from '../services/api';
import HrmButton from '../components/ui/HrmButton.vue';
import HrmTable from '../components/ui/HrmTable.vue';
import HrmBadge from '../components/ui/HrmBadge.vue';
import { User, Phone, MapPin, Calendar, FileText, Lock, Save } from 'lucide-vue-next';

const authStore = useAuthStore();
const { addToast } = useToast();

const employeeId = computed(() => authStore.user?.employeeId);
const user = computed(() => authStore.user);

const isLoading = ref(false);

// Profile state fields
const profileForm = ref({
  firstName: '',
  lastName: '',
  phone: '',
  dob: '',
  gender: 'Male',
  address: '',
});

const balances = ref([]);
const leaves = ref([]);
const payslips = ref([]);

const loadPortalData = async () => {
  if (!employeeId.value) return;

  isLoading.value = true;
  try {
    // 1. Fetch own employee details
    const resEmp = await api.get(`/employees/${employeeId.value}`);
    if (resEmp.data.success) {
      const emp = resEmp.data.data;
      profileForm.value = {
        firstName: emp.firstName,
        lastName: emp.lastName,
        phone: emp.phone || '',
        dob: emp.dob ? emp.dob.split('T')[0] : '',
        gender: emp.gender || 'Male',
        address: emp.address || '',
      };
    }

    // 2. Fetch leave balances
    const resBal = await api.get(`/leave/balances?employeeId=${employeeId.value}`);
    balances.value = resBal.data.data || [];

    // 3. Fetch leave history
    const resLeaves = await api.get(`/leave/requests?employeeId=${employeeId.value}`);
    leaves.value = resLeaves.data.data || [];

    // 4. Fetch payslips history
    const resSlips = await api.get(`/payroll/history?employeeId=${employeeId.value}`);
    payslips.value = resSlips.data.data || [];

  } catch (err) {
    console.error('Failed to load portal data:', err);
    addToast('Error synchronizing self-service data.', 'error');
  } finally {
    isLoading.value = false;
  }
};

const handleUpdateProfile = async () => {
  try {
    const { data } = await api.put(`/employees/${employeeId.value}`, profileForm.value);
    if (data.success) {
      addToast('Profile details updated successfully!', 'success');
      // Update auth store display name
      authStore.user.name = `${profileForm.value.firstName} ${profileForm.value.lastName}`;
      localStorage.setItem('user', JSON.stringify(authStore.user));
    }
  } catch (error) {
    addToast(error.response?.data?.message || 'Failed to save updates.', 'error');
  }
};

const triggerPayslipDownload = async (id) => {
  addToast('Downloading payslip PDF...', 'info');
  try {
    const response = await api.get(`/payroll/payslip/${id}`, { responseType: 'blob' });
    const file = new Blob([response.data], { type: 'application/pdf' });
    const fileURL = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = fileURL;
    link.setAttribute('download', `payslip_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Downloaded payslip PDF successfully.', 'success');
  } catch (err) {
    addToast('Failed to download PDF.', 'error');
  }
};

onMounted(() => {
  loadPortalData();
});
</script>

<template>
  <div class="space-y-8">
    <!-- Top banner -->
    <div>
      <h1 class="text-2xl font-bold text-white">Employee Self-Service (My Portal)</h1>
      <p class="text-slate-400 text-xs mt-1">Review your personal files, accruals, leave balances, and download monthly payslips.</p>
    </div>

    <div v-if="isLoading" class="py-16 text-center text-slate-500">
      <div class="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
      Loading portal hub...
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left column: Editable Profile Info -->
      <div class="space-y-6">
        <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel">
          <h3 class="text-md font-bold text-white border-b border-brand-border/40 pb-3 mb-6 flex items-center gap-2">
            <User class="w-5 h-5 text-brand-blue" />
            Personal Details
          </h3>

          <form @submit.prevent="handleUpdateProfile" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">First Name</label>
                <input type="text" v-model="profileForm.firstName" class="w-full bg-[#0E1322] border border-brand-border rounded px-3 py-2 text-sm text-white focus:border-brand-blue outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Last Name</label>
                <input type="text" v-model="profileForm.lastName" class="w-full bg-[#0E1322] border border-brand-border rounded px-3 py-2 text-sm text-white focus:border-brand-blue outline-none" />
              </div>
            </div>

            <div>
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
              <input type="text" v-model="profileForm.phone" class="w-full bg-[#0E1322] border border-brand-border rounded px-3 py-2 text-sm text-white focus:border-brand-blue outline-none" />
            </div>

            <div>
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date of Birth</label>
              <input type="date" v-model="profileForm.dob" class="w-full bg-[#0E1322] border border-brand-border rounded px-3 py-2 text-sm text-white focus:border-brand-blue outline-none cursor-pointer" />
            </div>

            <div>
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Gender</label>
              <select v-model="profileForm.gender" class="w-full bg-[#0E1322] border border-brand-border rounded px-3 py-2 text-sm text-white focus:border-brand-blue outline-none cursor-pointer">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mailing Address</label>
              <textarea v-model="profileForm.address" rows="2" class="w-full bg-[#0E1322] border border-brand-border rounded px-3 py-2 text-sm text-white focus:border-brand-blue outline-none resize-none"></textarea>
            </div>

            <HrmButton type="submit" variant="primary" class="w-full py-2.5">
              <Save class="w-4 h-4" />
              Save Portal Updates
            </HrmButton>
          </form>
        </div>
      </div>

      <!-- Right column: Accruals and Slips -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Accrual Cards -->
        <div class="grid grid-cols-2 gap-4">
          <div 
            v-for="bal in balances" 
            :key="bal._id"
            class="p-4 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel"
          >
            <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">{{ bal.leaveTypeId?.name }}</span>
            <div class="text-2xl font-extrabold text-white mt-2">{{ bal.remaining }} / {{ bal.allocated }} days left</div>
          </div>
        </div>

        <!-- Payslips list -->
        <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel">
          <h3 class="text-md font-bold text-white border-b border-brand-border/40 pb-3 mb-6 flex items-center gap-2">
            <FileText class="w-5 h-5 text-brand-purple" />
            My Payslips Archive
          </h3>

          <HrmTable :headers="['Pay Period', 'Gross Basic Salary', 'Tax amount', 'Net Salary Distributed', 'Payslip PDF']" :items="payslips">
            <template #row="{ item }">
              <td class="px-6 py-3 text-xs font-mono">
                {{ ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][(item.month - 1)] }} {{ item.year }}
              </td>
              <td class="px-6 py-3 text-xs font-mono text-slate-300">${{ (item.basicSalary || 0).toLocaleString() }}</td>
              <td class="px-6 py-3 text-xs font-mono text-rose-400">${{ (item.taxAmount || 0).toLocaleString() }}</td>
              <td class="px-6 py-3 text-xs font-mono font-bold text-brand-blue">${{ Math.round(item.netPay || 0).toLocaleString() }}</td>
              <td class="px-6 py-3">
                <HrmButton variant="secondary" class="py-1 px-3 text-xs" @click="triggerPayslipDownload(item._id)">
                  Download PDF
                </HrmButton>
              </td>
            </template>
          </HrmTable>
        </div>

      </div>
    </div>
  </div>
</template>
