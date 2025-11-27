<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full">
      <!-- 로고 및 타이틀 -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
          <i class="fa-solid fa-graduation-cap text-3xl text-primary-600"></i>
        </div>
        <h1 class="text-2xl font-bold text-gray-900">학교 출석 관리 시스템</h1>
        <p class="mt-2 text-gray-600">계정에 로그인하세요</p>
      </div>
      
      <!-- 로그인 폼 -->
      <div class="card p-8">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- 에러 메시지 -->
          <div 
            v-if="errorMessage" 
            class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm"
          >
            <i class="fa-solid fa-circle-exclamation mr-2"></i>
            {{ errorMessage }}
          </div>
          
          <!-- 학번 -->
          <div>
            <label for="studentId" class="block text-sm font-medium text-gray-700 mb-1">
              학번
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="fa-solid fa-user text-gray-400"></i>
              </div>
              <input
                id="studentId"
                v-model="studentId"
                type="text"
                class="input pl-10"
                placeholder="학번을 입력하세요"
                required
                autocomplete="username"
              />
            </div>
          </div>
          
          <!-- 비밀번호 -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="fa-solid fa-lock text-gray-400"></i>
              </div>
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="input pl-10 pr-10"
                placeholder="비밀번호를 입력하세요"
                required
                autocomplete="current-password"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
                @click="showPassword = !showPassword"
              >
                <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" class="text-gray-400"></i>
              </button>
            </div>
          </div>
          
          <!-- 로그인 버튼 -->
          <button
            type="submit"
            class="btn btn-primary w-full py-3"
            :disabled="authStore.isLoading"
          >
            <template v-if="authStore.isLoading">
              <i class="fa-solid fa-spinner fa-spin mr-2"></i>
              로그인 중...
            </template>
            <template v-else>
              <i class="fa-solid fa-right-to-bracket mr-2"></i>
              로그인
            </template>
          </button>
        </form>
      </div>
      
      <!-- 안내 문구 -->
      <p class="mt-6 text-center text-sm text-gray-500">
        소프트웨어학과 출석 관리 시스템
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const studentId = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  errorMessage.value = ''
  
  try {
    const response = await authStore.login(studentId.value, password.value)
    if (response.success) {
      const redirect = route.query.redirect || '/'
      router.push(redirect)
    }
  } catch (error) {
    errorMessage.value = error.message || '로그인에 실패했습니다.'
  }
}
</script>
