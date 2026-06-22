<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEmployeeStore } from '../stores/employee';
import { formatDate, formatLocalDate } from '../utils/date';
import HrmButton from '../components/ui/HrmButton.vue';
import HrmBadge from '../components/ui/HrmBadge.vue';
import { ArrowLeft, User, Phone, Mail, MapPin, Briefcase, Calendar, FileText, CheckCircle } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const employeeStore = useEmployeeStore();

const employee = computed(() => employeeStore.currentEmployee);
const isLoading = computed(() => employeeStore.isLoading);

onMounted(() => {
  employeeStore.fetchEmployeeById(route.params.id);
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
      Back to Directory
    </button>

    <div v-if="isLoading" class="py-16 text-center text-slate-500">
      <div class="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
      Loading employee profile...
    </div>

    <div v-else-if="!employee" class="py-16 text-center text-slate-500">
      Employee not found or has been deleted.
    </div>

    <!-- Profile View -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Left side: Avatar Box & Contact details -->
      <div class="space-y-6">
        <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel text-center">
          <!-- Avatar Frame -->
          <div class="w-24 h-24 rounded-full bg-slate-700 mx-auto overflow-hidden border-2 border-brand-blue/50 flex items-center justify-center font-bold text-3xl text-white shadow-lg">
            <img v-if="employee.avatar" :src="employee.avatar" class="w-full h-full object-cover" />
            <span v-else>{{ employee.firstName.slice(0,1) + employee.lastName.slice(0,1) }}</span>
          </div>

          <h2 class="text-xl font-bold text-white mt-4">{{ employee.firstName }} {{ employee.lastName }}</h2>
          <p class="text-xs text-brand-purple font-mono mt-1">{{ employee.designation }}</p>
          <div class="mt-4"><HrmBadge :status="employee.status" /></div>

          <div class="border-t border-brand-border/40 mt-6 pt-6 text-left space-y-4">
            <!-- Contact Card items -->
            <div class="flex items-center gap-3 text-slate-300">
              <Phone class="w-4 h-4 text-brand-blue shrink-0" />
              <span class="text-xs">{{ employee.phone || 'No phone number' }}</span>
            </div>
            <div class="flex items-center gap-3 text-slate-300">
              <Mail class="w-4 h-4 text-brand-blue shrink-0" />
              <span class="text-xs break-all">{{ employee.userId?.email }}</span>
            </div>
            <div class="flex items-center gap-3 text-slate-300">
              <MapPin class="w-4 h-4 text-brand-blue shrink-0" />
              <span class="text-xs leading-normal">{{ employee.address || 'No address logged' }}</span>
            </div>
            <div class="flex items-center gap-3 text-slate-300 font-mono text-[10px]">
              <Calendar class="w-4 h-4 text-brand-blue shrink-0" />
              <span>DOB: {{ employee.dob ? formatDate(employee.dob) : 'N/A' }}</span>
            </div>
          </div>
        </div>

        <!-- Emergency Contacts & Dependents Details -->
        <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel space-y-6 text-left">
          <div>
            <h3 class="text-xs font-bold text-white border-b border-brand-border/40 pb-2.5 mb-4 uppercase tracking-wider flex items-center gap-2">
              <Phone class="w-4 h-4 text-brand-blue" />
              Emergency Contacts
            </h3>
            
            <div v-if="!employee.emergencyContacts || employee.emergencyContacts.length === 0" class="text-xs text-slate-500">
              No emergency contacts registered.
            </div>
            <div v-else class="space-y-3">
              <div v-for="(c, idx) in employee.emergencyContacts" :key="idx" class="bg-black/25 p-3 rounded-lg border border-brand-border/40 text-xs">
                <p class="font-bold text-white">{{ c.name }}</p>
                <p class="text-[10px] text-slate-400 mt-0.5">{{ c.relationship }} • {{ c.phone }}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-xs font-bold text-white border-b border-brand-border/40 pb-2.5 mb-4 uppercase tracking-wider flex items-center gap-2">
              <User class="w-4 h-4 text-brand-purple" />
              Dependents
            </h3>

            <div v-if="!employee.dependents || employee.dependents.length === 0" class="text-xs text-slate-500">
              No dependents registered.
            </div>
            <div v-else class="space-y-3">
              <div v-for="(d, idx) in employee.dependents" :key="idx" class="bg-black/25 p-3 rounded-lg border border-brand-border/40 text-xs">
                <p class="font-bold text-white">{{ d.name }}</p>
                <p class="text-[10px] text-slate-400 mt-0.5">{{ d.relationship }} • Born {{ d.dob ? new Date(d.dob).toLocaleDateString() : 'N/A' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right side: Work details & files -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Work & Employment details card -->
        <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel">
          <h3 class="text-md font-bold text-white border-b border-brand-border/40 pb-3 mb-6">Employment Details</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <span class="block text-[10px] text-slate-500 uppercase font-mono mb-1">Employee Code</span>
              <span class="text-sm font-semibold text-white font-mono">{{ employee.employeeCode }}</span>
            </div>
            <div>
              <span class="block text-[10px] text-slate-500 uppercase font-mono mb-1">Department</span>
              <span class="text-sm font-semibold text-white">{{ employee.department?.name || 'Unassigned' }}</span>
            </div>
            <div>
              <span class="block text-[10px] text-slate-500 uppercase font-mono mb-1">Reporting Manager</span>
              <span class="text-sm font-semibold text-white">
                {{ employee.managerId ? `${employee.managerId.firstName} ${employee.managerId.lastName}` : 'Direct Report (Top)' }}
              </span>
            </div>
            <div>
              <span class="block text-[10px] text-slate-500 uppercase font-mono mb-1">Joining Date</span>
              <span class="text-sm font-semibold text-slate-300 font-mono">
                {{ formatDate(employee.joiningDate) }}
              </span>
            </div>
            <div>
              <span class="block text-[10px] text-slate-500 uppercase font-mono mb-1">Employment Type</span>
              <span class="text-sm font-semibold text-slate-300">{{ employee.employmentType }}</span>
            </div>
            <div>
              <span class="block text-[10px] text-slate-500 uppercase font-mono mb-1">Salary Band</span>
              <span class="text-sm font-semibold text-slate-300 font-mono">{{ employee.salaryBand }}</span>
            </div>
          </div>
        </div>

        <!-- Verification Documents list -->
        <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel">
          <h3 class="text-md font-bold text-white border-b border-brand-border/40 pb-3 mb-6">Onboarding Verification Documents</h3>
          
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
</template>
