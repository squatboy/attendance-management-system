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

const authStore = useAuthStore()
const isLoading = ref(true)

onMounted(async () => {
  // 페이지 로드 시 인증 상태 확인
  try {
    await authStore.checkAuth()
  } catch (error) {
    console.error('Auth check failed:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<style>
#app {
  min-height: 100vh;
}
</style>
