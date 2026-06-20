<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { usePerformanceStore } from '../stores/performance';
import { useEmployeeStore } from '../stores/employee';
import { useToast } from '../composables/useToast';
import { formatDate, formatLocalDate } from '../utils/date';
import HrmButton from '../components/ui/HrmButton.vue';
import HrmModal from '../components/ui/HrmModal.vue';
import HrmTable from '../components/ui/HrmTable.vue';
import HrmBadge from '../components/ui/HrmBadge.vue';
import { Award, Plus, Target, CheckSquare, Star, ArrowUpRight } from 'lucide-vue-next';

const authStore = useAuthStore();
const performanceStore = usePerformanceStore();
const employeeStore = useEmployeeStore();
const { addToast } = useToast();

const userRole = computed(() => authStore.userRole);
const employeeId = computed(() => authStore.user?.employeeId);

const activeTab = ref('okrs'); // 'okrs' | 'appraisals'
const showGoalModal = ref(false);
const showReviewModal = ref(false);
const showCycleModal = ref(false);

// Goal form state
const goalForm = ref({ title: '', description: '', type: 'OKR', targetValue: 100, dueDate: '' });

// Review form state
const reviewForm = ref({
  cycleId: '',
  revieweeId: '',
  ratings: { performance: 3, communication: 3, teamwork: 3, technical: 3 },
  feedback: '',
});

// Review cycle form state
const cycleForm = ref({ name: '', startDate: '', endDate: '' });

const goalsList = computed(() => performanceStore.goals);
const cycles = computed(() => performanceStore.cycles);
const reviews = computed(() => performanceStore.reviews);
const reviewSummary = computed(() => performanceStore.reviewSummary);
const employees = computed(() => employeeStore.employees);

const loadPerformanceData = () => {
  if (activeTab.value === 'okrs') {
    performanceStore.fetchGoals();
  } else {
    performanceStore.fetchCycles();
    performanceStore.fetchReviews();
    if (employeeId.value) {
      performanceStore.fetchReviewSummary(employeeId.value);
    }
  }
};

watch(activeTab, () => {
  loadPerformanceData();
});

const submitGoalForm = async () => {
  const result = await performanceStore.createGoal(goalForm.value);
  if (result.success) {
    addToast('Performance goal added successfully!', 'success');
    showGoalModal.value = false;
    goalForm.value = { title: '', description: '', type: 'OKR', targetValue: 100, dueDate: '' };
    performanceStore.fetchGoals();
  } else {
    addToast(result.message, 'error');
  }
};

const handleUpdateProgress = async (goalId, newProgress) => {
  const result = await performanceStore.updateGoal(goalId, { currentValue: newProgress });
  if (result.success) {
    addToast('OKR Goal progress updated!', 'success');
  } else {
    addToast(result.message, 'error');
  }
};

const handleDeleteGoal = async (id) => {
  if (!confirm('Are you sure you want to delete this OKR/KPI?')) return;
  const result = await performanceStore.deleteGoal(id);
  if (result.success) {
    addToast('Goal deleted.', 'success');
    performanceStore.fetchGoals();
  } else {
    addToast(result.message, 'error');
  }
};

const submitReviewForm = async () => {
  const result = await performanceStore.submitReview(reviewForm.value);
  if (result.success) {
    addToast('Peer review feedback submitted successfully!', 'success');
    showReviewModal.value = false;
    reviewForm.value = { cycleId: '', revieweeId: '', ratings: { performance: 3, communication: 3, teamwork: 3, technical: 3 }, feedback: '' };
    performanceStore.fetchReviews();
  } else {
    addToast(result.message, 'error');
  }
};

const submitCycleForm = async () => {
  const result = await performanceStore.createCycle(cycleForm.value);
  if (result.success) {
    addToast('New appraisal cycle opened.', 'success');
    showCycleModal.value = false;
    cycleForm.value = { name: '', startDate: '', endDate: '' };
    performanceStore.fetchCycles();
  } else {
    addToast(result.message, 'error');
  }
};

