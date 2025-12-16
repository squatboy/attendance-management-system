<template>
  <div>
    <router-link to="/appeals" class="text-gray-600 hover:text-gray-900 mb-4 inline-block">
      <i class="fa-solid fa-arrow-left mr-2"></i>
      이의 신청 목록
    </router-link>
    
    <div class="max-w-2xl mx-auto">
      <div class="card p-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-6">이의 신청</h1>
        
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- 강의 선택 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">강의</label>
            <select v-model="form.courseId" class="input" @change="fetchSessions" required>
              <option value="">강의를 선택하세요</option>
              <option v-for="course in courses" :key="course.id" :value="course.id">
                {{ course.title }}
              </option>
            </select>
          </div>
          
          <!-- 세션 선택 -->
          <div v-if="form.courseId">
            <label class="block text-sm font-medium text-gray-700 mb-1">수업 일시</label>
            <select v-model="form.sessionId" class="input" @change="updateCurrentStatus" required>
              <option value="">수업을 선택하세요</option>
              <option v-for="session in sessions" :key="session.id" :value="session.id">
                {{ formatDate(session.session_date) }} {{ session.period }}교시 - {{ getAttendanceLabel(session.my_status) }}
              </option>
            </select>
          </div>
          
          <!-- 현재 상태 -->
          <div v-if="currentStatus">
            <label class="block text-sm font-medium text-gray-700 mb-1">현재 출석 상태</label>
            <div class="p-3 bg-gray-50 rounded-lg">
              <span :class="getStatusBadge(currentStatus)">{{ getAttendanceLabel(currentStatus) }}</span>
            </div>
          </div>
          
          <!-- 요청 상태 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">변경 요청 상태</label>
            <select v-model="form.requestedStatus" class="input" required>
              <option value="">상태를 선택하세요</option>
              <option value="present">출석</option>
              <option value="late">지각</option>
              <option value="excused">공결</option>
            </select>
          </div>
          
          <!-- 사유 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">이의 사유</label>
            <textarea
              v-model="form.reason"
              class="input min-h-[120px]"
              placeholder="이의 신청 사유를 상세히 입력하세요"
              required
            ></textarea>
          </div>
          
          <!-- 제출 버튼 -->
          <div class="flex gap-3">
            <button
              type="submit"
              class="btn btn-primary flex-1"
              :disabled="isSubmitting"
            >
              <template v-if="isSubmitting">
                <i class="fa-solid fa-spinner fa-spin mr-2"></i>
                제출 중...
              </template>
              <template v-else>
                <i class="fa-solid fa-paper-plane mr-2"></i>
                신청하기
              </template>
            </button>
            <router-link to="/appeals" class="btn btn-secondary">취소</router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'

const router = useRouter()

const courses = ref([])
const sessions = ref([])
const form = ref({
  courseId: '',
  sessionId: '',
  requestedStatus: '',
  reason: ''
})
const currentStatus = ref('')
const isSubmitting = ref(false)

const getAttendanceLabel = (status) => {
  const labels = {
    present: '출석',
    late: '지각',
    absent: '결석',
    excused: '공결'
  }
  return labels[status] || status
}

const getStatusBadge = (status) => {
  const classes = {
    present: 'badge badge-success',
    late: 'badge badge-warning',
    absent: 'badge badge-danger',
    excused: 'badge badge-info'
  }
  return classes[status] || 'badge badge-gray'
}

const formatDate = (dateString) => {
  if (!dateString) return 'Invalid Date'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid Date'
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const fetchCourses = async () => {
  try {
    const response = await api.get('/courses')
    if (response.success) {
      courses.value = response.data
    }
  } catch (error) {
    console.error('강의 목록 조회 오류:', error)
  }
}

const fetchSessions = async () => {
  if (!form.value.courseId) return
  
  try {
    const response = await api.get(`/sessions/course/${form.value.courseId}/my-attendance`)
    if (response.success) {
      sessions.value = response.data
    }
  } catch (error) {
    console.error('세션 목록 조회 오류:', error)
  }
}

const updateCurrentStatus = () => {
  const session = sessions.value.find(s => s.id === parseInt(form.value.sessionId))
  currentStatus.value = session?.my_status || ''
}

const handleSubmit = async () => {
  isSubmitting.value = true
  
  try {
    const response = await api.post('/appeals', {
      sessionId: form.value.sessionId,
      requestedStatus: form.value.requestedStatus,
      reason: form.value.reason
    })
    
    if (response.success) {
      alert('이의 신청이 완료되었습니다.')
      router.push('/appeals')
    }
  } catch (error) {
    alert(error.message || '이의 신청에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchCourses()
})
</script>
