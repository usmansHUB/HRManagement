<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useEmployeeStore } from '../stores/employee';
import { useSettingsStore } from '../stores/settings';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import HrmButton from '../components/ui/HrmButton.vue';
import HrmModal from '../components/ui/HrmModal.vue';
import HrmTable from '../components/ui/HrmTable.vue';
import HrmBadge from '../components/ui/HrmBadge.vue';
import { Search, SlidersHorizontal, UploadCloud, Download, Plus, ArrowRight, ArrowLeft } from 'lucide-vue-next';

const employeeStore = useEmployeeStore();
const settingsStore = useSettingsStore();
const authStore = useAuthStore();
const { addToast } = useToast();

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

// Filters & search state
const searchQuery = ref('');
const filterDept = ref('');
const filterStatus = ref('');
const currentPage = ref(1);

// Modal visibility state
const showCreateModal = ref(false);
const showImportModal = ref(false);

// Create Employee Multi-Step state
const step = ref(1); // 1: Personal, 2: Job, 3: Documents

// Form fields state
const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'Employee',
  phone: '',
  dob: '',
  gender: 'Male',
  address: '',
  department: '',
  designation: '',
  managerId: '',
  joiningDate: new Date().toISOString().split('T')[0],
  employmentType: 'Full-Time',
  salaryBand: 'Band B',
});

// File upload states
const avatarFile = ref(null);
const docFiles = ref([]);
const csvFile = ref(null);

const tableHeaders = ['Employee', 'Code', 'Designation', 'Department', 'Employment Type', 'Status', 'Actions'];

const employeesList = computed(() => employeeStore.employees);
const departments = computed(() => settingsStore.departments);
const managersList = computed(() => employeeStore.employees.filter(emp => ['Super Admin', 'HR Manager', 'Department Manager'].includes(emp.userId?.role)));
const pagination = computed(() => employeeStore.pagination);
const isLoading = computed(() => employeeStore.isLoading);

// Fetch trigger
const loadEmployees = () => {
  employeeStore.fetchEmployees({
    search: searchQuery.value,
    department: filterDept.value,
    status: filterStatus.value,
    page: currentPage.value,
    limit: 10,
  });
};

watch([searchQuery, filterDept, filterStatus, currentPage], () => {
  loadEmployees();
});

const handleAvatarChange = (e) => {
  avatarFile.value = e.target.files[0];
};

const handleDocsChange = (e) => {
  docFiles.value = Array.from(e.target.files);
};

const handleCsvChange = (e) => {
  csvFile.value = e.target.files[0];
};

const triggerExport = () => {
  // Direct file download download request to backend
  window.open('/api/employees/export/csv', '_blank');
  addToast('Employee list export started successfully.', 'success');
};

const handleBulkImport = async () => {
  if (!csvFile.value) return addToast('Please upload a CSV file', 'error');

  const result = await employeeStore.bulkImport(csvFile.value);
  if (result.success) {
    addToast('Employees imported successfully!', 'success');
    showImportModal.value = false;
    csvFile.value = null;
    loadEmployees();
  } else {
    addToast(result.message || 'Import failed.', 'error');
  }
};

const submitCreateForm = async () => {
  const formData = new FormData();
  
  // Append basic text fields
  Object.keys(form.value).forEach(key => {
    formData.append(key, form.value[key]);
  });

  // Append avatar file
  if (avatarFile.value) {
    formData.append('avatar', avatarFile.value);
  }

  // Append documents
  if (docFiles.value.length > 0) {
    docFiles.value.forEach(file => {
      formData.append('documents', file);
    });
  }

  const result = await employeeStore.createEmployee(formData);
  if (result.success) {
    addToast('Employee profile created successfully!', 'success');
    showCreateModal.value = false;
    resetForm();
    loadEmployees();
  } else {
    addToast(result.message || 'Failed to create employee.', 'error');
  }
};

