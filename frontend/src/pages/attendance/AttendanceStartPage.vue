<template>
  <div>
    <router-link :to="`/courses/${courseId}`" class="text-gray-600 hover:text-gray-900 mb-4 inline-block">
      <i class="fa-solid fa-arrow-left mr-2"></i>
      강의 상세
    </router-link>
    
    <div class="max-w-2xl mx-auto">
      <div class="card p-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-6">출석 시작</h1>
        
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- 수업 날짜 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">수업 날짜</label>
            <input
              v-model="form.sessionDate"
              type="date"
              class="input"
              required
            />
          </div>
          
          <!-- 교시 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">교시</label>
            <select v-model="form.period" class="input" required>
              <option value="">선택하세요</option>
              <option v-for="p in 12" :key="p" :value="p">{{ p }}교시 ({{ getPeriodTime(p) }})</option>
            </select>
          </div>
          
          <!-- 출석 방식 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">출석 방식</label>
            <div class="grid grid-cols-2 gap-4">
              <label 
                class="flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors"
                :class="form.attendanceType === 'code' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'"
              >
                <input type="radio" v-model="form.attendanceType" value="code" class="sr-only" />
                <i class="fa-solid fa-keyboard text-3xl mb-2" :class="form.attendanceType === 'code' ? 'text-primary-600' : 'text-gray-400'"></i>
                <span class="font-medium">코드 입력</span>
                <span class="text-xs text-gray-500">6자리 코드 발급</span>
              </label>
              <label 
                class="flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors"
                :class="form.attendanceType === 'rollcall' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'"
              >
                <input type="radio" v-model="form.attendanceType" value="rollcall" class="sr-only" />
                <i class="fa-solid fa-bullhorn text-3xl mb-2" :class="form.attendanceType === 'rollcall' ? 'text-primary-600' : 'text-gray-400'"></i>
                <span class="font-medium">호명</span>
                <span class="text-xs text-gray-500">직접 출석 체크</span>
              </label>
            </div>
          </div>
          
          <!-- 코드 만료 시간 (코드 입력 방식일 때만) -->
          <div v-if="form.attendanceType === 'code'">
            <label class="block text-sm font-medium text-gray-700 mb-1">코드 유효 시간 (분)</label>
            <select v-model="form.codeExpiryMinutes" class="input">
              <option :value="3">3분</option>
              <option :value="5">5분</option>
              <option :value="10">10분</option>
              <option :value="15">15분</option>
            </select>
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
                처리 중...
              </template>
              <template v-else>
                <i class="fa-solid fa-play mr-2"></i>
                출석 시작
              </template>
            </button>
            <router-link :to="`/courses/${courseId}`" class="btn btn-secondary">
              취소
            </router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'

const route = useRoute()
const router = useRouter()

const courseId = computed(() => route.params.courseId)

const form = ref({
  sessionDate: new Date().toISOString().split('T')[0],
  period: '',
  attendanceType: 'code',
  codeExpiryMinutes: 5
})

const isSubmitting = ref(false)

const getPeriodTime = (period) => {
  const hour = 8 + period
  return `${hour.toString().padStart(2, '0')}:00`
}

const handleSubmit = async () => {
  isSubmitting.value = true
  
  try {
    const response = await api.post(`/sessions/course/${courseId.value}`, form.value)
    if (response.success) {
      alert('출석이 시작되었습니다.')
      router.push(`/courses/${courseId.value}/attendance/${response.data.id}`)
    }
  } catch (error) {
    alert(error.message || '출석 시작에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}
</script>
