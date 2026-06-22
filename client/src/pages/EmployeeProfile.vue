<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEmployeeStore } from '../stores/employee';
import { useSettingsStore } from '../stores/settings';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import { formatDate, formatLocalDate } from '../utils/date';
import HrmButton from '../components/ui/HrmButton.vue';
import HrmBadge from '../components/ui/HrmBadge.vue';
import { 
  ArrowLeft, User, Phone, Mail, MapPin, Briefcase, Calendar, 
  FileText, DollarSign, Award, Shield, Save, Plus, Trash2, Globe
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const employeeStore = useEmployeeStore();
const settingsStore = useSettingsStore();
const authStore = useAuthStore();
const { addToast } = useToast();

const employee = computed(() => employeeStore.currentEmployee);
const departments = computed(() => settingsStore.departments);
const isLoading = computed(() => employeeStore.isLoading);
const managersList = computed(() => employeeStore.employees.filter(emp => ['Super Admin', 'HR Manager', 'Department Manager'].includes(emp.userId?.role)));

const currentUserRole = computed(() => authStore.userRole);
const isHrOrAdmin = computed(() => ['Super Admin', 'HR Manager'].includes(currentUserRole.value));
const isSelf = computed(() => authStore.user?.employeeId === route.params.id);

// Active Tab
const activeTab = ref('personal'); // 'personal' | 'job' | 'salary' | 'qualifications' | 'immigration' | 'family' | 'documents'

// Local form edit states
const editMode = ref(false);
const form = ref({
  firstName: '',
  lastName: '',
  phone: '',
  dob: '',
  gender: 'Male',
  address: '',
  designation: '',
  department: '',
  managerId: '',
  joiningDate: '',
  employmentType: 'Full-Time',
  salaryBand: 'Band B',
  status: 'active',
  email: '',
  qualifications: {
    skills: [],
    education: [],
    languages: []
  },
  salaryDetails: {
    basicSalary: 0,
    payGrade: '',
    bankName: '',
    accountNumber: '',
    taxPercentage: 0
  },
  immigration: {
    passportNumber: '',
    passportExpiry: '',
    visaNumber: '',
    visaExpiry: ''
  }
});

// Qualifications temp add values
const newSkill = ref({ name: '', yearsOfExperience: 1, comments: '' });
const newEdu = ref({ level: 'Bachelors', institute: '', major: '', year: new Date().getFullYear(), gpa: '' });
const newLang = ref({ name: '', fluency: 'Intermediate' });

const initializeForm = () => {
  if (!employee.value) return;
  const emp = employee.value;
  form.value = {
    firstName: emp.firstName || '',
    lastName: emp.lastName || '',
    phone: emp.phone || '',
    dob: emp.dob ? emp.dob.split('T')[0] : '',
    gender: emp.gender || 'Male',
    address: emp.address || '',
    designation: emp.designation || '',
    department: emp.department?._id || emp.department || '',
    managerId: emp.managerId?._id || emp.managerId || '',
    joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : '',
    employmentType: emp.employmentType || 'Full-Time',
    salaryBand: emp.salaryBand || 'Band B',
    status: emp.status || 'active',
    email: emp.userId?.email || '',
    qualifications: {
      skills: emp.qualifications?.skills ? [...emp.qualifications.skills] : [],
      education: emp.qualifications?.education ? [...emp.qualifications.education] : [],
      languages: emp.qualifications?.languages ? [...emp.qualifications.languages] : []
    },
    salaryDetails: {
      basicSalary: emp.salaryDetails?.basicSalary || 0,
      payGrade: emp.salaryDetails?.payGrade || '',
      bankName: emp.salaryDetails?.bankName || '',
      accountNumber: emp.salaryDetails?.accountNumber || '',
      taxPercentage: emp.salaryDetails?.taxPercentage || 0
    },
    immigration: {
      passportNumber: emp.immigration?.passportNumber || '',
      passportExpiry: emp.immigration?.passportExpiry ? emp.immigration.passportExpiry.split('T')[0] : '',
      visaNumber: emp.immigration?.visaNumber || '',
      visaExpiry: emp.immigration?.visaExpiry ? emp.immigration.visaExpiry.split('T')[0] : ''
    }
  };
};

const handleSaveProfile = async () => {
  try {
    const payload = { ...form.value };
    const result = await employeeStore.updateEmployee(route.params.id, payload);
    if (result.success) {
      addToast('Profile changes saved successfully!', 'success');
      editMode.value = false;
      await employeeStore.fetchEmployeeById(route.params.id);
      initializeForm();
    } else {
      addToast(result.message, 'error');
    }
  } catch (err) {
    addToast('Failed to save employee changes.', 'error');
  }
};

// Skill helper
const addSkill = () => {
  if (!newSkill.value.name.trim()) return;
  form.value.qualifications.skills.push({ ...newSkill.value });
  newSkill.value = { name: '', yearsOfExperience: 1, comments: '' };
};
const removeSkill = (idx) => {
  form.value.qualifications.skills.splice(idx, 1);
};

// Education helper
const addEdu = () => {
  if (!newEdu.value.institute.trim() || !newEdu.value.major.trim()) return;
  form.value.qualifications.education.push({ ...newEdu.value });
  newEdu.value = { level: 'Bachelors', institute: '', major: '', year: new Date().getFullYear(), gpa: '' };
};
const removeEdu = (idx) => {
  form.value.qualifications.education.splice(idx, 1);
};

// Language helper
const addLang = () => {
  if (!newLang.value.name.trim()) return;
  form.value.qualifications.languages.push({ ...newLang.value });
  newLang.value = { name: '', fluency: 'Intermediate' };
};
const removeLang = (idx) => {
  form.value.qualifications.languages.splice(idx, 1);
};

onMounted(async () => {
  await employeeStore.fetchEmployeeById(route.params.id);
  await employeeStore.fetchEmployees({ limit: 100 });
  await settingsStore.fetchDepartments();
  initializeForm();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Back Navigation -->
    <button 
      @click="router.back()" 
      class="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs font-semibold select-none cursor-pointer"
    >
      <ArrowLeft class="w-4.5 h-4.5" />
      Back to Colleagues
    </button>

    <div v-if="isLoading" class="py-16 text-center text-slate-500">
      <div class="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
      Loading employee profile...
    </div>

    <div v-else-if="!employee" class="py-16 text-center text-slate-500">
      Employee not found or has been deleted.
    </div>

    <!-- Main Content Frame -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      
      <!-- Side Profile Summary Card -->
      <div class="lg:col-span-1 space-y-6">
        <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel text-center relative overflow-hidden">
          <!-- Avatar Frame -->
          <div class="w-24 h-24 rounded-full bg-slate-700 mx-auto overflow-hidden border-2 border-brand-blue/50 flex items-center justify-center font-bold text-3xl text-white shadow-lg">
            <img v-if="employee.avatar" :src="employee.avatar" class="w-full h-full object-cover" />
            <span v-else>{{ employee.firstName.slice(0,1) + employee.lastName.slice(0,1) }}</span>
          </div>

          <h2 class="text-xl font-bold text-white mt-4">{{ employee.firstName }} {{ employee.lastName }}</h2>
          <p class="text-xs text-brand-purple font-mono mt-1">{{ employee.designation }}</p>
          <div class="mt-4"><HrmBadge :status="employee.status" /></div>

          <div class="border-t border-brand-border/40 mt-6 pt-6 text-left space-y-3.5">
            <div class="flex items-center gap-2.5 text-xs text-slate-300">
              <Mail class="w-4 h-4 text-brand-blue shrink-0" />
              <span class="break-all">{{ employee.userId?.email }}</span>
            </div>
            <div class="flex items-center gap-2.5 text-xs text-slate-300">
              <Phone class="w-4 h-4 text-brand-blue shrink-0" />
              <span>{{ employee.phone || 'No phone logged' }}</span>
            </div>
            <div class="flex items-center gap-2.5 text-xs text-slate-300">
              <Briefcase class="w-4 h-4 text-brand-blue shrink-0" />
              <span>{{ employee.department?.name || 'Unassigned' }}</span>
            </div>
          </div>
        </div>

        <!-- Left Menu List (Tabs) -->
        <div class="bg-brand-card/25 border border-brand-border/50 rounded-xl p-2 flex flex-col space-y-1 glass-panel">
          <button 
            @click="activeTab = 'personal'"
            :class="['flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold transition cursor-pointer text-left', activeTab === 'personal' ? 'bg-brand-blue/15 text-brand-blue border border-brand-blue/20' : 'text-slate-400 hover:text-white hover:bg-brand-border/20']"
          >
            <User class="w-4 h-4" />
            Personal Details
          </button>
          <button 
            @click="activeTab = 'job'"
            :class="['flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold transition cursor-pointer text-left', activeTab === 'job' ? 'bg-brand-blue/15 text-brand-blue border border-brand-blue/20' : 'text-slate-400 hover:text-white hover:bg-brand-border/20']"
          >
            <Briefcase class="w-4 h-4" />
            Job Assignments
          </button>
          <button 
            v-if="isHrOrAdmin || isSelf"
            @click="activeTab = 'salary'"
            :class="['flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold transition cursor-pointer text-left', activeTab === 'salary' ? 'bg-brand-blue/15 text-brand-blue border border-brand-blue/20' : 'text-slate-400 hover:text-white hover:bg-brand-border/20']"
          >
            <DollarSign class="w-4 h-4" />
            Salary & Banking
          </button>
          <button 
            @click="activeTab = 'qualifications'"
            :class="['flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold transition cursor-pointer text-left', activeTab === 'qualifications' ? 'bg-brand-blue/15 text-brand-blue border border-brand-blue/20' : 'text-slate-400 hover:text-white hover:bg-brand-border/20']"
          >
            <Award class="w-4 h-4" />
            Qualifications & Skills
          </button>
          <button 
            v-if="isHrOrAdmin || isSelf"
            @click="activeTab = 'immigration'"
            :class="['flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold transition cursor-pointer text-left', activeTab === 'immigration' ? 'bg-brand-blue/15 text-brand-blue border border-brand-blue/20' : 'text-slate-400 hover:text-white hover:bg-brand-border/20']"
          >
            <Globe class="w-4 h-4" />
            Immigration Details
          </button>
          <button 
            @click="activeTab = 'documents'"
            :class="['flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold transition cursor-pointer text-left', activeTab === 'documents' ? 'bg-brand-blue/15 text-brand-blue border border-brand-blue/20' : 'text-slate-400 hover:text-white hover:bg-brand-border/20']"
          >
            <FileText class="w-4 h-4" />
            Onboarding Docs
          </button>
        </div>
      </div>

      <!-- Right Tab Content Panel -->
      <div class="lg:col-span-3 space-y-6">
        <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel">
          
          <!-- Tab header & edit button -->
          <div class="flex justify-between items-center border-b border-brand-border/40 pb-4 mb-6">
            <h3 class="text-md font-bold text-white uppercase tracking-wider font-mono">
              {{ activeTab === 'personal' ? 'Personal Profile Information' : '' }}
              {{ activeTab === 'job' ? 'Employment & Assignment Details' : '' }}
              {{ activeTab === 'salary' ? 'Confidential Remuneration Data' : '' }}
              {{ activeTab === 'qualifications' ? 'Professional Qualifications Ledger' : '' }}
              {{ activeTab === 'immigration' ? 'Passport & Visa Records' : '' }}
              {{ activeTab === 'documents' ? 'Verification Documents Archive' : '' }}
            </h3>

            <!-- Action buttons: Save/Cancel/Edit -->
            <div v-if="activeTab !== 'documents'">
              <div v-if="editMode" class="flex gap-2">
                <HrmButton variant="secondary" class="py-1 px-3 text-xs" @click="editMode = false; initializeForm()">Cancel</HrmButton>
                <HrmButton variant="primary" class="py-1 px-3 text-xs flex items-center gap-1.5" @click="handleSaveProfile">
                  <Save class="w-3.5 h-3.5" />
                  Save Changes
                </HrmButton>
              </div>
              <HrmButton 
                v-else-if="isHrOrAdmin || (isSelf && (activeTab === 'personal' || activeTab === 'qualifications'))"
                variant="purple" 
                class="py-1 px-4.5 text-xs" 
                @click="editMode = true"
              >
                Edit Form
              </HrmButton>
            </div>
          </div>

          <!-- ==================== Tab 1: Personal Details ==================== -->
          <div v-if="activeTab === 'personal'" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">First Name</label>
                <input v-if="editMode" type="text" v-model="form.firstName" class="w-full bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-brand-blue" />
                <p v-else class="text-sm font-semibold text-white">{{ employee.firstName }}</p>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Last Name</label>
                <input v-if="editMode" type="text" v-model="form.lastName" class="w-full bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-brand-blue" />
                <p v-else class="text-sm font-semibold text-white">{{ employee.lastName }}</p>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Phone Number</label>
                <input v-if="editMode" type="text" v-model="form.phone" class="w-full bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-brand-blue" />
                <p v-else class="text-sm font-semibold text-white font-mono">{{ employee.phone || '--' }}</p>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Date of Birth</label>
                <input v-if="editMode" type="date" v-model="form.dob" class="w-full bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2 rounded-lg outline-none cursor-pointer focus:border-brand-blue" />
                <p v-else class="text-sm font-semibold text-white font-mono">{{ employee.dob ? formatDate(employee.dob) : 'N/A' }}</p>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Gender Selection</label>
                <select v-if="editMode" v-model="form.gender" class="w-full bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2 rounded-lg outline-none cursor-pointer focus:border-brand-blue">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <p v-else class="text-sm font-semibold text-white">{{ employee.gender || 'Not specified' }}</p>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Mailing Address</label>
                <textarea v-if="editMode" v-model="form.address" rows="2" class="w-full bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2 rounded-lg outline-none resize-none focus:border-brand-blue"></textarea>
                <p v-else class="text-sm font-semibold text-slate-300">{{ employee.address || 'No address logged' }}</p>
              </div>
            </div>
          </div>

          <!-- ==================== Tab 2: Job Details ==================== -->
          <div v-if="activeTab === 'job'" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Employee Code</label>
                <p class="text-sm font-semibold text-white font-mono">{{ employee.employeeCode }}</p>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Job Designation</label>
                <input v-if="editMode && isHrOrAdmin" type="text" v-model="form.designation" class="w-full bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-brand-blue" />
                <p v-else class="text-sm font-semibold text-white">{{ employee.designation }}</p>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Department Division</label>
                <select v-if="editMode && isHrOrAdmin" v-model="form.department" class="w-full bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2 rounded-lg outline-none cursor-pointer focus:border-brand-blue">
                  <option value="">Unassigned</option>
                  <option v-for="d in departments" :key="d._id" :value="d._id">{{ d.name }}</option>
                </select>
                <p v-else class="text-sm font-semibold text-white">{{ employee.department?.name || 'Unassigned' }}</p>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Reporting Manager</label>
                <select v-if="editMode && isHrOrAdmin" v-model="form.managerId" class="w-full bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2 rounded-lg outline-none cursor-pointer focus:border-brand-blue">
                  <option value="">None (Top Level)</option>
                  <option v-for="m in managersList" :key="m._id" :value="m._id">{{ m.firstName }} {{ m.lastName }}</option>
                </select>
                <p v-else class="text-sm font-semibold text-white">
                  {{ employee.managerId ? `${employee.managerId.firstName} ${employee.managerId.lastName}` : 'Direct Report (Top)' }}
                </p>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Employment Type</label>
                <select v-if="editMode && isHrOrAdmin" v-model="form.employmentType" class="w-full bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2 rounded-lg outline-none cursor-pointer focus:border-brand-blue">
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Intern">Intern</option>
                </select>
                <p v-else class="text-sm font-semibold text-white">{{ employee.employmentType }}</p>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Salary Grade Band</label>
                <select v-if="editMode && isHrOrAdmin" v-model="form.salaryBand" class="w-full bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2 rounded-lg outline-none cursor-pointer focus:border-brand-blue">
                  <option value="Band A">Band A</option>
                  <option value="Band B">Band B</option>
                  <option value="Band C">Band C</option>
                  <option value="Band D">Band D</option>
                </select>
                <p v-else class="text-sm font-semibold text-slate-300 font-mono">{{ employee.salaryBand }}</p>
              </div>
            </div>
          </div>

          <!-- ==================== Tab 3: Salary Details ==================== -->
          <div v-if="activeTab === 'salary' && (isHrOrAdmin || isSelf)" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Basic Gross Wage (Rs.)</label>
                <input v-if="editMode && isHrOrAdmin" type="number" v-model="form.salaryDetails.basicSalary" class="w-full bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-brand-blue" />
                <p v-else class="text-sm font-semibold text-white font-mono">
                  {{ isHrOrAdmin ? `Rs. ${(employee.salaryDetails?.basicSalary || 0).toLocaleString()}` : '•••••• (Protected)' }}
                </p>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Pay Grade Classification</label>
                <input v-if="editMode && isHrOrAdmin" type="text" v-model="form.salaryDetails.payGrade" class="w-full bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-brand-blue" />
                <p v-else class="text-sm font-semibold text-slate-300">{{ employee.salaryDetails?.payGrade || '--' }}</p>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Bank Name</label>
                <input v-if="editMode && isHrOrAdmin" type="text" v-model="form.salaryDetails.bankName" class="w-full bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-brand-blue" />
                <p v-else class="text-sm font-semibold text-slate-300">{{ employee.salaryDetails?.bankName || '--' }}</p>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Account Number</label>
                <input v-if="editMode && isHrOrAdmin" type="text" v-model="form.salaryDetails.accountNumber" class="w-full bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-brand-blue" />
                <p v-else class="text-sm font-semibold text-slate-300 font-mono">
                  {{ isHrOrAdmin ? (employee.salaryDetails?.accountNumber || '--') : '•••••••••••••••• (Protected)' }}
                </p>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Tax Percentage Deduction (%)</label>
                <input v-if="editMode && isHrOrAdmin" type="number" step="0.1" v-model="form.salaryDetails.taxPercentage" class="w-full bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-brand-blue" />
                <p v-else class="text-sm font-semibold text-rose-400 font-mono">{{ employee.salaryDetails?.taxPercentage || 0 }}%</p>
              </div>
            </div>
          </div>

          <!-- ==================== Tab 4: Qualifications ==================== -->
          <div v-if="activeTab === 'qualifications'" class="space-y-8">
            <!-- 1. Skills -->
            <div class="space-y-4">
              <h4 class="text-xs font-bold text-brand-blue uppercase font-mono border-b border-brand-border/40 pb-2">Skills Profile</h4>
              
              <!-- Add Skill (Inline) -->
              <div v-if="editMode" class="grid grid-cols-1 md:grid-cols-4 gap-3 bg-black/20 p-3 rounded-lg border border-brand-border/30">
                <input type="text" v-model="newSkill.name" placeholder="Skill Name (e.g. Node.js)" class="md:col-span-2 bg-[#0E1322] border border-brand-border text-white text-xs px-2.5 py-1.5 rounded outline-none" />
                <input type="number" v-model="newSkill.yearsOfExperience" min="1" placeholder="Years" class="bg-[#0E1322] border border-brand-border text-white text-xs px-2.5 py-1.5 rounded outline-none" />
                <HrmButton variant="primary" class="py-1 px-3 text-xs" @click="addSkill">
                  <Plus class="w-3.5 h-3.5" />
                  Add
                </HrmButton>
              </div>

              <!-- Skills List -->
              <div v-if="form.qualifications.skills.length === 0" class="text-xs text-slate-500 italic">No skills catalogued.</div>
              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div v-for="(skill, idx) in form.qualifications.skills" :key="idx" class="flex justify-between items-center bg-black/25 p-3 rounded-lg border border-brand-border/40 text-xs">
                  <div>
                    <span class="font-bold text-white">{{ skill.name }}</span>
                    <span class="text-[10px] text-brand-purple font-mono bg-brand-purple/10 px-2 py-0.5 rounded-full ml-2">{{ skill.yearsOfExperience }} yrs experience</span>
                  </div>
                  <button v-if="editMode" @click="removeSkill(idx)" class="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/10 rounded cursor-pointer">
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <!-- 2. Education -->
            <div class="space-y-4">
              <h4 class="text-xs font-bold text-brand-blue uppercase font-mono border-b border-brand-border/40 pb-2">Academic Credentials</h4>
              
              <!-- Add Education (Inline) -->
              <div v-if="editMode" class="bg-black/20 p-3.5 rounded-lg border border-brand-border/30 space-y-3">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select v-model="newEdu.level" class="bg-[#0E1322] border border-brand-border text-white text-xs px-2.5 py-1.5 rounded outline-none cursor-pointer">
                    <option value="Bachelors">Bachelors Degree</option>
                    <option value="Masters">Masters Degree</option>
                    <option value="Doctorate">Doctorate / PhD</option>
                    <option value="Diploma">Diploma / Cert</option>
                    <option value="High School">High School</option>
                  </select>
                  <input type="text" v-model="newEdu.institute" placeholder="University / School" class="bg-[#0E1322] border border-brand-border text-white text-xs px-2.5 py-1.5 rounded outline-none" />
                  <input type="text" v-model="newEdu.major" placeholder="Major / Specialization" class="bg-[#0E1322] border border-brand-border text-white text-xs px-2.5 py-1.5 rounded outline-none" />
                </div>
                <div class="flex justify-between items-center gap-3">
                  <div class="flex gap-2">
                    <input type="number" v-model="newEdu.year" placeholder="Graduation Year" class="bg-[#0E1322] border border-brand-border text-white text-xs px-2.5 py-1.5 rounded outline-none w-32" />
                    <input type="text" v-model="newEdu.gpa" placeholder="GPA / Grade" class="bg-[#0E1322] border border-brand-border text-white text-xs px-2.5 py-1.5 rounded outline-none w-32" />
                  </div>
                  <HrmButton variant="primary" class="py-1 px-4 text-xs" @click="addEdu">
                    <Plus class="w-3.5 h-3.5" /> Add credentials
                  </HrmButton>
                </div>
              </div>

              <!-- Education List -->
              <div v-if="form.qualifications.education.length === 0" class="text-xs text-slate-500 italic">No academic credentials logged.</div>
              <div v-else class="space-y-3">
                <div v-for="(edu, idx) in form.qualifications.education" :key="idx" class="flex justify-between items-center bg-black/25 p-3 rounded-lg border border-brand-border/40 text-xs">
                  <div>
                    <span class="font-bold text-white">{{ edu.level }} in {{ edu.major }}</span>
                    <span class="text-[10px] text-slate-400 block mt-0.5">{{ edu.institute }} • Graduated {{ edu.year }} (GPA: {{ edu.gpa || 'N/A' }})</span>
                  </div>
                  <button v-if="editMode" @click="removeEdu(idx)" class="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/10 rounded cursor-pointer">
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <!-- 3. Languages -->
            <div class="space-y-4">
              <h4 class="text-xs font-bold text-brand-blue uppercase font-mono border-b border-brand-border/40 pb-2">Language Fluencies</h4>
              
              <!-- Add Language (Inline) -->
              <div v-if="editMode" class="grid grid-cols-1 md:grid-cols-3 gap-3 bg-black/20 p-3 rounded-lg border border-brand-border/30">
                <input type="text" v-model="newLang.name" placeholder="Language name (e.g. Urdu)" class="bg-[#0E1322] border border-brand-border text-white text-xs px-2.5 py-1.5 rounded outline-none" />
                <select v-model="newLang.fluency" class="bg-[#0E1322] border border-brand-border text-white text-xs px-2.5 py-1.5 rounded outline-none cursor-pointer">
                  <option value="Basic">Basic Fluency</option>
                  <option value="Intermediate">Professional / Intermediate</option>
                  <option value="Fluent">Native / Fluent Speaker</option>
                </select>
                <HrmButton variant="primary" class="py-1 px-3 text-xs" @click="addLang">
                  <Plus class="w-3.5 h-3.5" /> Add fluency
                </HrmButton>
              </div>

              <!-- Languages List -->
              <div v-if="form.qualifications.languages.length === 0" class="text-xs text-slate-500 italic">No languages catalogued.</div>
              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div v-for="(lang, idx) in form.qualifications.languages" :key="idx" class="flex justify-between items-center bg-black/25 p-3 rounded-lg border border-brand-border/40 text-xs">
                  <div>
                    <span class="font-bold text-white">{{ lang.name }}</span>
                    <span class="text-[10px] text-brand-purple font-mono bg-brand-purple/10 px-2 py-0.5 rounded-full ml-2">{{ lang.fluency }}</span>
                  </div>
                  <button v-if="editMode" @click="removeLang(idx)" class="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/10 rounded cursor-pointer">
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== Tab 5: Immigration ==================== -->
          <div v-if="activeTab === 'immigration' && (isHrOrAdmin || isSelf)" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Passport Number</label>
                <input v-if="editMode && isHrOrAdmin" type="text" v-model="form.immigration.passportNumber" class="w-full bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-brand-blue" />
                <p v-else class="text-sm font-semibold text-white font-mono">{{ employee.immigration?.passportNumber || 'N/A' }}</p>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Passport Expiry Date</label>
                <input v-if="editMode && isHrOrAdmin" type="date" v-model="form.immigration.passportExpiry" class="w-full bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2 rounded-lg outline-none cursor-pointer focus:border-brand-blue" />
                <p v-else class="text-sm font-semibold text-white font-mono">
                  {{ employee.immigration?.passportExpiry ? formatDate(employee.immigration.passportExpiry) : 'N/A' }}
                </p>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Work Visa Number</label>
                <input v-if="editMode && isHrOrAdmin" type="text" v-model="form.immigration.visaNumber" class="w-full bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-brand-blue" />
                <p v-else class="text-sm font-semibold text-white font-mono">{{ employee.immigration?.visaNumber || 'N/A' }}</p>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Visa Expiry Date</label>
                <input v-if="editMode && isHrOrAdmin" type="date" v-model="form.immigration.visaExpiry" class="w-full bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2 rounded-lg outline-none cursor-pointer focus:border-brand-blue" />
                <p v-else class="text-sm font-semibold text-white font-mono">
                  {{ employee.immigration?.visaExpiry ? formatDate(employee.immigration.visaExpiry) : 'N/A' }}
                </p>
              </div>
            </div>
          </div>

          <!-- ==================== Tab 6: Onboarding Documents ==================== -->
          <div v-if="activeTab === 'documents'" class="space-y-6">
            <div v-if="!employee.documents || employee.documents.length === 0" class="text-xs text-slate-500 py-4 text-center">
              No verification documents uploaded.
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a 
                v-for="doc in employee.documents" 
                :key="doc._id"
                :href="doc.url" 
                target="_blank"
                class="p-3.5 rounded-lg border border-brand-border/60 bg-black/20 hover:border-brand-purple/40 hover:bg-brand-border/20 flex items-center gap-3 transition duration-150 group"
              >
                <FileText class="w-6 h-6 text-brand-purple group-hover:scale-110 transition duration-150" />
                <div class="overflow-hidden">
                  <h5 class="text-xs font-semibold text-slate-200 truncate group-hover:text-white">{{ doc.name }}</h5>
                  <span class="text-[9px] text-slate-500 font-mono block mt-1">Uploaded: {{ formatLocalDate(doc.uploadedAt) }}</span>
                </div>
              </a>
            </div>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>
