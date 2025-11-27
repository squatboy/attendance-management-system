<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <div class="card p-6">
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
            <i class="fa-solid fa-user-check text-3xl text-primary-600"></i>
          </div>
          <h1 class="text-2xl font-bold text-gray-900">출석 체크</h1>
          <p class="text-gray-600 mt-1">6자리 출석 코드를 입력하세요</p>
        </div>
        
        <form @submit.prevent="handleCheckIn" class="space-y-6">
          <!-- 에러 메시지 -->
          <div 
            v-if="errorMessage" 
            class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm"
          >
            <i class="fa-solid fa-circle-exclamation mr-2"></i>
            {{ errorMessage }}
          </div>
          
          <!-- 성공 메시지 -->
          <div 
            v-if="successMessage" 
            class="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm"
          >
            <i class="fa-solid fa-check-circle mr-2"></i>
            {{ successMessage }}
          </div>
          
          <!-- 코드 입력 -->
          <div class="flex justify-center gap-2">
            <input
              v-for="(digit, index) in 6"
              :key="index"
              :ref="el => codeInputs[index] = el"
              type="text"
              maxlength="1"
              class="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
              @input="handleInput(index, $event)"
              @keydown="handleKeydown(index, $event)"
              @paste="handlePaste"
            />
          </div>
          
          <button
            type="submit"
            class="btn btn-primary w-full py-3"
            :disabled="isSubmitting || code.length !== 6"
          >
            <template v-if="isSubmitting">
              <i class="fa-solid fa-spinner fa-spin mr-2"></i>
              확인 중...
            </template>
            <template v-else>
              <i class="fa-solid fa-check mr-2"></i>
              출석 체크
            </template>
          </button>
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

const codeInputs = ref([])
const codeDigits = ref(['', '', '', '', '', ''])
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const code = computed(() => codeDigits.value.join(''))

const handleInput = (index, event) => {
  const value = event.target.value.replace(/[^0-9]/g, '')
  codeDigits.value[index] = value
  
  // 다음 입력으로 이동
  if (value && index < 5) {
    codeInputs.value[index + 1]?.focus()
  }
}

const handleKeydown = (index, event) => {
  // 백스페이스로 이전 입력으로 이동
  if (event.key === 'Backspace' && !codeDigits.value[index] && index > 0) {
    codeInputs.value[index - 1]?.focus()
  }
}

const handlePaste = (event) => {
  event.preventDefault()
  const pastedText = event.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
  
  pastedText.split('').forEach((char, index) => {
    if (index < 6) {
      codeDigits.value[index] = char
      if (codeInputs.value[index]) {
        codeInputs.value[index].value = char
      }
    }
  })
  
  // 마지막 입력으로 포커스
  const lastIndex = Math.min(pastedText.length, 5)
  codeInputs.value[lastIndex]?.focus()
}

const handleCheckIn = async () => {
  if (code.value.length !== 6) return
  
  errorMessage.value = ''
  successMessage.value = ''
  isSubmitting.value = true
  
  try {
    const response = await api.post(`/sessions/${route.params.sessionId}/check-in`, {
      code: code.value
    })
    
    if (response.success) {
      successMessage.value = '출석이 완료되었습니다!'
      setTimeout(() => {
        router.push('/courses')
      }, 2000)
    }
  } catch (error) {
    errorMessage.value = error.message || '출석 체크에 실패했습니다.'
    // 입력 초기화
    codeDigits.value = ['', '', '', '', '', '']
    codeInputs.value.forEach(input => input && (input.value = ''))
    codeInputs.value[0]?.focus()
  } finally {
    isSubmitting.value = false
  }
}
</script>
