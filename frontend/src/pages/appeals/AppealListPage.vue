<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">이의 신청</h1>
        <p class="text-gray-600 mt-1">출석 이의 신청 내역을 확인하세요</p>
      </div>
      <router-link 
        v-if="authStore.isStudent"
        to="/appeals/new" 
        class="btn btn-primary"
      >
        <i class="fa-solid fa-plus mr-2"></i>
        새 신청
      </router-link>
    </div>
    
    <div v-if="isLoading" class="text-center py-12">
      <i class="fa-solid fa-spinner fa-spin text-4xl text-primary-600"></i>
    </div>
    
    <div v-else-if="appeals.length === 0" class="card p-12 text-center">
      <i class="fa-solid fa-flag text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-600">이의 신청 내역이 없습니다.</p>
    </div>
    
    <div v-else class="space-y-4">
      <div 
        v-for="appeal in appeals" 
        :key="appeal.id"
        class="card p-5"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span :class="getStatusClass(appeal.status)">
                {{ getStatusLabel(appeal.status) }}
              </span>
            </div>
            <h3 class="font-medium text-gray-900 mb-1">{{ appeal.course_title }}</h3>
            <p class="text-sm text-gray-600 mb-2">
              {{ formatDate(appeal.session_date) }} - 
              {{ getAttendanceLabel(appeal.original_status) }} → {{ getAttendanceLabel(appeal.requested_status) }}
            </p>
            <p class="text-sm text-gray-500 line-clamp-2">{{ appeal.reason }}</p>
          </div>
          <router-link 
            :to="`/appeals/${appeal.id}`"
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
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'

const authStore = useAuthStore()

const appeals = ref([])
const isLoading = ref(true)

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

const getAttendanceLabel = (status) => {
  const labels = {
    present: '출석',
    late: '지각',
    absent: '결석',
    excused: '공결'
  }
  return labels[status] || status
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ko-KR')
}

const fetchAppeals = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/appeals')
    if (response.success) {
      appeals.value = response.data
    }
  } catch (error) {
    console.error('이의 신청 목록 조회 오류:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchAppeals()
})
</script>
