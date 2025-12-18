<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- 사이드바 -->
    <aside 
      class="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0"
      :class="{ '-translate-x-full': !sidebarOpen }"
    >
      <div class="flex flex-col h-full">
        <!-- 로고 -->
        <div class="h-16 flex items-center px-6 border-b border-gray-200">
          <router-link to="/" class="flex items-center gap-2">
            <i class="fa-solid fa-graduation-cap text-2xl text-primary-600"></i>
            <span class="font-bold text-lg text-gray-800">출석 관리</span>
          </router-link>
        </div>
        
        <!-- 메뉴 -->
        <nav class="flex-1 overflow-y-auto p-4">
          <ul class="space-y-1">
            <li>
              <router-link 
                to="/" 
                class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                :class="{ 'bg-primary-50 text-primary-600': $route.name === 'dashboard' }"
              >
                <i class="fa-solid fa-house w-5"></i>
                <span>대시보드</span>
              </router-link>
            </li>
            
            <li>
              <router-link 
                to="/courses" 
                class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                :class="{ 'bg-primary-50 text-primary-600': $route.path.startsWith('/courses') }"
              >
                <i class="fa-solid fa-book w-5"></i>
                <span>강의</span>
              </router-link>
            </li>
            
            <li>
              <router-link 
                to="/excuses" 
                class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                :class="{ 'bg-primary-50 text-primary-600': $route.path.startsWith('/excuses') }"
              >
                <i class="fa-solid fa-file-lines w-5"></i>
                <span>공결 신청</span>
              </router-link>
            </li>
            
            <li>
              <router-link 
                to="/appeals" 
                class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                :class="{ 'bg-primary-50 text-primary-600': $route.path.startsWith('/appeals') }"
              >
                <i class="fa-solid fa-flag w-5"></i>
                <span>이의 신청</span>
              </router-link>
            </li>
            
            <li>
              <router-link 
                to="/polls" 
                class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                :class="{ 'bg-primary-50 text-primary-600': $route.path.startsWith('/polls') }"
              >
                <i class="fa-solid fa-square-poll-vertical w-5"></i>
                <span>투표</span>
              </router-link>
            </li>
            
            <li>
              <router-link 
                to="/messages" 
                class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                :class="{ 'bg-primary-50 text-primary-600': $route.path.startsWith('/messages') }"
              >
                <i class="fa-solid fa-envelope w-5"></i>
                <span>메시지</span>
                <span v-if="unreadMessageCount > 0" class="ml-auto px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {{ unreadMessageCount }}
                </span>
              </router-link>
            </li>
            
            <!-- 관리자 메뉴 -->
            <template v-if="authStore.isAdmin">
              <li class="pt-4 mt-4 border-t border-gray-200">
                <span class="px-4 text-xs font-semibold text-gray-400 uppercase">관리자</span>
              </li>
              
              <li>
                <router-link 
                  to="/admin/users" 
                  class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  :class="{ 'bg-primary-50 text-primary-600': $route.path.startsWith('/admin/users') }"
                >
                  <i class="fa-solid fa-users w-5"></i>
                  <span>사용자 관리</span>
                </router-link>
              </li>
              
              <li>
                <router-link 
                  to="/admin/semesters" 
                  class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  :class="{ 'bg-primary-50 text-primary-600': $route.path.startsWith('/admin/semesters') }"
                >
                  <i class="fa-solid fa-calendar w-5"></i>
                  <span>학기 관리</span>
                </router-link>
              </li>
              
              <li>
                <router-link 
                  to="/admin/courses" 
                  class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  :class="{ 'bg-primary-50 text-primary-600': $route.path.startsWith('/admin/courses') }"
                >
                  <i class="fa-solid fa-book-open w-5"></i>
                  <span>강의 관리</span>
                </router-link>
              </li>
              
              <li>
                <router-link 
                  to="/admin/settings" 
                  class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  :class="{ 'bg-primary-50 text-primary-600': $route.path.startsWith('/admin/settings') }"
                >
                  <i class="fa-solid fa-gear w-5"></i>
                  <span>설정</span>
                </router-link>
              </li>
              
              <li>
                <router-link 
                  to="/admin/audit-logs" 
                  class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                  :class="{ 'bg-primary-50 text-primary-600': $route.path.startsWith('/admin/audit-logs') }"
                >
                  <i class="fa-solid fa-clipboard-list w-5"></i>
                  <span>감사 로그</span>
                </router-link>
              </li>
            </template>
          </ul>
        </nav>
        
        <!-- 사용자 정보 -->
        <div class="p-4 border-t border-gray-200">
          <router-link to="/profile" class="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors">
            <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <i class="fa-solid fa-user text-primary-600"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ authStore.user?.name }}</p>
              <p class="text-xs text-gray-500">{{ roleLabel }}</p>
            </div>
          </router-link>
        </div>
      </div>
    </aside>
    
    <!-- 오버레이 (모바일) -->
    <div 
      v-if="sidebarOpen" 
      class="fixed inset-0 bg-black/50 z-30 lg:hidden"
      @click="sidebarOpen = false"
    ></div>
    
    <!-- 메인 컨텐츠 -->
    <div class="flex-1 lg:ml-64">
      <!-- 헤더 -->
      <header class="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 sticky top-0 z-20">
        <!-- 모바일 메뉴 버튼 -->
        <button 
          class="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          @click="sidebarOpen = !sidebarOpen"
        >
          <i class="fa-solid fa-bars text-gray-600"></i>
        </button>
        
        <div class="flex-1"></div>
        
        <!-- 알림 -->
        <router-link 
          to="/notifications" 
          class="relative p-2 rounded-lg hover:bg-gray-100"
        >
          <i class="fa-solid fa-bell text-gray-600"></i>
          <span 
            v-if="notificationStore.unreadCount > 0"
            class="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center"
          >
            {{ notificationStore.unreadCount > 9 ? '9+' : notificationStore.unreadCount }}
          </span>
        </router-link>
        
        <!-- 로그아웃 -->
        <button 
          class="p-2 rounded-lg hover:bg-gray-100 ml-2"
          @click="handleLogout"
        >
          <i class="fa-solid fa-right-from-bracket text-gray-600"></i>
        </button>
      </header>
      
      <!-- 페이지 컨텐츠 -->
      <main class="p-4 lg:p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { messageApi } from '@/api'

const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const sidebarOpen = ref(false)
const unreadMessageCount = ref(0)

const roleLabel = computed(() => {
  const roles = {
    admin: '관리자',
    instructor: '교원',
    student: '학생'
  }
  return roles[authStore.user?.role] || ''
})

const handleLogout = async () => {
  await authStore.logout()
  router.push({ name: 'login' })
}

const loadUnreadMessageCount = async () => {
  try {
    const response = await messageApi.getUnreadCount()
    unreadMessageCount.value = response.data.unreadCount
  } catch (error) {
    console.error('읽지 않은 메시지 수 조회 실패:', error)
  }
}

onMounted(() => {
  notificationStore.fetchUnreadCount()
  loadUnreadMessageCount()
  
  // 주기적으로 업데이트 (30초마다)
  setInterval(() => {
    notificationStore.fetchUnreadCount()
    loadUnreadMessageCount()
  }, 30000)
})
</script>
