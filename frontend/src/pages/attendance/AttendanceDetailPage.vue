<template>
  <div>
    <router-link :to="`/courses/${session?.course_id}/attendance`" class="text-gray-600 hover:text-gray-900 mb-4 inline-block">
      <i class="fa-solid fa-arrow-left mr-2"></i>
      출석 현황
    </router-link>
    
    <div v-if="isLoading" class="text-center py-12">
      <i class="fa-solid fa-spinner fa-spin text-4xl text-primary-600"></i>
    </div>
    
    <div v-else-if="session">
      <!-- 세션 정보 -->
      <div class="card mb-6">
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">{{ session.course_title }}</h1>
              <p class="text-gray-600 mt-1">
                {{ formatDate(session.session_date) }} {{ session.period }}교시
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span 
                class="badge"
                :class="session.status === 'active' ? 'badge-success' : 'badge-gray'"
              >
                {{ session.status === 'active' ? '진행 중' : '종료' }}
              </span>
            </div>
          </div>
          
          <!-- 코드 표시 (코드 방식이고 진행 중일 때) -->
          <div v-if="session.attendance_type === 'code' && session.status === 'active'" class="bg-primary-50 rounded-lg p-6 mb-4">
            <p class="text-sm text-primary-600 mb-2">출석 코드</p>
            <p class="text-5xl font-mono font-bold text-primary-700 tracking-widest">
              {{ session.attendance_code }}
            </p>
            <p class="text-sm text-primary-600 mt-2">
              만료: {{ formatTime(session.code_expires_at) }}
            </p>
            <div class="flex gap-2 mt-4">
              <button @click="refreshCode" class="btn btn-primary btn-sm">
                <i class="fa-solid fa-rotate mr-1"></i>
                코드 갱신
              </button>
              <button @click="closeSession" class="btn btn-danger btn-sm">
                <i class="fa-solid fa-stop mr-1"></i>
                출석 종료
              </button>
            </div>
          </div>
          
          <!-- 호명 방식이고 진행 중일 때 -->
          <div v-if="session.attendance_type === 'rollcall' && session.status === 'active'" class="mb-4">
            <button @click="closeSession" class="btn btn-danger">
              <i class="fa-solid fa-stop mr-2"></i>
              출석 종료
            </button>
          </div>
          
          <!-- 통계 -->
          <div class="grid grid-cols-4 gap-4">
            <div class="text-center p-3 bg-gray-50 rounded-lg">
              <p class="text-2xl font-bold text-gray-900">{{ attendances.length }}</p>
              <p class="text-sm text-gray-500">전체</p>
            </div>
            <div class="text-center p-3 bg-green-50 rounded-lg">
              <p class="text-2xl font-bold text-green-600">{{ presentCount }}</p>
              <p class="text-sm text-gray-500">출석</p>
            </div>
            <div class="text-center p-3 bg-yellow-50 rounded-lg">
              <p class="text-2xl font-bold text-yellow-600">{{ lateCount }}</p>
              <p class="text-sm text-gray-500">지각</p>
            </div>
            <div class="text-center p-3 bg-red-50 rounded-lg">
              <p class="text-2xl font-bold text-red-600">{{ absentCount }}</p>
              <p class="text-sm text-gray-500">결석</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 출석 명단 -->
      <div class="card">
        <div class="p-5 border-b border-gray-100">
          <h2 class="font-semibold text-gray-900">출석 명단</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">학번</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">이름</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">상태</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">체크 시간</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">작업</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="att in attendances" :key="att.id">
                <td class="px-4 py-3 text-sm">{{ att.student_id }}</td>
                <td class="px-4 py-3 text-sm font-medium">{{ att.name }}</td>
                <td class="px-4 py-3">
                  <span :class="getStatusClass(att.status)">
                    {{ getStatusLabel(att.status) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-500">
                  {{ att.checked_at ? formatTime(att.checked_at) : '-' }}
                </td>
                <td class="px-4 py-3">
                  <select 
                    v-if="authStore.isInstructor || authStore.isAdmin"
                    :value="att.status"
                    @change="updateStatus(att.student_id, $event.target.value)"
                    class="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="present">출석</option>
                    <option value="late">지각</option>
                    <option value="absent">결석</option>
                    <option value="excused">공결</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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

const session = ref(null)
const attendances = ref([])
const isLoading = ref(true)

const presentCount = computed(() => attendances.value.filter(a => a.status === 'present').length)
const lateCount = computed(() => attendances.value.filter(a => a.status === 'late').length)
const absentCount = computed(() => attendances.value.filter(a => a.status === 'absent').length)

const getStatusClass = (status) => {
  const classes = {
    present: 'badge badge-success',
    late: 'badge badge-warning',
    absent: 'badge badge-danger',
    excused: 'badge badge-info'
  }
  return classes[status] || 'badge badge-gray'
}

const getStatusLabel = (status) => {
  const labels = {
    present: '출석',
    late: '지각',
    absent: '결석',
    excused: '공결'
  }
  return labels[status] || status
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchSession = async () => {
  const sessionId = route.params.sessionId
  isLoading.value = true
  
  try {
    const response = await api.get(`/sessions/${sessionId}`)
    if (response.success) {
      session.value = response.data
      attendances.value = response.data.attendances || []
    }
  } catch (error) {
    console.error('세션 조회 오류:', error)
  } finally {
    isLoading.value = false
  }
}

const refreshCode = async () => {
  try {
    const response = await api.post(`/sessions/${session.value.id}/refresh-code`)
    if (response.success) {
      session.value.attendance_code = response.data.attendanceCode
      session.value.code_expires_at = response.data.codeExpiresAt
    }
  } catch (error) {
    alert(error.message || '코드 갱신에 실패했습니다.')
  }
}

const closeSession = async () => {
  if (!confirm('출석을 종료하시겠습니까?')) return
  
  try {
    await api.post(`/sessions/${session.value.id}/close`)
    session.value.status = 'closed'
    alert('출석이 종료되었습니다.')
  } catch (error) {
    alert(error.message || '출석 종료에 실패했습니다.')
  }
}

const updateStatus = async (studentId, status) => {
  try {
    await api.put(`/sessions/${session.value.id}/attendance/${studentId}`, { status })
    const att = attendances.value.find(a => a.student_id === studentId)
    if (att) att.status = status
  } catch (error) {
    alert(error.message || '상태 변경에 실패했습니다.')
  }
}

onMounted(() => {
  fetchSession()
})
</script>
