<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRecruitmentStore } from '../stores/recruitment';
import { useToast } from '../composables/useToast';
import { formatLocalDate } from '../utils/date';
import draggable from 'vuedraggable';
import HrmButton from '../components/ui/HrmButton.vue';
import HrmModal from '../components/ui/HrmModal.vue';
import HrmBadge from '../components/ui/HrmBadge.vue';
import { Briefcase, User, FileText, Plus, MessageSquare, Save } from 'lucide-vue-next';

const recruitmentStore = useRecruitmentStore();
const { addToast } = useToast();

const showJobModal = ref(false);
const showApplicantModal = ref(false);

// Job Form
const jobForm = ref({ title: '', department: '', type: 'Full-Time', description: '', requirements: '' });

// Selected applicant notes modal state
const selectedApplicant = ref(null);
const newNote = ref('');

const jobs = computed(() => recruitmentStore.jobs);
const applicants = computed(() => recruitmentStore.applicants);
const isLoading = computed(() => recruitmentStore.isLoading);

const stages = ['Applied', 'Screened', 'Interview', 'Offer', 'Hired', 'Rejected'];

// Group applicants by stages reactively
const columns = computed(() => {
  const cols = {};
  stages.forEach(stage => {
    cols[stage] = applicants.value.filter(a => a.stage === stage);
  });
  return cols;
});

const loadRecruitment = () => {
  recruitmentStore.fetchJobs();
  recruitmentStore.fetchApplicants();
};

const handleCreateJob = async () => {
  const result = await recruitmentStore.createJob(jobForm.value);
  if (result.success) {
    addToast('Job posting created successfully!', 'success');
    showJobModal.value = false;
    jobForm.value = { title: '', department: '', type: 'Full-Time', description: '', requirements: '' };
    recruitmentStore.fetchJobs();
  } else {
    addToast(result.message, 'error');
  }
};

// Handle drag and drop stage updates
const onCardMoved = async (event, targetStage) => {
  if (event.added) {
    const applicant = event.added.element;
    const result = await recruitmentStore.updateApplicantStage(applicant._id, targetStage);
    if (result.success) {
      addToast(`Moved ${applicant.name} to ${targetStage} stage.`, 'success');
    } else {
      addToast('Failed to update stage.', 'error');
    }
  }
};

const openApplicantDetails = (app) => {
  selectedApplicant.value = app;
  newNote.value = '';
  showApplicantModal.value = true;
};

const submitApplicantNote = async () => {
  if (!newNote.value.trim()) return;
  const result = await recruitmentStore.addApplicantNote(selectedApplicant.value._id, newNote.value);
  if (result.success) {
    addToast('Interview note added successfully!', 'success');
    // Refresh selected applicant details
    selectedApplicant.value = recruitmentStore.applicants.find(a => a._id === selectedApplicant.value._id);
    newNote.value = '';
  } else {
    addToast(result.message, 'error');
  }
};

