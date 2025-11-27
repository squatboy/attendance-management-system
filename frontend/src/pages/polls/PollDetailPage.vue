<template>
  <div>
    <router-link to="/polls" class="text-gray-600 hover:text-gray-900 mb-4 inline-block">
      <i class="fa-solid fa-arrow-left mr-2"></i>
      투표 목록
    </router-link>
    
    <div v-if="isLoading" class="text-center py-12">
      <i class="fa-solid fa-spinner fa-spin text-4xl text-primary-600"></i>
    </div>
    
    <div v-else-if="poll" class="max-w-2xl mx-auto">
      <div class="card">
        <div class="p-6 border-b border-gray-100">
          <div class="flex items-center gap-2 mb-3">
            <span :class="poll.is_active ? 'badge badge-success' : 'badge badge-gray'">
              {{ poll.is_active ? '진행 중' : '종료됨' }}
            </span>
            <span v-if="poll.is_anonymous" class="badge badge-info">익명</span>
            <span v-if="poll.allow_multiple" class="badge badge-warning">복수 선택</span>
          </div>
          <h1 class="text-xl font-bold text-gray-900 mb-2">{{ poll.title }}</h1>
          <p v-if="poll.description" class="text-gray-600">{{ poll.description }}</p>
          <div class="flex items-center gap-4 text-sm text-gray-500 mt-3">
            <span>{{ poll.course_title }}</span>
            <span v-if="poll.end_date">마감: {{ formatDate(poll.end_date) }}</span>
          </div>
        </div>
        
        <div class="p-6">
          <!-- 투표 전 -->
          <div v-if="poll.is_active && !hasVoted" class="space-y-3">
            <div 
              v-for="option in poll.options" 
              :key="option.id"
              class="border rounded-lg p-4 cursor-pointer transition-colors"
              :class="selectedOptions.includes(option.id) ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'"
              @click="toggleOption(option.id)"
            >
              <div class="flex items-center gap-3">
                <span 
                  class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                  :class="selectedOptions.includes(option.id) ? 'border-primary-500 bg-primary-500' : 'border-gray-300'"
                >
                  <i v-if="selectedOptions.includes(option.id)" class="fa-solid fa-check text-white text-xs"></i>
                </span>
                <span class="font-medium">{{ option.option_text }}</span>
              </div>
            </div>
            
            <button 
              @click="submitVote"
              class="btn btn-primary w-full mt-4"
              :disabled="selectedOptions.length === 0 || isSubmitting"
            >
              <template v-if="isSubmitting">
                <i class="fa-solid fa-spinner fa-spin mr-2"></i>
                투표 중...
              </template>
              <template v-else>
                <i class="fa-solid fa-check mr-2"></i>
                투표하기
              </template>
            </button>
          </div>
          
          <!-- 투표 결과 -->
          <div v-else class="space-y-3">
            <div v-if="hasVoted && poll.is_active" class="text-center text-green-600 mb-4">
              <i class="fa-solid fa-check-circle mr-2"></i>
              투표 완료
            </div>
            
            <div 
              v-for="option in poll.options" 
              :key="option.id"
              class="relative"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium">{{ option.option_text }}</span>
                <span class="text-sm text-gray-500">{{ option.vote_count }}표 ({{ getPercentage(option.vote_count) }}%)</span>
              </div>
              <div class="h-8 bg-gray-100 rounded-lg overflow-hidden">
                <div 
                  class="h-full bg-primary-500 transition-all"
                  :style="{ width: `${getPercentage(option.vote_count)}%` }"
                ></div>
              </div>
            </div>
            
            <p class="text-center text-sm text-gray-500 mt-4">
              총 {{ totalVotes }}명 참여
            </p>
          </div>
        </div>
      </div>
      
      <!-- 투표 종료 버튼 (생성자만) -->
      <div v-if="poll.is_active && isCreator" class="mt-4">
        <button @click="endPoll" class="btn btn-danger w-full">
          <i class="fa-solid fa-stop mr-2"></i>
          투표 종료
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'

const route = useRoute()
const authStore = useAuthStore()

const poll = ref(null)
const isLoading = ref(true)
const isSubmitting = ref(false)
const selectedOptions = ref([])
const hasVoted = ref(false)

const isCreator = computed(() => {
  return poll.value && poll.value.created_by === authStore.user?.id
})

const totalVotes = computed(() => {
  if (!poll.value?.options) return 0
  return poll.value.options.reduce((sum, opt) => sum + (opt.vote_count || 0), 0)
})

const getPercentage = (count) => {
  if (totalVotes.value === 0) return 0
  return Math.round((count / totalVotes.value) * 100)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('ko-KR')
}

const toggleOption = (optionId) => {
  if (poll.value.allow_multiple) {
    const index = selectedOptions.value.indexOf(optionId)
    if (index > -1) {
      selectedOptions.value.splice(index, 1)
    } else {
      selectedOptions.value.push(optionId)
    }
  } else {
    selectedOptions.value = [optionId]
  }
}

const fetchPoll = async () => {
  isLoading.value = true
  try {
    const response = await api.get(`/polls/${route.params.id}`)
    if (response.success) {
      poll.value = response.data
      hasVoted.value = response.data.has_voted
    }
  } catch (error) {
    console.error('투표 조회 오류:', error)
  } finally {
    isLoading.value = false
  }
}

const submitVote = async () => {
  isSubmitting.value = true
  try {
    await api.post(`/polls/${poll.value.id}/vote`, {
      optionIds: selectedOptions.value
    })
    hasVoted.value = true
    await fetchPoll()
    alert('투표가 완료되었습니다.')
  } catch (error) {
    alert(error.message || '투표에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

const endPoll = async () => {
  if (!confirm('투표를 종료하시겠습니까?')) return
  
  try {
    await api.put(`/polls/${poll.value.id}/end`)
    poll.value.is_active = false
    alert('투표가 종료되었습니다.')
  } catch (error) {
    alert(error.message || '투표 종료에 실패했습니다.')
  }
}

onMounted(() => {
  fetchPoll()
})
</script>
