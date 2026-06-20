<script setup>
import { ref, onMounted, computed } from 'vue';
import { useSettingsStore } from '../stores/settings';
import { useEmployeeStore } from '../stores/employee';
import { useLeaveStore } from '../stores/leave';
import { useToast } from '../composables/useToast';
import HrmButton from '../components/ui/HrmButton.vue';
import HrmModal from '../components/ui/HrmModal.vue';
import HrmTable from '../components/ui/HrmTable.vue';
import { Settings, Save, Plus, HelpCircle, Edit3, Trash2 } from 'lucide-vue-next';

const settingsStore = useSettingsStore();
const employeeStore = useEmployeeStore();
const leaveStore = useLeaveStore();
const { addToast } = useToast();

const showDeptModal = ref(false);
const isEditingDept = ref(false);
const editingDeptId = ref(null);

const showLeaveTypeModal = ref(false);
const isEditingLeaveType = ref(false);
const editingLeaveTypeId = ref(null);

// Settings Form
const settingsForm = ref({ name: 'HRM Systems', timezone: 'UTC', currency: 'USD' });
const logoFile = ref(null);

// Department Form
const deptForm = ref({ name: '', headId: '', parentDept: '' });

// Leave Type Form
const leaveTypeForm = ref({ name: '', defaultDays: 15, carryForward: false, isPaid: true, requiresDoc: false });

const companySettings = computed(() => settingsStore.companySettings);
const departments = computed(() => settingsStore.departments);
const leaveTypes = computed(() => leaveStore.leaveTypes);
const employees = computed(() => employeeStore.employees);
const isLoading = computed(() => settingsStore.isLoading);

const loadSettingsData = async () => {
  await settingsStore.fetchCompanySettings();
  if (companySettings.value) {
    settingsForm.value = {
      name: companySettings.value.name,
      timezone: companySettings.value.timezone,
      currency: companySettings.value.currency,
    };
  }
  await settingsStore.fetchDepartments();
  await employeeStore.fetchEmployees({ limit: 100 });
  await leaveStore.fetchLeaveTypes();
};

const handleLogoChange = (e) => {
  logoFile.value = e.target.files[0];
};

const saveSettings = async () => {
  const formData = new FormData();
  formData.append('name', settingsForm.value.name);
  formData.append('timezone', settingsForm.value.timezone);
  formData.append('currency', settingsForm.value.currency);
  if (logoFile.value) {
    formData.append('logo', logoFile.value);
  }

  const result = await settingsStore.updateCompanySettings(formData);
  if (result.success) {
    addToast('Company settings saved successfully!', 'success');
  } else {
    addToast(result.message, 'error');
  }
};

const openAddDept = () => {
  isEditingDept.value = false;
  editingDeptId.value = null;
  deptForm.value = { name: '', headId: '', parentDept: '' };
  showDeptModal.value = true;
};

const openEditDept = (dept) => {
  isEditingDept.value = true;
  editingDeptId.value = dept._id;
  deptForm.value = {
    name: dept.name,
    headId: dept.headId?._id || '',
    parentDept: dept.parentDept?._id || '',
  };
  showDeptModal.value = true;
};

const submitDeptForm = async () => {
  let result;
  if (isEditingDept.value) {
    result = await settingsStore.updateDepartment(editingDeptId.value, deptForm.value);
  } else {
    result = await settingsStore.createDepartment(deptForm.value);
  }

  if (result.success) {
    addToast(`Department ${isEditingDept.value ? 'updated' : 'created'} successfully!`, 'success');
    showDeptModal.value = false;
    settingsStore.fetchDepartments();
  } else {
    addToast(result.message, 'error');
  }
};

const handleDeleteDept = async (id) => {
  if (!confirm('Are you sure you want to delete this department?')) return;
  const result = await settingsStore.deleteDepartment(id);
  if (result.success) {
    addToast('Department deleted successfully.', 'success');
    settingsStore.fetchDepartments();
  } else {
    addToast(result.message, 'error');
  }
};

const openAddLeaveType = () => {
  isEditingLeaveType.value = false;
  editingLeaveTypeId.value = null;
  leaveTypeForm.value = { name: '', defaultDays: 15, carryForward: false, isPaid: true, requiresDoc: false };
  showLeaveTypeModal.value = true;
};

const openEditLeaveType = (type) => {
  isEditingLeaveType.value = true;
  editingLeaveTypeId.value = type._id;
  leaveTypeForm.value = {
    name: type.name,
    defaultDays: type.defaultDays,
    carryForward: type.carryForward,
    isPaid: type.isPaid,
    requiresDoc: type.requiresDoc || false,
  };
  showLeaveTypeModal.value = true;
};

