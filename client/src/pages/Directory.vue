<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useEmployeeStore } from '../stores/employee';
import { useSettingsStore } from '../stores/settings';
import { Search, Mail, Phone, Building, Briefcase } from 'lucide-vue-next';
import HrmModal from '../components/ui/HrmModal.vue';

const employeeStore = useEmployeeStore();
const settingsStore = useSettingsStore();

const searchQuery = ref('');
const filterDept = ref('');
const selectedColleague = ref(null);
const showDetailModal = ref(false);

const colleagues = computed(() => employeeStore.employees);
const departments = computed(() => settingsStore.departments);
const isLoading = computed(() => employeeStore.isLoading);

const loadDirectory = () => {
  employeeStore.fetchEmployeeDirectory({
    search: searchQuery.value,
    department: filterDept.value,
  });
};

watch([searchQuery, filterDept], () => {
  loadDirectory();
});

const openDetails = (colleague) => {
  selectedColleague.value = colleague;
  showDetailModal.value = true;
};

onMounted(() => {
  loadDirectory();
  settingsStore.fetchDepartments();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-white">Colleague Directory</h1>
      <p class="text-slate-400 text-xs mt-1">Connect with coworkers across different departments and divisions.</p>
    </div>

    <!-- Toolbar Filters -->
    <div class="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-brand-card/30 border border-brand-border/60 rounded-xl glass-panel">
      <!-- Search Input -->
      <div class="relative w-full md:max-w-md">
        <input 
          type="text" 
          v-model="searchQuery"
          placeholder="Search coworkers by name, designation..."
          class="w-full bg-[#0E1322] border border-brand-border text-white text-sm pl-10 pr-4 py-2.5 rounded-lg outline-none focus:border-brand-blue/80 transition duration-150"
        />
        <Search class="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
      </div>

      <!-- Select Department -->
      <select 
        v-model="filterDept"
        class="w-full md:w-56 bg-[#0E1322] border border-brand-border text-white text-xs px-3 py-2.5 rounded-lg outline-none cursor-pointer"
      >
        <option value="">All Departments</option>
        <option v-for="dept in departments" :key="dept._id" :value="dept._id">{{ dept.name }}</option>
      </select>
    </div>

    <!-- Directory Grid -->
    <div v-if="isLoading" class="py-16 text-center text-slate-500">
      <div class="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
      Loading directory...
    </div>

    <div v-else-if="colleagues.length === 0" class="py-16 text-center text-slate-500">
      No colleagues found matching the search criteria.
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div 
        v-for="colleague in colleagues" 
        :key="colleague._id"
        @click="openDetails(colleague)"
        class="group p-5 rounded-xl border border-brand-border/60 bg-brand-card/25 hover:bg-brand-card/50 hover:border-brand-blue/40 hover:-translate-y-1 transition-all duration-300 glass-panel cursor-pointer flex flex-col justify-between text-center relative overflow-hidden"
      >
        <!-- Background decorative design -->
        <div class="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-brand-blue/5 group-hover:bg-brand-blue/10 transition-colors duration-300"></div>

        <div class="space-y-4">
          <!-- Avatar -->
          <div class="w-16 h-16 rounded-full bg-slate-700 mx-auto overflow-hidden border border-brand-border/80 group-hover:border-brand-blue/50 flex items-center justify-center font-bold text-xl text-white transition-all duration-300 shadow-md">
            <img v-if="colleague.avatar" :src="colleague.avatar" class="w-full h-full object-cover" />
            <span v-else>{{ colleague.firstName.slice(0, 1) + colleague.lastName.slice(0, 1) }}</span>
          </div>

          <!-- Name & designation -->
          <div>
            <h4 class="text-sm font-bold text-white group-hover:text-brand-blue transition duration-150">
              {{ colleague.firstName }} {{ colleague.lastName }}
            </h4>
            <p class="text-[10px] text-brand-purple font-mono uppercase tracking-wider mt-1">{{ colleague.designation }}</p>
          </div>
        </div>

        <!-- Info details -->
        <div class="border-t border-brand-border/30 mt-4 pt-4 text-left space-y-2">
          <div class="flex items-center gap-2.5 text-[11px] text-slate-400">
            <Building class="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span class="truncate">{{ colleague.department?.name || 'No department assigned' }}</span>
          </div>
          <div class="flex items-center gap-2.5 text-[11px] text-slate-400">
            <Mail class="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span class="truncate">{{ colleague.userId?.email || 'N/A' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Colleague Detail Modal -->
    <HrmModal :show="showDetailModal" :title="`${selectedColleague?.firstName}'s Public Card`" @close="showDetailModal = false" maxWidth="max-w-md">
      <div v-if="selectedColleague" class="space-y-6 text-center">
        <!-- Big Avatar -->
        <div class="w-20 h-20 rounded-full bg-slate-700 mx-auto overflow-hidden border-2 border-brand-blue/40 flex items-center justify-center font-bold text-2xl text-white shadow-lg">
          <img v-if="selectedColleague.avatar" :src="selectedColleague.avatar" class="w-full h-full object-cover" />
          <span v-else>{{ selectedColleague.firstName.slice(0,1) + selectedColleague.lastName.slice(0,1) }}</span>
        </div>

        <div>
          <h3 class="text-lg font-bold text-white">{{ selectedColleague.firstName }} {{ selectedColleague.lastName }}</h3>
          <p class="text-xs text-brand-purple font-mono tracking-wider uppercase mt-1">{{ selectedColleague.designation }}</p>
        </div>

        <!-- Public info grid -->
        <div class="border-t border-brand-border/40 pt-6 text-left space-y-4 max-w-xs mx-auto">
          <div class="flex items-center gap-3 text-slate-300">
            <Briefcase class="w-4 h-4 text-brand-blue shrink-0" />
            <div>
              <p class="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Employee Code</p>
              <p class="text-xs font-semibold font-mono text-white mt-0.5">{{ selectedColleague.employeeCode }}</p>
            </div>
          </div>

          <div class="flex items-center gap-3 text-slate-300">
            <Building class="w-4 h-4 text-brand-blue shrink-0" />
            <div>
              <p class="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Department</p>
              <p class="text-xs font-semibold text-white mt-0.5">{{ selectedColleague.department?.name || 'N/A' }}</p>
            </div>
          </div>

          <div class="flex items-center gap-3 text-slate-300">
            <Mail class="w-4 h-4 text-brand-blue shrink-0" />
            <div>
              <p class="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Work Email</p>
              <a :href="`mailto:${selectedColleague.userId?.email}`" class="text-xs text-brand-blue hover:underline mt-0.5 block break-all font-mono">{{ selectedColleague.userId?.email || 'N/A' }}</a>
            </div>
          </div>

          <div class="flex items-center gap-3 text-slate-300">
            <Phone class="w-4 h-4 text-brand-blue shrink-0" />
            <div>
              <p class="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Mobile / Work Phone</p>
              <a :href="`tel:${selectedColleague.phone}`" class="text-xs text-slate-200 hover:underline mt-0.5 block font-mono">{{ selectedColleague.phone || 'No phone number logged' }}</a>
            </div>
          </div>
        </div>
      </div>
    </HrmModal>
  </div>
</template>