onMounted(() => {
  loadRecruitment();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Top banner -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-white">Recruitment ATS Workspace</h1>
        <p class="text-slate-400 text-xs mt-1">Review applicant CV pipelines using interactive drag-and-drop boards.</p>
      </div>

      <HrmButton variant="primary" @click="showJobModal = true">
        <Plus class="w-4 h-4" />
        New Job Posting
      </HrmButton>
    </div>

    <!-- Kanban Board Grid -->
    <div v-if="isLoading" class="py-16 text-center text-slate-500">
      <div class="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
      Loading candidates...
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
      <div 
        v-for="stage in stages" 
        :key="stage"
        class="bg-[#0C0E1A]/35 border border-brand-border/60 rounded-xl p-3 flex flex-col min-w-[200px] h-[72vh] glass-panel"
      >
        <!-- Column Header -->
        <div class="flex items-center justify-between mb-4 border-b border-brand-border/40 pb-2">
          <h4 class="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">{{ stage }}</h4>
          <span class="text-[10px] font-bold text-slate-500 font-mono px-2 py-0.5 bg-brand-border/50 rounded-full">
            {{ columns[stage]?.length || 0 }}
          </span>
        </div>

        <!-- Draggable Cards Container -->
        <draggable
          :list="columns[stage]"
          group="applicants"
          item-key="_id"
          class="flex-1 overflow-y-auto space-y-3 pb-6 cursor-grab active:cursor-grabbing"
          ghost-class="opacity-40"
          drag-class="rotate-1"
          @change="onCardMoved($event, stage)"
        >
          <template #item="{ element }">
            <div 
              @click="openApplicantDetails(element)"
              class="p-3.5 bg-brand-card/70 border border-brand-border/60 rounded-lg hover:border-brand-blue/60 hover:bg-brand-card transition duration-150 relative space-y-2 cursor-pointer shadow group"
            >
              <h5 class="text-xs font-bold text-white truncate group-hover:text-brand-blue">{{ element.name }}</h5>
              <p class="text-[10px] text-slate-400 font-medium truncate">{{ element.jobId?.title }}</p>
              
              <div class="flex items-center justify-between pt-2 border-t border-brand-border/40 text-[9px] text-slate-500">
                <span class="font-mono">{{ formatLocalDate(element.appliedAt) }}</span>
                <span class="flex items-center gap-1">
                  <MessageSquare class="w-3 h-3 text-brand-purple" />
                  {{ element.notes?.length || 0 }}
                </span>
              </div>
            </div>
          </template>
        </draggable>
      </div>
    </div>

    <!-- Create Job Posting Modal -->
    <HrmModal :show="showJobModal" title="Create Job Opening" @close="showJobModal = false" maxWidth="max-w-md">
      <form @submit.prevent="handleCreateJob" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Job Title</label>
          <input type="text" v-model="jobForm.title" required placeholder="e.g. Senior Frontend Engineer" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Department</label>
            <input type="text" v-model="jobForm.department" required placeholder="e.g. Engineering" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Employment Type</label>
            <select v-model="jobForm.type" class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white cursor-pointer">
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Job Description</label>
          <textarea v-model="jobForm.description" rows="3" required placeholder="Write brief description..." class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white resize-none"></textarea>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Job Requirements</label>
          <textarea v-model="jobForm.requirements" rows="3" required placeholder="Figma, Vue 3, GSAP..." class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white resize-none"></textarea>
        </div>

        <div class="pt-4 flex justify-end gap-3 border-t border-brand-border/40">
          <HrmButton type="button" variant="secondary" @click="showJobModal = false">Cancel</HrmButton>
          <HrmButton type="submit" variant="primary">Post Job</HrmButton>
        </div>
      </form>
    </HrmModal>

    <!-- Applicant Pipeline Detail & Notes Modal -->
    <HrmModal :show="showApplicantModal" :title="`Candidate: ${selectedApplicant?.name}`" @close="showApplicantModal = false" maxWidth="max-w-lg">
      <div v-if="selectedApplicant" class="space-y-6">
        
        <!-- Applicant basic details box -->
        <div class="grid grid-cols-2 gap-4 p-4 rounded-xl border border-brand-border/60 bg-black/25 text-xs">
          <div><span class="text-slate-500">Target Role:</span> <span class="text-white font-semibold">{{ selectedApplicant.jobId?.title }}</span></div>
          <div><span class="text-slate-500">Contact Email:</span> <span class="text-white break-all">{{ selectedApplicant.email }}</span></div>
          <div><span class="text-slate-500">Applied Date:</span> <span class="text-slate-300 font-mono">{{ formatLocalDate(selectedApplicant.appliedAt) }}</span></div>
          <div>
            <span class="text-slate-500 mr-2">Resume:</span>
            <a :href="selectedApplicant.resumeUrl" target="_blank" class="text-brand-purple hover:underline inline-flex items-center gap-1 font-bold">
              <FileText class="w-3.5 h-3.5" />
              Download CV
            </a>
          </div>
        </div>

        <!-- Notes Section -->
        <div class="space-y-4">
          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Interview & Evaluation Notes</h4>
          
          <div v-if="selectedApplicant.notes?.length === 0" class="text-xs text-slate-500 py-2 text-center">
            No notes recorded for this candidate yet.
          </div>

          <div v-else class="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            <div 
              v-for="note in selectedApplicant.notes" 
              :key="note._id"
              class="p-3 bg-brand-border/20 border border-brand-border/60 rounded-lg text-xs leading-relaxed"
            >
              <div class="flex justify-between items-center text-[10px] text-slate-400 font-semibold mb-1">
                <span>By: {{ note.author }}</span>
                <span>{{ formatLocalDate(note.createdAt) }}</span>
              </div>
              <p class="text-slate-200">{{ note.text }}</p>
            </div>
          </div>
        </div>

        <!-- Add Note form -->
        <form @submit.prevent="submitApplicantNote" class="space-y-3 border-t border-brand-border/40 pt-4">
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">Add Evaluation / Review Comment</label>
            <textarea 
              v-model="newNote" 
              rows="2.5" 
              required 
              placeholder="Provide technical evaluation score, cultural fit details, etc..." 
              class="w-full bg-black/35 border border-brand-border rounded px-3 py-2 text-sm text-white resize-none"
            ></textarea>
          </div>
          <div class="flex justify-end">
            <HrmButton type="submit" variant="purple" class="py-1.5">
              <Save class="w-3.5 h-3.5" />
              Save Note
            </HrmButton>
          </div>
        </form>
      </div>
    </HrmModal>
  </div>
</template>
