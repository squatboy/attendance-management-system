<template>
  <div>
    <!-- 뒤로가기 -->
    <router-link to="/courses" class="text-gray-600 hover:text-gray-900 mb-4 inline-block">
      <i class="fa-solid fa-arrow-left mr-2"></i>
      강의 목록
    </router-link>
    
    <div v-if="isLoading" class="text-center py-12">
      <i class="fa-solid fa-spinner fa-spin text-4xl text-primary-600"></i>
    </div>
    
    <div v-else-if="course">
      <!-- 강의 정보 -->
      <div class="card mb-6">
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div>
              <span class="badge badge-info mb-2">{{ course.grade }}학년</span>
              <h1 class="text-2xl font-bold text-gray-900">{{ course.title }}</h1>
            </div>
            <router-link 
              v-if="authStore.isInstructor || authStore.isAdmin"
              :to="`/courses/${course.id}/attendance/start`"
              class="btn btn-primary"
            >
              <i class="fa-solid fa-play mr-2"></i>
              출석 시작
            </router-link>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-user text-gray-400 w-5"></i>
              <span class="text-gray-600">담당 교원:</span>
              <span class="font-medium">{{ course.instructor_names }}</span>
            </div>
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-building text-gray-400 w-5"></i>
              <span class="text-gray-600">학과:</span>
              <span class="font-medium">{{ course.department }}</span>
            </div>
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-clock text-gray-400 w-5"></i>
              <span class="text-gray-600">수업 시간:</span>
              <span class="font-medium">{{ formatSchedule(course.schedules) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-location-dot text-gray-400 w-5"></i>
              <span class="text-gray-600">강의실:</span>
              <span class="font-medium">{{ course.schedules?.[0]?.room || '-' }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 탭 -->
      <div class="card">
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px">
            <button
              @click="activeTab = 'attendance'"
              class="px-6 py-4 text-sm font-medium border-b-2 transition-colors"
              :class="activeTab === 'attendance' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'"
            >
              <i class="fa-solid fa-user-check mr-2"></i>
              출석 현황
            </button>
            <button
              v-if="authStore.isInstructor || authStore.isAdmin"
              @click="activeTab = 'students'"
              class="px-6 py-4 text-sm font-medium border-b-2 transition-colors"
              :class="activeTab === 'students' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'"
            >
              <i class="fa-solid fa-users mr-2"></i>
              수강생 목록
            </button>
          </nav>
        </div>
        
        <div class="p-6">
          <!-- 출석 현황 탭 -->
          <div v-if="activeTab === 'attendance'">
            <div v-if="sessions.length === 0" class="text-center py-8 text-gray-500">
              <i class="fa-solid fa-calendar-xmark text-4xl mb-3"></i>
              <p>출석 기록이 없습니다.</p>
            </div>
            <div v-else class="space-y-3">
              <div 
                v-for="session in sessions" 
                :key="session.id"
                class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <p class="font-medium text-gray-900">
                      {{ formatDate(session.session_date) }} {{ session.period }}교시
                    </p>
                    <span 
                      class="badge"
                      :class="session.status === 'active' ? 'badge-success' : 'badge-gray'"
                    >
                      {{ session.status === 'active' ? '진행 중' : '종료' }}
                    </span>
                  </div>
                  <div class="flex gap-4 mt-1 text-sm">
                    <span class="text-green-600">출석 {{ session.present_count }}</span>
                    <span class="text-yellow-600">지각 {{ session.late_count }}</span>
                    <span class="text-red-600">결석 {{ session.absent_count }}</span>
                  </div>
                </div>
                <div class="flex gap-2">
                  <!-- 학생: 진행 중인 출석만 코드 입력 가능 -->
                  <router-link 
                    v-if="authStore.isStudent && session.status === 'active' && session.attendance_type === 'code'"
                    :to="`/attendance/check-in/${session.id}`"
                    class="btn btn-primary btn-sm"
                  >
                    <i class="fa-solid fa-keyboard mr-1"></i>
                    코드 입력
                  </router-link>
                  <!-- 교원/관리자: 상세 보기 -->
                  <router-link 
                    v-if="authStore.isInstructor || authStore.isAdmin"
                    :to="`/courses/${course.id}/attendance/${session.id}`"
                    class="btn btn-secondary btn-sm"
                  >
                    상세
                  </router-link>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 수강생 탭 -->
          <div v-if="activeTab === 'students'">
            <div v-if="students.length === 0" class="text-center py-8 text-gray-500">
              <i class="fa-solid fa-user-slash text-4xl mb-3"></i>
              <p>수강생이 없습니다.</p>
            </div>
            <table v-else class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">학번</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">이름</th>
                  <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">학년</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="student in students" :key="student.id">
                  <td class="px-4 py-3 text-sm">{{ student.student_id }}</td>
                  <td class="px-4 py-3 text-sm font-medium">{{ student.name }}</td>
                  <td class="px-4 py-3 text-sm">{{ student.grade }}학년</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'

const route = useRoute()
const authStore = useAuthStore()

const course = ref(null)
const sessions = ref([])
const students = ref([])
const isLoading = ref(true)
const activeTab = ref('attendance')

const formatSchedule = (schedules) => {
  if (!schedules || schedules.length === 0) return '시간 미정'
  
  const grouped = schedules.reduce((acc, s) => {
    if (!acc[s.day_of_week]) acc[s.day_of_week] = []
    acc[s.day_of_week].push(s.period)
    return acc
  }, {})
  
  return Object.entries(grouped)
    .map(([day, periods]) => `${day}${periods.sort().join(',')}`)
    .join(' / ')
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const fetchData = async () => {
  const courseId = route.params.id
  isLoading.value = true
  
  try {
    // 강의 정보
    const courseRes = await api.get(`/courses/${courseId}`)
    if (courseRes.success) {
      course.value = courseRes.data
    }
    
    // 출석 세션 목록
    const sessionsRes = await api.get(`/sessions/course/${courseId}`)
    if (sessionsRes.success) {
      sessions.value = sessionsRes.data
    }
    
    // 수강생 목록 (교원/관리자만)
    if (authStore.isInstructor || authStore.isAdmin) {
      const studentsRes = await api.get(`/courses/${courseId}/students`)
      if (studentsRes.success) {
        students.value = studentsRes.data
      }
    }
  } catch (error) {
    console.error('데이터 로드 오류:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>
