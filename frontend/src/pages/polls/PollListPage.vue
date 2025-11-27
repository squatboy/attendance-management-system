<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">투표</h1>
        <p class="text-gray-600 mt-1">강의 투표에 참여하세요</p>
      </div>
      <router-link 
        v-if="authStore.isInstructor || authStore.isAdmin"
        to="/polls/new" 
        class="btn btn-primary"
      >
        <i class="fa-solid fa-plus mr-2"></i>
        투표 만들기
      </router-link>
    </div>
    
    <!-- 필터 -->
    <div class="card p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <select v-model="filter.status" class="input w-auto">
          <option value="">전체</option>
          <option value="active">진행 중</option>
          <option value="ended">종료됨</option>
        </select>
      </div>
    </div>
    
    <div v-if="isLoading" class="text-center py-12">
      <i class="fa-solid fa-spinner fa-spin text-4xl text-primary-600"></i>
    </div>
    
    <div v-else-if="filteredPolls.length === 0" class="card p-12 text-center">
      <i class="fa-solid fa-chart-bar text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-600">투표가 없습니다.</p>
    </div>
    
    <div v-else class="grid md:grid-cols-2 gap-4">
      <router-link 
        v-for="poll in filteredPolls" 
        :key="poll.id"
        :to="`/polls/${poll.id}`"
        class="card p-5 hover:shadow-lg transition-shadow"
      >
        <div class="flex items-start justify-between mb-3">
          <span :class="poll.is_active ? 'badge badge-success' : 'badge badge-gray'">
            {{ poll.is_active ? '진행 중' : '종료됨' }}
          </span>
          <span v-if="poll.is_anonymous" class="badge badge-info">익명</span>
        </div>
        <h3 class="font-bold text-gray-900 mb-2">{{ poll.title }}</h3>
        <p class="text-sm text-gray-600 mb-3 line-clamp-2">{{ poll.description }}</p>
        <div class="flex items-center justify-between text-sm text-gray-500">
          <span>
            <i class="fa-solid fa-users mr-1"></i>
            {{ poll.vote_count }}명 참여
          </span>
          <span v-if="poll.end_date">
            <i class="fa-solid fa-clock mr-1"></i>
            {{ formatDate(poll.end_date) }} 마감
          </span>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'

const authStore = useAuthStore()

const polls = ref([])
const isLoading = ref(true)
const filter = ref({
  status: ''
})

const filteredPolls = computed(() => {
  return polls.value.filter(p => {
    if (filter.value.status === 'active') return p.is_active
    if (filter.value.status === 'ended') return !p.is_active
    return true
  })
})

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ko-KR')
}

const fetchPolls = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/polls')
    if (response.success) {
      polls.value = response.data
    }
  } catch (error) {
    console.error('투표 목록 조회 오류:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchPolls()
})
</script>
