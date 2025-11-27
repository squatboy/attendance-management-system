<template>
  <div>
    <router-link :to="`/courses/${courseId}`" class="text-gray-600 hover:text-gray-900 mb-4 inline-block">
      <i class="fa-solid fa-arrow-left mr-2"></i>
      강의 상세
    </router-link>
    
    <h1 class="text-2xl font-bold text-gray-900 mb-6">출석 현황</h1>
    
    <div v-if="isLoading" class="text-center py-12">
      <i class="fa-solid fa-spinner fa-spin text-4xl text-primary-600"></i>
    </div>
    
    <div v-else-if="sessions.length === 0" class="card p-12 text-center">
      <i class="fa-solid fa-calendar-xmark text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-600">출석 기록이 없습니다.</p>
    </div>
    
    <div v-else class="space-y-4">
      <div 
        v-for="session in sessions" 
        :key="session.id"
        class="card p-5"
      >
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span 
                class="badge"
                :class="session.status === 'active' ? 'badge-success' : 'badge-gray'"
              >
                {{ session.status === 'active' ? '진행 중' : '종료' }}
              </span>
              <span class="badge badge-info">
                {{ session.attendance_type === 'code' ? '코드 입력' : '호명' }}
              </span>
            </div>
            <p class="font-medium text-gray-900">
              {{ formatDate(session.session_date) }} {{ session.period }}교시
            </p>
            <div class="flex gap-4 mt-2 text-sm">
              <span class="text-green-600">
                <i class="fa-solid fa-check mr-1"></i>
                출석 {{ session.present_count || 0 }}
              </span>
              <span class="text-yellow-600">
                <i class="fa-solid fa-clock mr-1"></i>
                지각 {{ session.late_count || 0 }}
              </span>
              <span class="text-red-600">
                <i class="fa-solid fa-xmark mr-1"></i>
                결석 {{ session.absent_count || 0 }}
              </span>
            </div>
          </div>
          <router-link 
            :to="`/courses/${courseId}/attendance/${session.id}`"
            class="btn btn-primary"
          >
            <i class="fa-solid fa-eye mr-2"></i>
            상세 보기
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api'

const route = useRoute()
const courseId = computed(() => route.params.courseId)

const sessions = ref([])
const isLoading = ref(true)

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const fetchSessions = async () => {
  isLoading.value = true
  try {
    const response = await api.get(`/sessions/course/${courseId.value}`)
    if (response.success) {
      sessions.value = response.data
    }
  } catch (error) {
    console.error('세션 목록 조회 오류:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchSessions()
})
</script>
