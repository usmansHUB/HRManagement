<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import api from '../services/api';
import HrmButton from '../components/ui/HrmButton.vue';
import { Heart, MessageSquare, Send, Sparkles, Megaphone } from 'lucide-vue-next';

const authStore = useAuthStore();
const { addToast } = useToast();

const posts = ref([]);
const newPostText = ref('');
const isPublishing = ref(false);
const isLoading = ref(false);

const currentUserEmployeeId = computed(() => authStore.user?.employeeId);

const fetchBuzzPosts = async () => {
  isLoading.value = true;
  try {
    const { data } = await api.get('/buzz');
    if (data.success) {
      posts.value = data.data;
    }
  } catch (err) {
    console.error('Error fetching buzz feed:', err);
    addToast('Failed to load social wall feed.', 'error');
  } finally {
    isLoading.value = false;
  }
};

const createBuzzPost = async () => {
  if (!newPostText.value.trim()) return;
  isPublishing.value = true;
  try {
    const { data } = await api.post('/buzz', { text: newPostText.value });
    if (data.success) {
      posts.value.unshift(data.data);
      newPostText.value = '';
      addToast('Post shared to Buzz social wall!', 'success');
    }
  } catch (err) {
    addToast(err.response?.data?.message || 'Failed to post message.', 'error');
  } finally {
    isPublishing.value = false;
  }
};

const handleLike = async (post) => {
  try {
    const { data } = await api.post(`/buzz/${post._id}/like`);
    if (data.success) {
      // Toggle locally
      const empId = currentUserEmployeeId.value;
      const index = post.likes.indexOf(empId);
      if (index === -1) {
        post.likes.push(empId);
      } else {
        post.likes.splice(index, 1);
      }
    }
  } catch (err) {
    console.error('Failed to toggle like:', err);
  }
};

const isPostLiked = (post) => {
  return post.likes.includes(currentUserEmployeeId.value);
};

onMounted(() => {
  fetchBuzzPosts();
});
</script>

<template>
  <div class="space-y-8 max-w-4xl mx-auto">
    <!-- Header banner -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles class="w-6 h-6 text-brand-blue" />
          Company Buzz Wall
        </h1>
        <p class="text-slate-400 text-xs mt-1">Connect, share thoughts, and celebrate achievements with your colleagues.</p>
      </div>
    </div>

    <!-- Create Post card -->
    <div class="p-6 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel relative overflow-hidden group">
      <div class="absolute top-0 right-0 w-24 h-24 bg-brand-blue/5 rounded-bl-[80px] pointer-events-none"></div>
      
      <div class="flex gap-4">
        <!-- User Avatar -->
        <div class="w-10 h-10 rounded-full bg-brand-purple/20 border border-brand-purple/40 flex items-center justify-center font-bold text-sm text-brand-purple uppercase shrink-0">
          {{ authStore.user?.name ? authStore.user.name.slice(0, 2) : 'ME' }}
        </div>
        
        <div class="flex-1 space-y-4">
          <textarea
            v-model="newPostText"
            rows="3"
            placeholder="Share what is on your mind..."
            class="w-full bg-[#0E1322] border border-brand-border/80 focus:border-brand-blue rounded-xl p-3.5 text-sm text-white outline-none resize-none transition duration-200"
          ></textarea>
          
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-slate-500 font-mono">Respect and lift each other up.</span>
            
            <HrmButton 
              variant="primary" 
              class="py-1.5 px-4 text-xs font-semibold"
              :disabled="!newPostText.trim() || isPublishing"
              @click="createBuzzPost"
            >
              <Send class="w-3.5 h-3.5 mr-1.5" />
              Publish Post
            </HrmButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Feed section -->
    <div v-if="isLoading && posts.length === 0" class="py-16 text-center text-slate-500">
      <div class="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
      Tuning into the corporate frequency...
    </div>

    <div v-else-if="posts.length === 0" class="p-8 rounded-xl border border-brand-border/60 bg-brand-card/30 glass-panel text-center text-slate-500">
      <Megaphone class="w-10 h-10 text-slate-600 mx-auto mb-3" />
      No posts on the Buzz wall yet. Be the first to share!
    </div>

    <div v-else class="space-y-5">
      <div 
        v-for="post in posts" 
        :key="post._id"
        class="p-5 rounded-xl border border-brand-border/60 bg-brand-card/20 glass-panel hover:border-brand-blue/30 transition duration-300 relative group"
      >
        <div class="flex gap-4">
          <!-- Poster details -->
          <div class="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center font-bold text-slate-300 shrink-0">
            <img v-if="post.employeeId?.avatar" :src="post.employeeId.avatar" class="w-full h-full object-cover" />
            <span v-else>{{ post.employeeId?.firstName.slice(0, 1) + post.employeeId?.lastName.slice(0, 1) }}</span>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-white hover:text-brand-blue transition cursor-pointer">
                {{ post.employeeId?.firstName }} {{ post.employeeId?.lastName }}
              </span>
              <span class="text-[9px] font-medium text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                {{ post.employeeId?.designation }}
              </span>
            </div>
            
            <p class="text-slate-300 text-sm mt-3 leading-relaxed break-words whitespace-pre-wrap">{{ post.text }}</p>

            <div class="mt-4 pt-3 border-t border-brand-border/30 flex items-center justify-between">
              <!-- Timestamp -->
              <span class="text-[10px] text-slate-500 font-mono">
                {{ new Date(post.createdAt).toLocaleDateString() }} {{ new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
              </span>

              <!-- Actions -->
              <div class="flex items-center gap-4">
                <!-- Like Action -->
                <button 
                  @click="handleLike(post)"
                  class="flex items-center gap-1.5 text-xs font-medium cursor-pointer transition select-none outline-none group/like"
                  :class="isPostLiked(post) ? 'text-rose-400 font-bold scale-105' : 'text-slate-400 hover:text-white'"
                >
                  <Heart 
                    class="w-4 h-4 transition duration-200" 
                    :class="isPostLiked(post) ? 'fill-rose-400 text-rose-400' : 'group-hover/like:scale-110'"
                  />
                  <span>{{ post.likes?.length || 0 }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass-panel {
  backdrop-filter: blur(10px);
}
</style>
