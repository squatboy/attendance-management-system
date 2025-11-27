<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">감사 로그</h1>
      <p class="text-gray-600 mt-1">시스템 활동 기록을 조회합니다</p>
    </div>
    
    <!-- 필터 -->
    <div class="card p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <input 
          v-model="filter.search" 
          type="text" 
          placeholder="사용자 검색..." 
          class="input flex-1"
        />
        <select v-model="filter.action" class="input w-auto">
          <option value="">전체 액션</option>
          <option value="login">로그인</option>
          <option value="logout">로그아웃</option>
          <option value="attendance_start">출석 시작</option>
          <option value="attendance_check">출석 체크</option>
          <option value="excuse_create">공결 신청</option>
          <option value="appeal_create">이의 신청</option>
        </select>
        <input v-model="filter.startDate" type="date" class="input w-auto" />
        <input v-model="filter.endDate" type="date" class="input w-auto" />
        <button @click="fetchLogs" class="btn btn-primary">
          <i class="fa-solid fa-search mr-2"></i>
          검색
        </button>
      </div>
    </div>
    
    <div v-if="isLoading" class="text-center py-12">
      <i class="fa-solid fa-spinner fa-spin text-4xl text-primary-600"></i>
    </div>
    
    <div v-else class="card overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시간</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상세</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="log in logs" :key="log.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDateTime(log.created_at) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ log.user_name }}</div>
              <div class="text-sm text-gray-500">{{ log.student_id }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="getActionBadge(log.action)">{{ getActionLabel(log.action) }}</span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
              {{ log.details }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ log.ip_address }}
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="logs.length === 0" class="p-12 text-center">
        <i class="fa-solid fa-clipboard-list text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-600">로그가 없습니다.</p>
      </div>
      
      <!-- 페이지네이션 -->
      <div v-if="totalPages > 1" class="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-500">총 {{ totalCount }}건</p>
          <div class="flex gap-2">
            <button 
              @click="page--" 
              :disabled="page === 1"
              class="btn btn-secondary btn-sm"
            >
              이전
            </button>
            <span class="px-3 py-1 text-sm">{{ page }} / {{ totalPages }}</span>
            <button 
              @click="page++"
              :disabled="page === totalPages"
              class="btn btn-secondary btn-sm"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import api from '@/api'

const logs = ref([])
const isLoading = ref(true)
const page = ref(1)
const totalCount = ref(0)
const totalPages = ref(1)

const filter = ref({
  search: '',
  action: '',
  startDate: '',
  endDate: ''
})

const getActionLabel = (action) => {
  const labels = {
    login: '로그인',
    logout: '로그아웃',
    attendance_start: '출석 시작',
    attendance_end: '출석 종료',
    attendance_check: '출석 체크',
    excuse_create: '공결 신청',
    excuse_process: '공결 처리',
    appeal_create: '이의 신청',
    appeal_process: '이의 처리',
    user_create: '사용자 생성',
    user_update: '사용자 수정',
    settings_update: '설정 변경'
  }
  return labels[action] || action
}

const getActionBadge = (action) => {
  if (action.includes('login') || action.includes('logout')) return 'badge badge-info'
  if (action.includes('attendance')) return 'badge badge-success'
  if (action.includes('excuse') || action.includes('appeal')) return 'badge badge-warning'
  if (action.includes('user') || action.includes('settings')) return 'badge badge-danger'
  return 'badge badge-gray'
}

const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('ko-KR')
}

const fetchLogs = async () => {
  isLoading.value = true
  try {
    const params = new URLSearchParams()
    if (filter.value.search) params.append('search', filter.value.search)
    if (filter.value.action) params.append('action', filter.value.action)
    if (filter.value.startDate) params.append('startDate', filter.value.startDate)
    if (filter.value.endDate) params.append('endDate', filter.value.endDate)
    params.append('page', page.value)
    params.append('limit', 50)
    
    const response = await api.get(`/audit-logs?${params}`)
    if (response.success) {
      logs.value = response.data.logs
      totalCount.value = response.data.total
      totalPages.value = response.data.totalPages
    }
  } catch (error) {
    console.error('감사 로그 조회 오류:', error)
  } finally {
    isLoading.value = false
  }
}

watch(page, () => {
  fetchLogs()
})

onMounted(() => {
  fetchLogs()
})
</script>
