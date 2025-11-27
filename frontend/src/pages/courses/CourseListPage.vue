<template>
  <div>
    <!-- 페이지 헤더 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">강의 목록</h1>
        <p class="text-gray-600 mt-1">수강 중인 강의를 확인하세요</p>
      </div>
    </div>
    
    <!-- 필터 -->
    <div class="card p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <input
            v-model="search"
            type="text"
            class="input"
            placeholder="강의명 검색..."
          />
        </div>
        <select v-model="selectedGrade" class="input w-auto">
          <option value="">전체 학년</option>
          <option value="1">1학년</option>
          <option value="2">2학년</option>
          <option value="3">3학년</option>
          <option value="4">4학년</option>
        </select>
      </div>
    </div>
    
    <!-- 로딩 -->
    <div v-if="isLoading" class="text-center py-12">
      <i class="fa-solid fa-spinner fa-spin text-4xl text-primary-600"></i>
      <p class="mt-4 text-gray-600">강의를 불러오는 중...</p>
    </div>
    
    <!-- 강의 목록 -->
    <div v-else-if="filteredCourses.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div 
        v-for="course in filteredCourses" 
        :key="course.id"
        class="card hover:shadow-md transition-shadow"
      >
        <div class="p-5">
          <div class="flex items-start justify-between mb-3">
            <span class="badge badge-info">{{ course.grade }}학년</span>
            <span class="text-sm text-gray-500">{{ course.instructor_names }}</span>
          </div>
          <h3 class="font-semibold text-lg text-gray-900 mb-2">{{ course.title }}</h3>
          <p class="text-sm text-gray-500 mb-4">
            <i class="fa-solid fa-clock mr-1"></i>
            {{ formatSchedule(course.schedules) }}
          </p>
          <div class="flex gap-2">
            <router-link 
              :to="`/courses/${course.id}`"
              class="btn btn-secondary flex-1"
            >
              <i class="fa-solid fa-info-circle mr-1"></i>
              상세
            </router-link>
            <router-link 
              :to="`/courses/${course.id}/attendance`"
              class="btn btn-primary flex-1"
            >
              <i class="fa-solid fa-user-check mr-1"></i>
              출석
            </router-link>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 빈 상태 -->
    <div v-else class="text-center py-12">
      <i class="fa-solid fa-book-open text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-600">강의가 없습니다.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api'

const courses = ref([])
const isLoading = ref(true)
const search = ref('')
const selectedGrade = ref('')

const filteredCourses = computed(() => {
  return courses.value.filter(course => {
    const matchSearch = !search.value || 
      course.title.toLowerCase().includes(search.value.toLowerCase())
    const matchGrade = !selectedGrade.value || 
      course.grade === parseInt(selectedGrade.value)
    return matchSearch && matchGrade
  })
})

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

const fetchCourses = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/courses')
    if (response.success) {
      courses.value = response.data
    }
  } catch (error) {
    console.error('강의 목록 조회 오류:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchCourses()
})
</script>
