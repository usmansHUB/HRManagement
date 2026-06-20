<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useLndStore } from '../stores/lnd';
import { useEmployeeStore } from '../stores/employee';
import { useSettingsStore } from '../stores/settings';
import { useToast } from '../composables/useToast';
import { formatLocalDate } from '../utils/date';
import HrmButton from '../components/ui/HrmButton.vue';
import HrmModal from '../components/ui/HrmModal.vue';
import HrmTable from '../components/ui/HrmTable.vue';
import HrmBadge from '../components/ui/HrmBadge.vue';
import { BookOpen, Plus, Send, PlayCircle, FileText, ExternalLink, GraduationCap } from 'lucide-vue-next';

const authStore = useAuthStore();
const lndStore = useLndStore();
const employeeStore = useEmployeeStore();
const settingsStore = useSettingsStore();
const { addToast } = useToast();

const userRole = computed(() => authStore.userRole);
const employeeId = computed(() => authStore.user?.employeeId);

const activeTab = ref('courses'); // 'courses' | 'assignments'
const showCourseModal = ref(false);
const showAssignModal = ref(false);

// Course form state
const courseForm = ref({ title: '', description: '', type: 'video', url: '', duration: '' });

// Assignment form state
const assignForm = ref({ courseId: '', employeeId: '', departmentId: '' });

const courses = computed(() => lndStore.courses);
const assignments = computed(() => lndStore.assignments);
const employees = computed(() => employeeStore.employees);
const departments = computed(() => settingsStore.departments);
const isLoading = computed(() => lndStore.isLoading);

const loadLndData = () => {
  lndStore.fetchCourses();
  if (activeTab.value === 'assignments' || userRole.value === 'Employee') {
    lndStore.fetchAssignments();
  }
};

watch(activeTab, () => {
  loadLndData();
});

const submitCourseForm = async () => {
  const result = await lndStore.createCourse(courseForm.value);
  if (result.success) {
    addToast('Training course added successfully!', 'success');
    showCourseModal.value = false;
    courseForm.value = { title: '', description: '', type: 'video', url: '', duration: '' };
    lndStore.fetchCourses();
  } else {
    addToast(result.message, 'error');
  }
};

const submitAssignForm = async () => {
  const result = await lndStore.assignCourse(assignForm.value);
  if (result.success) {
    addToast(result.message || 'Course assigned successfully!', 'success');
    showAssignModal.value = false;
    assignForm.value = { courseId: '', employeeId: '', departmentId: '' };
    lndStore.fetchAssignments();
  } else {
    addToast(result.message, 'error');
  }
};

const handleUpdateProgress = async (assignId, newProgress) => {
  const result = await lndStore.updateProgress(assignId, newProgress);
  if (result.success) {
    addToast('Training course progress updated!', 'success');
  } else {
    addToast(result.message, 'error');
  }
};