const submitLeaveTypeForm = async () => {
  let result;
  if (isEditingLeaveType.value) {
    result = await leaveStore.updateLeaveType(editingLeaveTypeId.value, leaveTypeForm.value);
  } else {
    result = await leaveStore.createLeaveType(leaveTypeForm.value);
  }

  if (result.success) {
    addToast(`Leave category ${isEditingLeaveType.value ? 'updated' : 'created'} successfully!`, 'success');
    showLeaveTypeModal.value = false;
    leaveStore.fetchLeaveTypes();
  } else {
    addToast(result.message, 'error');
  }
};

const handleDeleteLeaveType = async (id) => {
  if (!confirm('Are you sure you want to delete this leave category?')) return;
  const result = await leaveStore.deleteLeaveType(id);
  if (result.success) {
    addToast('Leave category deleted successfully.', 'success');
    leaveStore.fetchLeaveTypes();
  } else {
    addToast(result.message, 'error');
  }
};

onMounted(() => {
  loadSettingsData();
});
</script>

<template>
  <div class="space-y-8">
    <!-- Header banner -->
    <div>
      <h1 class="text-2xl font-bold text-white">System Settings</h1>
      <p class="text-slate-400 text-xs mt-1">Configure global variables, branding, and Department divisions.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Company Configuration Card (Left column) -->
      <div class="space-y-6">
        <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel">
          <h3 class="text-md font-bold text-white border-b border-brand-border/40 pb-3 mb-6 flex items-center gap-2">
            <Settings class="w-5 h-5 text-brand-blue" />
            Company Profile
          </h3>

          <form @submit.prevent="saveSettings" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5">Company Legal Name</label>
              <input type="text" v-model="settingsForm.name" required class="w-full bg-[#0E1322] border border-brand-border rounded px-3 py-2 text-sm text-white focus:border-brand-blue outline-none" />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5 font-mono">System Timezone</label>
              <select v-model="settingsForm.timezone" class="w-full bg-[#0E1322] border border-brand-border rounded px-3 py-2 text-sm text-white focus:border-brand-blue outline-none cursor-pointer">
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">EST (Eastern Standard Time)</option>
                <option value="Europe/London">GMT (Greenwich Mean Time)</option>
                <option value="Asia/Tokyo">JST (Japan Standard Time)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5 font-mono">Default Currency Code</label>
              <select v-model="settingsForm.currency" class="w-full bg-[#0E1322] border border-brand-border rounded px-3 py-2 text-sm text-white focus:border-brand-blue outline-none cursor-pointer">
                <option value="USD">USD (United States Dollar, $)</option>
                <option value="EUR">EUR (Euro, €)</option>
                <option value="GBP">GBP (British Pound, £)</option>
                <option value="JPY">JPY (Japanese Yen, ¥)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5">Branding Logo</label>
              <input type="file" @change="handleLogoChange" accept="image/*" class="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:bg-brand-blue/10 file:text-brand-blue hover:file:bg-brand-blue/20 cursor-pointer" />
              <div v-if="companySettings?.logo" class="mt-4 p-2 bg-black/25 border border-brand-border rounded inline-block">
                <img :src="companySettings.logo" class="h-10 object-contain rounded" />
              </div>
            </div>

            <HrmButton type="submit" variant="primary" class="w-full py-2.5">
              <Save class="w-4 h-4" />
              Save Configuration
            </HrmButton>
          </form>
        </div>
      </div>

      <!-- Department & Leave Category CRUD Workspaces (Right column) -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Departments Card -->
        <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-md font-bold text-white">Department Structures</h3>
            <HrmButton variant="primary" @click="openAddDept">
              <Plus class="w-4 h-4" />
              Create Department
            </HrmButton>
          </div>

          <HrmTable :headers="['Name', 'Department Head', 'Parent Department', 'Actions']" :items="departments" :isLoading="isLoading">
            <template #row="{ item }">
              <td class="px-6 py-3.5 text-xs font-bold text-slate-100">{{ item.name }}</td>
              <td class="px-6 py-3.5 text-xs text-slate-300">
                {{ item.headId ? `${item.headId.firstName} ${item.headId.lastName}` : '--' }}
                <span class="block text-[10px] text-slate-500 font-mono mt-0.5" v-if="item.headId">{{ item.headId.employeeCode }}</span>
              </td>
              <td class="px-6 py-3.5 text-xs text-slate-400">{{ item.parentDept ? item.parentDept.name : '--' }}</td>
              <td class="px-6 py-3.5">
                <div class="flex items-center gap-2">
                  <button @click="openEditDept(item)" class="text-xs text-slate-400 hover:text-white p-1 hover:bg-brand-border rounded cursor-pointer" title="Edit">
                    <Edit3 class="w-4 h-4" />
                  </button>
                  <button @click="handleDeleteDept(item._id)" class="text-xs text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/10 rounded cursor-pointer" title="Delete">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </template>
          </HrmTable>
        </div>

        <!-- Leave Categories Card -->
        <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-md font-bold text-white">Leave Categories</h3>
            <HrmButton variant="purple" @click="openAddLeaveType">
              <Plus class="w-4 h-4" />
              Create Category
            </HrmButton>
          </div>

          <HrmTable :headers="['Name', 'Default Allocation', 'Type', 'Carry Forward', 'Requires Doc', 'Actions']" :items="leaveTypes">
            <template #row="{ item }">
              <td class="px-6 py-3.5 text-xs font-bold text-slate-100">{{ item.name }}</td>
              <td class="px-6 py-3.5 text-xs text-slate-300 font-mono">{{ item.defaultDays }} days</td>
              <td class="px-6 py-3.5 text-xs text-slate-400 font-semibold font-mono">
                <HrmBadge :status="item.isPaid ? 'present' : 'absent'" :customLabel="item.isPaid ? 'Paid' : 'Unpaid'" />
              </td>
              <td class="px-6 py-3.5 text-xs text-slate-400 font-mono">{{ item.carryForward ? 'Yes' : 'No' }}</td>
              <td class="px-6 py-3.5 text-xs text-slate-400 font-mono">{{ item.requiresDoc ? 'Yes' : 'No' }}</td>
              <td class="px-6 py-3.5">
                <div class="flex items-center gap-2">
                  <button @click="openEditLeaveType(item)" class="text-xs text-slate-400 hover:text-white p-1 hover:bg-brand-border rounded cursor-pointer" title="Edit">
                    <Edit3 class="w-4 h-4" />
                  </button>
                  <button @click="handleDeleteLeaveType(item._id)" class="text-xs text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/10 rounded cursor-pointer" title="Delete">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </template>
          </HrmTable>
        </div>
      </div>

    </div>

    <!-- Create/Edit Department Modal -->
    <HrmModal :show="showDeptModal" :title="isEditingDept ? 'Modify Department' : 'Create Department'" @close="showDeptModal = false" maxWidth="max-w-sm">
      <form @submit.prevent="submitDeptForm" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Department Name</label>
          <input type="text" v-model="deptForm.name" required placeholder="e.g. Sales Operations" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white" />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5 font-mono">Department Head (Manager)</label>
          <select v-model="deptForm.headId" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white cursor-pointer">
            <option value="">None (Unassigned)</option>
            <option v-for="e in employees" :key="e._id" :value="e._id">{{ e.firstName }} {{ e.lastName }} ({{ e.employeeCode }})</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5 font-mono">Parent Hierarchy Division</label>
          <select v-model="deptForm.parentDept" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white cursor-pointer">
            <option value="">None (Top Level)</option>
            <option v-for="d in departments.filter(dep => dep._id !== editingDeptId)" :key="d._id" :value="d._id">{{ d.name }}</option>
          </select>
        </div>

        <div class="pt-4 flex justify-end gap-3 border-t border-brand-border/40">
          <HrmButton type="button" variant="secondary" @click="showDeptModal = false">Cancel</HrmButton>
          <HrmButton type="submit" variant="primary">Save Department</HrmButton>
        </div>
      </form>
    </HrmModal>

    <!-- Create/Edit Leave Category Modal -->
    <HrmModal :show="showLeaveTypeModal" :title="isEditingLeaveType ? 'Modify Leave Category' : 'Create Leave Category'" @close="showLeaveTypeModal = false" maxWidth="max-w-sm">
      <form @submit.prevent="submitLeaveTypeForm" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Category Name</label>
          <input type="text" v-model="leaveTypeForm.name" required placeholder="e.g. Parental Leave" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white" />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Default Days Allocated</label>
          <input type="number" v-model="leaveTypeForm.defaultDays" required class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white" />
        </div>

        <div class="space-y-2 pt-2">
          <div class="flex items-center gap-2">
            <input type="checkbox" id="isPaid" v-model="leaveTypeForm.isPaid" class="rounded bg-black border-brand-border text-brand-blue cursor-pointer" />
            <label for="isPaid" class="text-xs text-slate-400 cursor-pointer select-none">Is Paid Leave</label>
          </div>

          <div class="flex items-center gap-2">
            <input type="checkbox" id="carryForward" v-model="leaveTypeForm.carryForward" class="rounded bg-black border-brand-border text-brand-blue cursor-pointer" />
            <label for="carryForward" class="text-xs text-slate-400 cursor-pointer select-none">Carry Forward unused days</label>
          </div>

          <div class="flex items-center gap-2">
            <input type="checkbox" id="requiresDoc" v-model="leaveTypeForm.requiresDoc" class="rounded bg-black border-brand-border text-brand-blue cursor-pointer" />
            <label for="requiresDoc" class="text-xs text-slate-400 cursor-pointer select-none">Requires supporting document</label>
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-3 border-t border-brand-border/40">
          <HrmButton type="button" variant="secondary" @click="showLeaveTypeModal = false">Cancel</HrmButton>
          <HrmButton type="submit" variant="primary">Save Category</HrmButton>
        </div>
      </form>
    </HrmModal>
  </div>
</template>
