<template>
  <div>
    <!-- 페이지 헤더 -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">대시보드</h1>
      <p class="text-gray-600 mt-1">{{ greeting }}, {{ authStore.user?.name }}님!</p>
    </div>
    
    <!-- 통계 카드 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">수강 강의</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.courseCount }}</p>
          </div>
          <div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
            <i class="fa-solid fa-book text-primary-600 text-xl"></i>
          </div>
        </div>
      </div>
      
      <div class="card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">출석률</p>
            <p class="text-2xl font-bold text-green-600">{{ stats.attendanceRate }}%</p>
          </div>
          <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <i class="fa-solid fa-chart-line text-green-600 text-xl"></i>
          </div>
        </div>
      </div>
      
      <div class="card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">결석</p>
            <p class="text-2xl font-bold text-red-600">{{ stats.absentCount }}</p>
          </div>
          <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <i class="fa-solid fa-xmark text-red-600 text-xl"></i>
          </div>
        </div>
      </div>
      
      <div class="card p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">대기 중 알림</p>
            <p class="text-2xl font-bold text-yellow-600">{{ stats.pendingCount }}</p>
          </div>
          <div class="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
            <i class="fa-solid fa-bell text-yellow-600 text-xl"></i>
          </div>
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 오늘의 수업 -->
      <div class="card">
        <div class="p-5 border-b border-gray-100">
          <h2 class="font-semibold text-gray-900">
            <i class="fa-solid fa-calendar-day mr-2 text-primary-600"></i>
            오늘의 수업
          </h2>
        </div>
        <div class="p-5">
          <div v-if="todayClasses.length === 0" class="text-center py-8 text-gray-500">
            <i class="fa-solid fa-calendar-xmark text-4xl mb-3"></i>
            <p>오늘은 수업이 없습니다.</p>
          </div>
          <div v-else class="space-y-3">
            <div 
              v-for="cls in todayClasses" 
              :key="cls.id"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <span class="text-sm font-bold text-primary-600">{{ cls.period }}교시</span>
                </div>
                <div>
                  <p class="font-medium text-gray-900">{{ cls.title }}</p>
                  <p class="text-sm text-gray-500">{{ cls.room }}</p>
                </div>
              </div>
              <router-link 
                v-if="authStore.isStudent"
                :to="`/courses/${cls.id}`"
                class="btn btn-primary btn-sm"
              >
                출석
              </router-link>
              <router-link 
                v-if="authStore.isInstructor"
                :to="`/courses/${cls.id}/attendance/start`"
                class="btn btn-primary btn-sm"
              >
                출석 시작
              </router-link>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 최근 알림 -->
      <div class="card">
        <div class="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900">
            <i class="fa-solid fa-bell mr-2 text-primary-600"></i>
            최근 알림
          </h2>
          <router-link to="/notifications" class="text-sm text-primary-600 hover:underline">
            모두 보기
          </router-link>
        </div>
        <div class="p-5">
          <div v-if="recentNotifications.length === 0" class="text-center py-8 text-gray-500">
            <i class="fa-solid fa-bell-slash text-4xl mb-3"></i>
            <p>새로운 알림이 없습니다.</p>
          </div>
          <div v-else class="space-y-3">
            <div 
              v-for="notification in recentNotifications" 
              :key="notification.id"
              class="flex items-start gap-3 p-3 rounded-lg"
              :class="notification.is_read ? 'bg-white' : 'bg-blue-50'"
            >
              <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <i :class="getNotificationIcon(notification.type)" class="text-gray-600"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900">{{ notification.title }}</p>
                <p class="text-sm text-gray-500 truncate">{{ notification.message }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ formatTime(notification.created_at) }}</p>
              </div>
            </div>
          </div>
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

const stats = ref({
  courseCount: 0,
  attendanceRate: 0,
  absentCount: 0,
  pendingCount: 0
})

const todayClasses = ref([])
const recentNotifications = ref([])

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '좋은 아침이에요'
  if (hour < 18) return '좋은 오후에요'
  return '좋은 저녁이에요'
})

const getNotificationIcon = (type) => {
  const icons = {
    'excuse_request': 'fa-solid fa-file-lines',
    'excuse_processed': 'fa-solid fa-check-circle',
    'appeal_request': 'fa-solid fa-flag',
    'appeal_processed': 'fa-solid fa-gavel',
    'message': 'fa-solid fa-envelope',
    'attendance': 'fa-solid fa-user-check'
  }
  return icons[type] || 'fa-solid fa-bell'
}

const formatTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '방금 전'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`
  return date.toLocaleDateString('ko-KR')
}

const fetchDashboardData = async () => {
  try {
    // 강의 목록
    const coursesRes = await api.get('/courses')
    if (coursesRes.success) {
      stats.value.courseCount = coursesRes.data.length
      
      // 오늘 요일 계산
      const days = ['일', '월', '화', '수', '목', '금', '토']
      const today = days[new Date().getDay()]
      
      // 오늘 수업 필터링
      todayClasses.value = coursesRes.data
        .filter(course => course.schedules?.some(s => s.day_of_week === today))
        .map(course => {
          const todaySchedule = course.schedules.find(s => s.day_of_week === today)
          return {
            id: course.id,
            title: course.title,
            period: todaySchedule?.period,
            room: todaySchedule?.room
          }
        })
        .sort((a, b) => a.period - b.period)
    }
    
    // 알림 목록
    const notifRes = await api.get('/notifications', { params: { limit: 5 } })
    if (notifRes.success) {
      recentNotifications.value = notifRes.data.notifications
      stats.value.pendingCount = notifRes.data.unreadCount
    }
  } catch (error) {
    console.error('대시보드 데이터 로드 오류:', error)
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>