onMounted(() => {
  loadLndData();
  employeeStore.fetchEmployees({ limit: 100 });
  settingsStore.fetchDepartments();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header banner -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">Learning & Development</h1>
        <p class="text-slate-400 text-xs mt-1">Assign courses, review certifications, and track employee training schedules.</p>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex border-b border-brand-border/60">
      <button 
        @click="activeTab = 'courses'"
        :class="['px-5 py-3 text-sm font-semibold border-b-2 transition duration-200 cursor-pointer', activeTab === 'courses' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-400 hover:text-white']"
      >
        Course Library Catalog
      </button>
      <button 
        @click="activeTab = 'assignments'"
        :class="['px-5 py-3 text-sm font-semibold border-b-2 transition duration-200 cursor-pointer', activeTab === 'assignments' ? 'border-brand-purple text-brand-purple' : 'border-transparent text-slate-400 hover:text-white']"
      >
        Course Assignments & Progress
      </button>
    </div>

    <!-- ==================== Tab 1: Course Library ==================== -->
    <div v-if="activeTab === 'courses'" class="space-y-6">
      <div class="flex justify-between items-center">
        <h3 class="text-md font-bold text-white">Training Catalog</h3>
        <HrmButton v-if="userRole !== 'Employee'" variant="primary" @click="showCourseModal = true">
          <Plus class="w-4 h-4" />
          Add Training Course
        </HrmButton>
      </div>

      <div v-if="courses.length === 0" class="text-xs text-slate-500 py-12 text-center">
        No training courses available in the library yet.
      </div>

      <!-- Course Cards list -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="c in courses" 
          :key="c._id"
          class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center justify-between mb-4">
              <span class="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase font-mono">
                <PlayCircle v-if="c.type === 'video'" class="w-3.5 h-3.5 text-brand-blue" />
                <FileText v-else class="w-3.5 h-3.5 text-brand-purple" />
                {{ c.type }}
              </span>
              <span class="text-xs text-slate-500 font-mono">{{ c.duration }}</span>
            </div>

            <h4 class="text-md font-bold text-white mb-2">{{ c.title }}</h4>
            <p class="text-slate-400 text-xs leading-relaxed mb-6">{{ c.description }}</p>
          </div>

          <div class="pt-4 border-t border-brand-border/40 flex justify-between items-center">
            <a :href="c.url" target="_blank" class="text-xs text-brand-blue hover:underline font-bold inline-flex items-center gap-1">
              Open Material
              <ExternalLink class="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== Tab 2: Assignments progress ==================== -->
    <div v-else class="space-y-6">
      <div class="flex justify-between items-center">
        <h3 class="text-md font-bold text-white">Active Training Assignments</h3>
        <HrmButton v-if="userRole !== 'Employee'" variant="primary" @click="showAssignModal = true">
          <GraduationCap class="w-4 h-4" />
          Assign Course
        </HrmButton>
      </div>

      <HrmTable :headers="['Colleague', 'Training Course', 'Status', 'Progress slider', 'Assigned date']" :items="assignments" :isLoading="isLoading">
        <template #row="{ item }">
          <td class="px-6 py-3.5">
            <div class="text-xs font-semibold text-white">{{ item.employeeId?.firstName }} {{ item.employeeId?.lastName }}</div>
            <span class="text-[9px] text-slate-500 font-mono">{{ item.employeeId?.employeeCode }}</span>
          </td>
          <td class="px-6 py-3.5 text-xs text-slate-200">
            {{ item.courseId?.title }}
            <span class="block text-[10px] text-slate-500 font-mono mt-0.5">{{ item.courseId?.duration }} ({{ item.courseId?.type }})</span>
          </td>
          <td class="px-6 py-3.5"><HrmBadge :status="item.status" /></td>
          <td class="px-6 py-3.5 w-[220px]">
            <!-- Only current user can slide their progress slider, managers review read-only -->
            <div v-if="item.employeeId?._id === employeeId || item.employeeId === employeeId" class="space-y-1.5">
              <input 
                type="range" 
                :value="item.progress" 
                min="0"
                max="100"
                step="10"
                @change="handleUpdateProgress(item._id, $event.target.value)"
                class="w-full h-1 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-purple"
              />
              <div class="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>SLIDE: {{ item.progress }}%</span>
                <span>COMPLETED</span>
              </div>
            </div>
            <div v-else class="space-y-1">
              <div class="w-full h-1.5 bg-brand-border rounded-full overflow-hidden">
                <div class="h-full bg-brand-purple" :style="{ width: `${item.progress}%` }"></div>
              </div>
              <span class="text-[9px] text-slate-500 font-mono block mt-1">Progress: {{ item.progress }}%</span>
            </div>
          </td>
          <td class="px-6 py-3.5 text-xs text-slate-500 font-mono">
            {{ formatLocalDate(item.createdAt) }}
          </td>
        </template>
      </HrmTable>
    </div>

    <!-- Add Course Modal -->
    <HrmModal :show="showCourseModal" title="Add Course to Library" @close="showCourseModal = false" maxWidth="max-w-md">
      <form @submit.prevent="submitCourseForm" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Course Title</label>
          <input type="text" v-model="courseForm.title" required placeholder="e.g. Master Vue Composition API" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Material Type</label>
            <select v-model="courseForm.type" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white cursor-pointer">
              <option value="video">Video Course</option>
              <option value="doc">Document Text</option>
              <option value="link">External Link</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Duration</label>
            <input type="text" v-model="courseForm.duration" required placeholder="e.g. 2 hours" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Material URL Link</label>
          <input type="url" v-model="courseForm.url" required placeholder="https://docs.example.com" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white" />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Course Description</label>
          <textarea v-model="courseForm.description" rows="3" required placeholder="Describe course details..." class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white resize-none"></textarea>
        </div>

        <div class="pt-4 flex justify-end gap-3 border-t border-brand-border/40">
          <HrmButton type="button" variant="secondary" @click="showCourseModal = false">Cancel</HrmButton>
          <HrmButton type="submit" variant="primary">Add Course</HrmButton>
        </div>
      </form>
    </HrmModal>

    <!-- Assign Course Modal -->
    <HrmModal :show="showAssignModal" title="Assign Training Course" @close="showAssignModal = false" maxWidth="max-w-md">
      <form @submit.prevent="submitAssignForm" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Select Course</label>
          <select v-model="assignForm.courseId" required class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white cursor-pointer">
            <option value="">Choose Course</option>
            <option v-for="c in courses" :key="c._id" :value="c._id">{{ c.title }}</option>
          </select>
        </div>

        <div class="p-3 bg-brand-purple/10 border border-brand-purple/30 rounded-lg text-xs leading-relaxed text-slate-300">
          You can assign a training course to a single employee OR bulk-assign it to all active members of a department.
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5 font-mono text-brand-purple uppercase tracking-wider">Option A: Assign to Employee</label>
          <select v-model="assignForm.employeeId" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white cursor-pointer">
            <option value="">None (Use Option B)</option>
            <option v-for="e in employees" :key="e._id" :value="e._id">{{ e.firstName }} {{ e.lastName }}</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5 font-mono text-brand-purple uppercase tracking-wider">Option B: Bulk-Assign to Department</label>
          <select v-model="assignForm.departmentId" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white cursor-pointer">
            <option value="">None (Use Option A)</option>
            <option v-for="d in departments" :key="d._id" :value="d._id">{{ d.name }}</option>
          </select>
        </div>

        <div class="pt-4 flex justify-end gap-3 border-t border-brand-border/40">
          <HrmButton type="button" variant="secondary" @click="showAssignModal = false">Cancel</HrmButton>
          <HrmButton type="submit" variant="primary">Assign</HrmButton>
        </div>
      </form>
    </HrmModal>
  </div>
</template>