onMounted(() => {
  loadPerformanceData();
  employeeStore.fetchEmployees({ limit: 100 }); // load list for review dropdowns
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header banner -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white">Performance Appraisals</h1>
        <p class="text-slate-400 text-xs mt-1">Set department OKRs/KPIs, run 360 reviews, and submit evaluations.</p>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex border-b border-brand-border/60">
      <button 
        @click="activeTab = 'okrs'"
        :class="['px-5 py-3 text-sm font-semibold border-b-2 transition duration-200 cursor-pointer', activeTab === 'okrs' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-400 hover:text-white']"
      >
        My OKRs & KPI Targets
      </button>
      <button 
        @click="activeTab = 'appraisals'"
        :class="['px-5 py-3 text-sm font-semibold border-b-2 transition duration-200 cursor-pointer', activeTab === 'appraisals' ? 'border-brand-purple text-brand-purple' : 'border-transparent text-slate-400 hover:text-white']"
      >
        360 Evaluations & Reviews
      </button>
    </div>

    <!-- ==================== Tab 1: OKRs Goals Grid ==================== -->
    <div v-if="activeTab === 'okrs'" class="space-y-6">
      <div class="flex justify-between items-center">
        <h3 class="text-md font-bold text-white">Objective Key Results (OKRs)</h3>
        <HrmButton variant="primary" @click="showGoalModal = true">
          <Plus class="w-4 h-4" />
          Add OKR Target
        </HrmButton>
      </div>

      <div v-if="goalsList.length === 0" class="text-xs text-slate-500 py-12 text-center border border-dashed border-brand-border rounded-xl">
        No goals set for this cycle. Click "Add OKR Target" to begin.
      </div>

      <!-- OKR Cards List -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          v-for="goal in goalsList" 
          :key="goal._id"
          class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center justify-between mb-4">
              <span class="text-[10px] font-bold text-brand-purple font-mono uppercase tracking-widest">{{ goal.type }}</span>
              <HrmBadge :status="goal.status" />
            </div>

            <h4 class="text-md font-bold text-white mb-2">{{ goal.title }}</h4>
            <p class="text-slate-400 text-xs leading-relaxed mb-6">{{ goal.description }}</p>
          </div>

          <div class="space-y-4">
            <!-- Progress Slider -->
            <div>
              <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-2">
                <span>PROGRESS: {{ goal.currentValue }} / {{ goal.targetValue }}</span>
                <span>{{ Math.round((goal.currentValue / goal.targetValue) * 100) }}%</span>
              </div>
              <input 
                type="range" 
                :value="goal.currentValue" 
                :max="goal.targetValue"
                @change="handleUpdateProgress(goal._id, $event.target.value)"
                class="w-full h-1 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-blue"
              />
            </div>

            <!-- Target Meta Info -->
            <div class="flex items-center justify-between pt-4 border-t border-brand-border/40 text-[10px] text-slate-500 font-mono">
              <span>DUE: {{ formatDate(goal.dueDate) }}</span>
              <button 
                @click="handleDeleteGoal(goal._id)"
                class="text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
              >
                Delete OKR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== Tab 2: 360 Appraisals reviews panel ==================== -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Review Cycle Stats (Left Side) -->
      <div class="space-y-6">
        <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel">
          <h3 class="text-md font-bold text-white mb-4">Self Evaluation Score Card</h3>

          <!-- Aggregated Averages -->
          <div v-if="reviewSummary && reviewSummary.averageRatings" class="space-y-4">
            <div 
              v-for="(score, cat) in reviewSummary.averageRatings" 
              :key="cat"
              class="flex items-center justify-between text-xs"
            >
              <span class="text-slate-400 capitalize font-medium">{{ cat }}</span>
              <div class="flex items-center gap-1.5 font-bold text-white">
                <Star class="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                {{ typeof score === 'number' ? score.toFixed(1) : score }} / 5
              </div>
            </div>
            
            <p class="text-[10px] text-slate-500 font-mono text-center pt-4 border-t border-brand-border/40">
              Aggregated from {{ reviewSummary.count || 0 }} evaluations.
            </p>
          </div>

          <div v-else class="text-xs text-slate-500 italic py-6 text-center">
            No evaluations completed for you in the active cycle yet.
          </div>
        </div>

        <!-- Open Cycles (Admin / HR) -->
        <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-md font-bold text-white">Review Cycles</h3>
            <button 
              v-if="['Super Admin', 'HR Manager'].includes(userRole)"
              @click="showCycleModal = true"
              class="text-xs text-brand-blue hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
            >
              + Create
            </button>
          </div>

          <div class="space-y-3">
            <div 
              v-for="c in cycles" 
              :key="c._id"
              class="p-3 bg-black/20 border border-brand-border/40 rounded-lg text-xs flex justify-between items-center"
            >
              <div>
                <h5 class="font-bold text-slate-200">{{ c.name }}</h5>
                <span class="text-[9px] text-slate-500 font-mono">{{ formatDate(c.startDate) }} - {{ formatDate(c.endDate) }}</span>
              </div>
              <HrmBadge :status="c.status" />
            </div>
          </div>
        </div>
      </div>

      <!-- Feedback Records (Right Side) -->
      <div class="lg:col-span-2 space-y-6">
        <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-md font-bold text-white">Peer Evaluation & Feedback</h3>
            
            <HrmButton variant="primary" @click="showReviewModal = true">
              <Star class="w-4 h-4 text-brand-purple fill-brand-purple" />
              Write Colleague Evaluation
            </HrmButton>
          </div>

          <!-- Reviews Table -->
          <HrmTable :headers="['Colleague', 'Evaluator', 'Ratings (Perf/Comm/Team/Tech)', 'Submitted']" :items="reviews">
            <template #row="{ item }">
              <td class="px-6 py-3.5">
                <div class="text-xs font-semibold text-white">{{ item.revieweeId?.firstName }} {{ item.revieweeId?.lastName }}</div>
                <span class="text-[9px] text-slate-500 font-mono">{{ item.revieweeId?.designation }}</span>
              </td>
              <td class="px-6 py-3.5 text-xs text-slate-400">
                {{ item.reviewerId?.firstName }} {{ item.reviewerId?.lastName }}
              </td>
              <td class="px-6 py-3.5 text-xs font-mono">
                <span class="text-brand-blue font-bold">{{ item.ratings.performance }}</span> /
                <span class="text-brand-purple font-bold">{{ item.ratings.communication }}</span> /
                <span class="text-yellow-500 font-bold">{{ item.ratings.teamwork }}</span> /
                <span class="text-slate-300 font-bold">{{ item.ratings.technical }}</span>
              </td>
              <td class="px-6 py-3.5 text-xs text-slate-500 font-mono">
                {{ formatLocalDate(item.submittedAt) }}
              </td>
            </template>
          </HrmTable>
        </div>
      </div>
    </div>

    <!-- Create Goal Modal -->
    <HrmModal :show="showGoalModal" title="Create OKR Goal" @close="showGoalModal = false" maxWidth="max-w-md">
      <form @submit.prevent="submitGoalForm" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Goal Objective Title</label>
          <input type="text" v-model="goalForm.title" required placeholder="e.g. Optimize Mongo indices for dashboard" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Metric Type</label>
            <select v-model="goalForm.type" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white cursor-pointer">
              <option value="OKR">OKR Target</option>
              <option value="KPI">KPI Metric</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Target Cap</label>
            <input type="number" v-model="goalForm.targetValue" required class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white font-mono" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Goal Description</label>
          <textarea v-model="goalForm.description" rows="3" required placeholder="Define key results..." class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white resize-none"></textarea>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Due Date</label>
          <input type="date" v-model="goalForm.dueDate" required class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white cursor-pointer" />
        </div>

        <div class="pt-4 flex justify-end gap-3 border-t border-brand-border/40">
          <HrmButton type="button" variant="secondary" @click="showGoalModal = false">Cancel</HrmButton>
          <HrmButton type="submit" variant="primary">Add OKR</HrmButton>
        </div>
      </form>
    </HrmModal>

    <!-- Create Appraisal Cycle Modal -->
    <HrmModal :show="showCycleModal" title="Open Appraisal Cycle" @close="showCycleModal = false" maxWidth="max-w-md">
      <form @submit.prevent="submitCycleForm" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Cycle Name</label>
          <input type="text" v-model="cycleForm.name" required placeholder="e.g. Q3 Performance Appraisals 2026" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Start Date</label>
            <input type="date" v-model="cycleForm.startDate" required class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white cursor-pointer" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">End Date</label>
            <input type="date" v-model="cycleForm.endDate" required class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white cursor-pointer" />
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-3 border-t border-brand-border/40">
          <HrmButton type="button" variant="secondary" @click="showCycleModal = false">Cancel</HrmButton>
          <HrmButton type="submit" variant="primary">Open Cycle</HrmButton>
        </div>
      </form>
    </HrmModal>

    <!-- Submit Review Modal -->
    <HrmModal :show="showReviewModal" title="Submit Colleague Evaluation" @close="showReviewModal = false" maxWidth="max-w-md">
      <form @submit.prevent="submitReviewForm" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Review Cycle</label>
            <select v-model="reviewForm.cycleId" required class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white cursor-pointer">
              <option value="">Select Cycle</option>
              <option v-for="c in cycles.filter(cy => cy.status === 'active')" :key="c._id" :value="c._id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Evaluate Employee</label>
            <select v-model="reviewForm.revieweeId" required class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white cursor-pointer">
              <option value="">Select Colleague</option>
              <option v-for="e in employees.filter(emp => emp._id !== employeeId)" :key="e._id" :value="e._id">{{ e.firstName }} {{ e.lastName }}</option>
            </select>
          </div>
        </div>

        <!-- Star scores -->
        <div class="space-y-3.5 py-2 border-y border-brand-border/40">
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-2">Category Scores (1 - 5)</h4>
          
          <div 
            v-for="cat in ['performance', 'communication', 'teamwork', 'technical']" 
            :key="cat"
            class="flex items-center justify-between text-xs"
          >
            <span class="capitalize text-slate-300">{{ cat }}</span>
            <div class="flex gap-2">
              <input 
                type="number" 
                v-model="reviewForm.ratings[cat]" 
                min="1" 
                max="5"
                class="w-16 text-center bg-black/35 border border-brand-border rounded px-1 py-1 text-sm text-white font-mono"
              />
            </div>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Written Evaluation Summary</label>
          <textarea v-model="reviewForm.feedback" rows="3" required placeholder="Write constructive feedback comments..." class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white resize-none"></textarea>
        </div>

        <div class="pt-4 flex justify-end gap-3 border-t border-brand-border/40">
          <HrmButton type="button" variant="secondary" @click="showReviewModal = false">Cancel</HrmButton>
          <HrmButton type="submit" variant="primary">Submit Review</HrmButton>
        </div>
      </form>
    </HrmModal>
  </div>
</template>