const resetForm = () => {
  step.value = 1;
  form.value = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Employee',
    phone: '',
    dob: '',
    gender: 'Male',
    address: '',
    department: '',
    designation: '',
    managerId: '',
    joiningDate: new Date().toISOString().split('T')[0],
    employmentType: 'Full-Time',
    salaryBand: 'Band B',
  };
  avatarFile.value = null;
  docFiles.value = [];
};

const deleteEmp = async (id) => {
  if (!confirm('Are you sure you want to terminate/deactivate this employee?')) return;
  const result = await employeeStore.deleteEmployee(id);
  if (result.success) {
    addToast('Employee marked terminated.', 'success');
    loadEmployees();
  } else {
    addToast(result.message || 'Deactivation failed.', 'error');
  }
};

onMounted(async () => {
  loadEmployees();
  settingsStore.fetchDepartments();
  if (!authStore.companySettings) {
    await authStore.fetchCompanySettings();
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Top Header & Actions -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Employee Directory</h1>
        <p class="text-slate-400 text-xs mt-1">Manage active personnel, profiles, and documents.</p>
      </div>

      <!-- Quick Actions -->
      <div class="flex flex-wrap gap-2.5">
        <HrmButton variant="secondary" @click="showImportModal = true">
          <UploadCloud class="w-4 h-4" />
          Bulk CSV Import
        </HrmButton>
        <HrmButton variant="secondary" @click="triggerExport">
          <Download class="w-4 h-4" />
          Export to CSV
        </HrmButton>
        <HrmButton variant="primary" @click="showCreateModal = true">
          <Plus class="w-4 h-4" />
          Add Employee
        </HrmButton>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-brand-card/30 border border-brand-border/60 rounded-xl glass-panel">
      <!-- Search Input -->
      <div class="relative w-full md:max-w-md">
        <input 
          type="text" 
          v-model="searchQuery"
          placeholder="Search by name, employee code or job title..."
          class="w-full bg-[#0E1322] border border-brand-border text-white text-sm pl-10 pr-4 py-2.5 rounded-lg outline-none focus:border-brand-blue/80 transition duration-150"
        />
        <Search class="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
      </div>

      <!-- Select Dropdowns -->
      <div class="flex flex-wrap gap-3 w-full md:w-auto">
        <select 
          v-model="filterDept"
          class="flex-1 md:flex-initial bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2.5 rounded-lg outline-none cursor-pointer"
        >
          <option value="">All Departments</option>
          <option v-for="dept in departments" :key="dept._id" :value="dept._id">{{ dept.name }}</option>
        </select>

        <select 
          v-model="filterStatus"
          class="flex-1 md:flex-initial bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2.5 rounded-lg outline-none cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <HrmTable :headers="tableHeaders" :items="employeesList" :isLoading="isLoading">
      <!-- Row templates for desktop table -->
      <template #row="{ item }">
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center font-bold text-slate-300">
              <img v-if="item.avatar" :src="item.avatar" class="w-full h-full object-cover" />
              <span v-else>{{ item.firstName.slice(0, 1) + item.lastName.slice(0, 1) }}</span>
            </div>
            <div>
              <router-link :to="`/employees/${item._id}`" class="font-semibold text-white hover:text-brand-blue hover:underline">
                {{ item.firstName }} {{ item.lastName }}
              </router-link>
              <p class="text-[10px] text-slate-400 font-mono mt-0.5">{{ item.userId?.email }}</p>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 font-mono text-xs text-brand-purple">{{ item.employeeCode }}</td>
        <td class="px-6 py-4 text-xs font-medium">{{ item.designation }}</td>
        <td class="px-6 py-4 text-xs">{{ item.department ? item.department.name : 'N/A' }}</td>
        <td class="px-6 py-4 text-xs text-slate-400">{{ item.employmentType }}</td>
        <td class="px-6 py-4"><HrmBadge :status="item.status" /></td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <router-link :to="`/employees/${item._id}`">
              <button class="text-xs text-slate-400 hover:text-white px-2 py-1 bg-brand-border/40 hover:bg-brand-border rounded cursor-pointer">
                View
              </button>
            </router-link>
            <button 
              v-if="item.status !== 'terminated'" 
              @click="deleteEmp(item._id)" 
              class="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 rounded cursor-pointer"
            >
              Terminate
            </button>
          </div>
        </td>
      </template>

      <!-- Card templates for mobile list -->
      <template #mobile-card="{ item }">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center font-bold">
            <img v-if="item.avatar" :src="item.avatar" class="w-full h-full object-cover" />
            <span v-else>{{ item.firstName.slice(0, 1) + item.lastName.slice(0, 1) }}</span>
          </div>
          <div>
            <router-link :to="`/employees/${item._id}`" class="font-bold text-white block">
              {{ item.firstName }} {{ item.lastName }}
            </router-link>
            <span class="text-[10px] text-slate-400 font-mono">{{ item.employeeCode }}</span>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-brand-border/40">
          <div><span class="text-slate-500">Designation:</span> {{ item.designation }}</div>
          <div><span class="text-slate-500">Dept:</span> {{ item.department ? item.department.name : 'N/A' }}</div>
          <div><span class="text-slate-500">Employment:</span> {{ item.employmentType }}</div>
          <div><HrmBadge :status="item.status" /></div>
        </div>
      </template>
    </HrmTable>

    <!-- Pagination Controls -->
    <div class="flex justify-between items-center px-2">
      <span class="text-xs text-slate-500 font-mono">Page {{ pagination.page }} of {{ pagination.pages }} ({{ pagination.total }} total)</span>
      <div class="flex items-center gap-2">
        <HrmButton 
          variant="secondary" 
          :disabled="currentPage === 1" 
          @click="currentPage--"
          class="px-3.5 py-1.5"
        >
          <ArrowLeft class="w-4 h-4" />
        </HrmButton>
        <HrmButton 
          variant="secondary" 
          :disabled="currentPage === pagination.pages" 
          @click="currentPage++"
          class="px-3.5 py-1.5"
        >
          <ArrowRight class="w-4 h-4" />
        </HrmButton>
      </div>
    </div>

    <!-- Stepper Onboarding Modal -->
    <HrmModal :show="showCreateModal" title="Onboard New Employee" @close="showCreateModal = false" maxWidth="max-w-xl">
      <!-- Step indicators -->
      <div class="flex items-center justify-between border-b border-brand-border/40 pb-4 mb-6">
        <div 
          v-for="s in [1, 2, 3]" 
          :key="s" 
          class="flex items-center gap-2"
        >
          <span 
            :class="[
              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono',
              step === s ? 'bg-brand-blue text-white' : (step > s ? 'bg-emerald-500/20 text-emerald-400' : 'bg-brand-border/60 text-slate-500')
            ]"
          >
            {{ s }}
          </span>
          <span class="text-xs font-medium" :class="[step === s ? 'text-white' : 'text-slate-500']">
            {{ s === 1 ? 'Personal' : (s === 2 ? 'Job Assignment' : 'Documents') }}
          </span>
          <span v-if="s < 3" class="text-slate-600">→</span>
        </div>
      </div>

      <!-- Step 1: Personal Data -->
      <div v-if="step === 1" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">First Name</label>
            <input type="text" v-model="form.firstName" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Last Name</label>
            <input type="text" v-model="form.lastName" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
          <input type="email" v-model="form.email" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white" />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
          <input type="password" v-model="form.password" placeholder="Default: Welcome@123" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Phone Number</label>
            <input type="text" v-model="form.phone" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Date of Birth</label>
            <input type="date" v-model="form.dob" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white cursor-pointer" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Gender</label>
            <select v-model="form.gender" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white cursor-pointer">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Mailing Address</label>
            <input type="text" v-model="form.address" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white" />
          </div>
        </div>
      </div>

      <!-- Step 2: Job Settings -->
      <div v-else-if="step === 2" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Job Designation</label>
            <input type="text" v-model="form.designation" placeholder="e.g. Frontend Developer" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Department</label>
            <select v-model="form.department" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white cursor-pointer">
              <option value="">Select Department</option>
              <option v-for="d in departments" :key="d._id" :value="d._id">{{ d.name }}</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Reporting Manager</label>
            <select v-model="form.managerId" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white cursor-pointer">
              <option value="">None (Top Level)</option>
              <option v-for="m in managersList" :key="m._id" :value="m._id">{{ m.firstName }} {{ m.lastName }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Joining Date</label>
            <input type="date" v-model="form.joiningDate" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white cursor-pointer" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Employment Type</label>
            <select v-model="form.employmentType" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white cursor-pointer">
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Salary Band</label>
            <select v-model="form.salaryBand" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white cursor-pointer">
              <option value="Band A">Band A ({{ currencySymbol }}150,000)</option>
              <option value="Band B">Band B ({{ currencySymbol }}100,000)</option>
              <option value="Band C">Band C ({{ currencySymbol }}70,000)</option>
              <option value="Band D">Band D ({{ currencySymbol }}40,000)</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Portal System Role</label>
          <select v-model="form.role" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white cursor-pointer">
            <option value="Employee">Employee (Self-Service only)</option>
            <option value="Department Manager">Department Manager (Team view & approvals)</option>
            <option value="HR Manager">HR Manager (Personnel & HR modules)</option>
            <option value="Super Admin">Super Admin (System Settings)</option>
          </select>
        </div>
      </div>

      <!-- Step 3: Documents and Attachments -->
      <div v-else class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Avatar Image</label>
          <input type="file" @change="handleAvatarChange" accept="image/*" class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-blue/10 file:text-brand-blue hover:file:bg-brand-blue/20 cursor-pointer" />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Employee Verification Documents (CV, ID, etc.)</label>
          <input type="file" @change="handleDocsChange" multiple class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-purple/10 file:text-brand-purple hover:file:bg-brand-purple/20 cursor-pointer" />
          <p class="text-[10px] text-slate-500 mt-1">Upload multiple documents (Max 5 files)</p>
        </div>
      </div>

      <!-- Stepper Footer -->
      <template #footer>
        <HrmButton v-if="step > 1" variant="secondary" @click="step--">Back</HrmButton>
        <HrmButton v-if="step < 3" variant="primary" @click="step++">Next</HrmButton>
        <HrmButton v-else variant="purple" @click="submitCreateForm">Complete Onboarding</HrmButton>
      </template>
    </HrmModal>

    <!-- CSV Bulk Import Modal -->
    <HrmModal :show="showImportModal" title="Bulk Import Employees via CSV" @close="showImportModal = false" maxWidth="max-w-md">
      <div class="space-y-4">
        <div class="p-3 bg-brand-border/40 rounded-lg text-xs leading-relaxed text-slate-300 border border-brand-border">
          <p class="font-bold mb-1">CSV Template Columns:</p>
          <code class="font-mono text-brand-purple text-[10px]">firstName, lastName, email, designation, salaryBand, employmentType</code>
          <p class="mt-2 text-slate-400">Passwords default to <code class="font-mono text-white">Welcome@123</code>. Accounts will be active.</p>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-2">Upload CSV File</label>
          <input type="file" @change="handleCsvChange" accept=".csv" class="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:bg-brand-blue/10 file:text-brand-blue hover:file:bg-brand-blue/20 cursor-pointer" />
        </div>
      </div>

      <template #footer>
        <HrmButton variant="secondary" @click="showImportModal = false">Cancel</HrmButton>
        <HrmButton variant="primary" @click="handleBulkImport">Upload & Import</HrmButton>
      </template>
    </HrmModal>
  </div>
</template>
