<template>
  <div>
    <router-link to="/excuses" class="text-gray-600 hover:text-gray-900 mb-4 inline-block">
      <i class="fa-solid fa-arrow-left mr-2"></i>
      공결 신청 목록
    </router-link>
    
    <div v-if="isLoading" class="text-center py-12">
      <i class="fa-solid fa-spinner fa-spin text-4xl text-primary-600"></i>
    </div>
    
    <div v-else-if="excuse" class="max-w-2xl mx-auto">
      <div class="card">
        <div class="p-6 border-b border-gray-100">
          <div class="flex items-center justify-between">
            <h1 class="text-xl font-bold text-gray-900">공결 신청 상세</h1>
            <span :class="getStatusClass(excuse.status)">
              {{ getStatusLabel(excuse.status) }}
            </span>
          </div>
        </div>
        
        <div class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">강의</p>
              <p class="font-medium">{{ excuse.course_title }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">신청자</p>
              <p class="font-medium">{{ excuse.student_name }} ({{ excuse.student_id }})</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">공결 날짜</p>
              <p class="font-medium">{{ formatDate(excuse.excuse_date) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">공결 유형</p>
              <p class="font-medium">{{ excuse.excuse_type }}</p>
            </div>
          </div>
          
          <div>
            <p class="text-sm text-gray-500 mb-1">사유</p>
            <p class="bg-gray-50 rounded-lg p-4">{{ excuse.reason }}</p>
          </div>
          
          <!-- 첨부파일 -->
          <div v-if="excuse.attachments?.length > 0">
            <p class="text-sm text-gray-500 mb-2">첨부 파일</p>
            <div class="space-y-2">
              <a 
                v-for="att in excuse.attachments" 
                :key="att.id"
                :href="`/api/excuses/attachments/${att.id}/download`"
                class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <i class="fa-solid fa-file text-gray-400"></i>
                <span class="text-sm">{{ att.original_name }}</span>
              </a>
            </div>
          </div>
          
          <!-- 거절 사유 -->
          <div v-if="excuse.status === 'rejected' && excuse.reject_reason">
            <p class="text-sm text-gray-500 mb-1">거절 사유</p>
            <p class="bg-red-50 text-red-700 rounded-lg p-4">{{ excuse.reject_reason }}</p>
          </div>
          
          <!-- 처리 버튼 (교원/관리자) -->
          <div v-if="(authStore.isInstructor || authStore.isAdmin) && excuse.status === 'pending'" class="pt-4 border-t border-gray-100">
            <p class="text-sm text-gray-500 mb-2">처리</p>
            <div class="flex gap-3">
              <button @click="processExcuse('approved')" class="btn btn-success flex-1">
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
          <button @click="processExcuse('rejected')" class="btn btn-danger flex-1" :disabled="!rejectReason">
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

const excuse = ref(null)
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

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ko-KR')
}

const fetchExcuse = async () => {
  isLoading.value = true
  try {
    const response = await api.get(`/excuses/${route.params.id}`)
    if (response.success) {
      excuse.value = response.data
    }
  } catch (error) {
    console.error('공결 신청 조회 오류:', error)
  } finally {
    isLoading.value = false
  }
}

const processExcuse = async (status) => {
  try {
    await api.put(`/excuses/${excuse.value.id}/process`, {
      status,
      rejectReason: status === 'rejected' ? rejectReason.value : undefined
    })
    alert(status === 'approved' ? '승인되었습니다.' : '거절되었습니다.')
    router.push('/excuses')
  } catch (error) {
    alert(error.message || '처리에 실패했습니다.')
  }
}

onMounted(() => {
  fetchExcuse()
})
</script>
