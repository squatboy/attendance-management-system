<template>
  <div>
    <router-link to="/appeals" class="text-gray-600 hover:text-gray-900 mb-4 inline-block">
      <i class="fa-solid fa-arrow-left mr-2"></i>
      이의 신청 목록
    </router-link>
    
    <div v-if="isLoading" class="text-center py-12">
      <i class="fa-solid fa-spinner fa-spin text-4xl text-primary-600"></i>
    </div>
    
    <div v-else-if="appeal" class="max-w-2xl mx-auto">
      <div class="card">
        <div class="p-6 border-b border-gray-100">
          <div class="flex items-center justify-between">
            <h1 class="text-xl font-bold text-gray-900">이의 신청 상세</h1>
            <span :class="getStatusClass(appeal.status)">
              {{ getStatusLabel(appeal.status) }}
            </span>
          </div>
        </div>
        
        <div class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">강의</p>
              <p class="font-medium">{{ appeal.course_title }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">신청자</p>
              <p class="font-medium">{{ appeal.student_name }} ({{ appeal.student_id }})</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">수업 일시</p>
              <p class="font-medium">{{ formatDate(appeal.session_date) }} {{ appeal.period }}교시</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">상태 변경</p>
              <p class="font-medium">
                <span :class="getAttendanceBadge(appeal.original_status)">{{ getAttendanceLabel(appeal.original_status) }}</span>
                <i class="fa-solid fa-arrow-right mx-2 text-gray-400"></i>
                <span :class="getAttendanceBadge(appeal.requested_status)">{{ getAttendanceLabel(appeal.requested_status) }}</span>
              </p>
            </div>
          </div>
          
          <div>
            <p class="text-sm text-gray-500 mb-1">이의 사유</p>
            <p class="bg-gray-50 rounded-lg p-4">{{ appeal.reason }}</p>
          </div>
          
          <!-- 거절 사유 -->
          <div v-if="appeal.status === 'rejected' && appeal.reject_reason">
            <p class="text-sm text-gray-500 mb-1">거절 사유</p>
            <p class="bg-red-50 text-red-700 rounded-lg p-4">{{ appeal.reject_reason }}</p>
          </div>
          
          <!-- 처리 버튼 (교원/관리자) -->
          <div v-if="(authStore.isInstructor || authStore.isAdmin) && appeal.status === 'pending'" class="pt-4 border-t border-gray-100">
            <p class="text-sm text-gray-500 mb-2">처리</p>
            <div class="flex gap-3">
              <button @click="processAppeal('approved')" class="btn btn-success flex-1">
                <i class="fa-solid fa-check mr-2"></i>
                승인
              </button>
              <button @click="showRejectModal = true" class="btn btn-danger flex-1">
                <i class="fa-solid fa-xmark mr-2"></i>
                거절
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 거절 사유 모달 -->
    <div v-if="showRejectModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl max-w-md w-full p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">거절 사유 입력</h3>
        <textarea
          v-model="rejectReason"
          class="input min-h-[100px] mb-4"
          placeholder="거절 사유를 입력하세요"
        ></textarea>
        <div class="flex gap-3">
          <button @click="processAppeal('rejected')" class="btn btn-danger flex-1" :disabled="!rejectReason">
            거절 확인
          </button>
          <button @click="showRejectModal = false" class="btn btn-secondary flex-1">
            취소
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const appeal = ref(null)
const isLoading = ref(true)
const showRejectModal = ref(false)
const rejectReason = ref('')

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

const getAttendanceBadge = (status) => {
  const classes = {
    present: 'badge badge-success',
    late: 'badge badge-warning',
    absent: 'badge badge-danger',
    excused: 'badge badge-info'
  }
  return classes[status] || 'badge badge-gray'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ko-KR')
}

const fetchAppeal = async () => {
  isLoading.value = true
  try {
    const response = await api.get(`/appeals/${route.params.id}`)
    if (response.success) {
      appeal.value = response.data
    }
  } catch (error) {
    console.error('이의 신청 조회 오류:', error)
  } finally {
    isLoading.value = false
  }
}

const processAppeal = async (status) => {
  try {
    await api.put(`/appeals/${appeal.value.id}/process`, {
      status,
      rejectReason: status === 'rejected' ? rejectReason.value : undefined
    })
    alert(status === 'approved' ? '승인되었습니다.' : '거절되었습니다.')
    router.push('/appeals')
  } catch (error) {
    alert(error.message || '처리에 실패했습니다.')
  }
}

onMounted(() => {
  fetchAppeal()
})
</script>
