<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">시스템 설정</h1>
      <p class="text-gray-600 mt-1">시스템 환경을 설정합니다</p>
    </div>
    
    <div v-if="isLoading" class="text-center py-12">
      <i class="fa-solid fa-spinner fa-spin text-4xl text-primary-600"></i>
    </div>
    
    <div v-else class="space-y-6">
      <!-- 출석 설정 -->
      <div class="card">
        <div class="p-6 border-b border-gray-100">
          <h2 class="text-lg font-bold text-gray-900">출석 설정</h2>
        </div>
        <div class="p-6 space-y-4">
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">지각 기준 (분)</label>
              <input 
                v-model.number="settings.lateThreshold" 
                type="number" 
                class="input"
                min="1"
                max="60"
              />
              <p class="text-xs text-gray-500 mt-1">출석 시작 후 이 시간 이내 체크인 시 지각 처리</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">출석 코드 만료 시간 (분)</label>
              <input 
                v-model.number="settings.codeExpireMinutes" 
                type="number" 
                class="input"
                min="1"
                max="60"
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- 공결 설정 -->
      <div class="card">
        <div class="p-6 border-b border-gray-100">
          <h2 class="text-lg font-bold text-gray-900">공결 설정</h2>
        </div>
        <div class="p-6 space-y-4">
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">공결 신청 기한 (일)</label>
              <input 
                v-model.number="settings.excuseDeadlineDays" 
                type="number" 
                class="input"
                min="1"
                max="30"
              />
              <p class="text-xs text-gray-500 mt-1">수업일 기준 N일 전까지 신청 가능</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">첨부 파일 최대 개수</label>
              <input 
                v-model.number="settings.maxAttachments" 
                type="number" 
                class="input"
                min="1"
                max="10"
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- 이의 신청 설정 -->
      <div class="card">
        <div class="p-6 border-b border-gray-100">
          <h2 class="text-lg font-bold text-gray-900">이의 신청 설정</h2>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">이의 신청 기한 (일)</label>
            <input 
              v-model.number="settings.appealDeadlineDays" 
              type="number" 
              class="input max-w-xs"
              min="1"
              max="30"
            />
            <p class="text-xs text-gray-500 mt-1">수업일 기준 N일 이내 신청 가능</p>
          </div>
        </div>
      </div>
      
      <!-- 알림 설정 -->
      <div class="card">
        <div class="p-6 border-b border-gray-100">
          <h2 class="text-lg font-bold text-gray-900">알림 설정</h2>
        </div>
        <div class="p-6 space-y-4">
          <label class="flex items-center gap-3">
            <input v-model="settings.enableEmailNotifications" type="checkbox" class="w-4 h-4" />
            <span class="text-sm text-gray-700">이메일 알림 활성화</span>
          </label>
          <label class="flex items-center gap-3">
            <input v-model="settings.enablePushNotifications" type="checkbox" class="w-4 h-4" />
            <span class="text-sm text-gray-700">푸시 알림 활성화</span>
          </label>
        </div>
      </div>
      
      <!-- 저장 버튼 -->
      <div class="flex justify-end">
        <button @click="saveSettings" class="btn btn-primary" :disabled="isSaving">
          <template v-if="isSaving">
            <i class="fa-solid fa-spinner fa-spin mr-2"></i>
            저장 중...
          </template>
          <template v-else>
            <i class="fa-solid fa-save mr-2"></i>
            설정 저장
          </template>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'

const isLoading = ref(true)
const isSaving = ref(false)

const settings = ref({
  lateThreshold: 10,
  codeExpireMinutes: 5,
  excuseDeadlineDays: 7,
  maxAttachments: 5,
  appealDeadlineDays: 7,
  enableEmailNotifications: true,
  enablePushNotifications: false
})

const fetchSettings = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/settings')
    if (response.success && response.data) {
      settings.value = { ...settings.value, ...response.data }
    }
  } catch (error) {
    console.error('설정 조회 오류:', error)
  } finally {
    isLoading.value = false
  }
}

const saveSettings = async () => {
  isSaving.value = true
  try {
    await api.put('/settings', settings.value)
    alert('설정이 저장되었습니다.')
  } catch (error) {
    alert(error.message || '저장에 실패했습니다.')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  fetchSettings()
})
</script>
