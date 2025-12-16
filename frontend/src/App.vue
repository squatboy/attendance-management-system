<template>
  <div id="app">
    <div v-if="isLoading" class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="text-center">
        <i class="fa-solid fa-spinner fa-spin text-4xl text-primary-600 mb-4"></i>
        <p class="text-gray-600">로딩 중...</p>
      </div>
    </div>
    <router-view v-else />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const isLoading = ref(true)

onMounted(async () => {
  // 1. localStorage에서 토큰 초기화
  authStore.initToken()
  
  // 2. 토큰이 있으면 인증 상태 확인
  if (authStore.token) {
    console.log('[App] Token exists, verifying...')
    await authStore.checkAuth()
  } else {
    console.log('[App] No token found')
  }
  
  // 3. 로딩 완료
  isLoading.value = false
  
  // 4. 라우팅 결정
  const isAuthPage = router.currentRoute.value.meta?.requiresAuth === false
  const isAuthenticated = authStore.isAuthenticated
  
  console.log('[App] Final state:', {
    isAuthenticated,
    isAuthPage,
    currentPath: router.currentRoute.value.path
  })
  
  // 인증 필요한 페이지인데 로그인 안 됨 -> 로그인 페이지로
  if (!isAuthenticated && !isAuthPage) {
    console.log('[App] Redirecting to login')
    router.push({ name: 'login' })
  }
  // 로그인 페이지인데 이미 인증됨 -> 대시보드로
  else if (isAuthenticated && isAuthPage) {
    console.log('[App] Redirecting to dashboard')
    router.push({ name: 'dashboard' })
  }
})
</script>

<style>
#app {
  min-height: 100vh;
}
</style>
