<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">공결 신청</h1>
        <p class="text-gray-600 mt-1">공결 신청 내역을 확인하세요</p>
      </div>
      <router-link 
        v-if="authStore.isStudent"
        to="/excuses/new" 
        class="btn btn-primary"
      >
        <i class="fa-solid fa-plus mr-2"></i>
        새 신청
      </router-link>
    </div>
    
    <!-- 필터 -->
    <div class="card p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <select v-model="filter.status" class="input w-auto">
          <option value="">전체 상태</option>
          <option value="pending">대기 중</option>
          <option value="approved">승인됨</option>
          <option value="rejected">거절됨</option>
        </select>
      </div>
    </div>
    
    <div v-if="isLoading" class="text-center py-12">
      <i class="fa-solid fa-spinner fa-spin text-4xl text-primary-600"></i>
    </div>
    
    <div v-else-if="excuses.length === 0" class="card p-12 text-center">
      <i class="fa-solid fa-file-lines text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-600">공결 신청 내역이 없습니다.</p>
    </div>
    
    <div v-else class="space-y-4">
      <div 
        v-for="excuse in filteredExcuses" 
        :key="excuse.id"
        class="card p-5"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span :class="getStatusClass(excuse.status)">
                {{ getStatusLabel(excuse.status) }}
              </span>
              <span class="badge badge-info">{{ excuse.excuse_type }}</span>
            </div>
            <h3 class="font-medium text-gray-900 mb-1">{{ excuse.course_title }}</h3>
            <p class="text-sm text-gray-600 mb-2">{{ formatDate(excuse.excuse_date) }}</p>
            <p class="text-sm text-gray-500 line-clamp-2">{{ excuse.reason }}</p>
          </div>
          <router-link 
            :to="`/excuses/${excuse.id}`"
            class="btn btn-secondary btn-sm ml-4"
          >
            상세
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'

const authStore = useAuthStore()

const excuses = ref([])
const isLoading = ref(true)
const filter = ref({
  status: ''
})

const filteredExcuses = computed(() => {
  return excuses.value.filter(e => {
    return !filter.value.status || e.status === filter.value.status
  })
})

const getStatusClass = (status) => {
  const classes = {
    pending: 'badge badge-warning',
    approved: 'badge badge-success',
    rejected: 'badge badge-danger'
  }
  return classes[status] || 'badge badge-gray'
}

const getStatusLabel = (status) => {
  const labels = {
    pending: '대기 중',
    approved: '승인됨',
    rejected: '거절됨'
  }
  return labels[status] || status
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ko-KR')
}

const fetchExcuses = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/excuses')
    if (response.success) {
      excuses.value = response.data
    }
  } catch (error) {
    console.error('공결 신청 목록 조회 오류:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchExcuses()
})
</script>
