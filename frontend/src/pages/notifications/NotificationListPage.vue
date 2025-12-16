<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">알림</h1>
        <p class="text-gray-600 mt-1">{{ unreadCount }}개의 읽지 않은 알림</p>
      </div>
      <button 
        v-if="notifications.length > 0"
        @click="markAllAsRead"
        class="btn btn-secondary"
      >
        <i class="fa-solid fa-check-double mr-2"></i>
        모두 읽음
      </button>
    </div>
    
    <div v-if="isLoading" class="text-center py-12">
      <i class="fa-solid fa-spinner fa-spin text-4xl text-primary-600"></i>
    </div>
    
    <div v-else-if="notifications.length === 0" class="card p-12 text-center">
      <i class="fa-solid fa-bell-slash text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-600">알림이 없습니다.</p>
    </div>
    
    <div v-else class="space-y-2">
      <div 
        v-for="notification in notifications" 
        :key="notification.id"
        class="card p-4 cursor-pointer transition-colors"
        :class="notification.is_read ? 'bg-white' : 'bg-blue-50 border-blue-200'"
        @click="handleNotificationClick(notification)"
      >
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
               :class="getIconClass(notification.type)">
            <i :class="getIcon(notification.type)"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900">{{ notification.title }}</p>
            <p class="text-sm text-gray-600 mt-1">{{ notification.content }}</p>
            <p class="text-xs text-gray-400 mt-2">{{ formatTime(notification.created_at) }}</p>
          </div>
          <div v-if="!notification.is_read" class="flex-shrink-0">
            <span class="w-2 h-2 bg-blue-500 rounded-full block"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import api from '@/api'

const router = useRouter()
const notificationStore = useNotificationStore()

const notifications = ref([])
const isLoading = ref(true)

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.is_read).length
})

const getIcon = (type) => {
  const icons = {
    attendance: 'fa-solid fa-clock',
    excuse: 'fa-solid fa-file-lines',
    appeal: 'fa-solid fa-flag',
    poll: 'fa-solid fa-chart-bar',
    message: 'fa-solid fa-envelope',
    system: 'fa-solid fa-bell'
  }
  return icons[type] || 'fa-solid fa-bell'
}

const getIconClass = (type) => {
  const classes = {
    attendance: 'bg-green-100 text-green-600',
    excuse: 'bg-blue-100 text-blue-600',
    appeal: 'bg-yellow-100 text-yellow-600',
    poll: 'bg-purple-100 text-purple-600',
    message: 'bg-indigo-100 text-indigo-600',
    system: 'bg-gray-100 text-gray-600'
  }
  return classes[type] || 'bg-gray-100 text-gray-600'
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

const fetchNotifications = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/notifications')
    if (response.success) {
      notifications.value = response.data.notifications || []
    }
  } catch (error) {
    console.error('알림 목록 조회 오류:', error)
  } finally {
    isLoading.value = false
  }
}

const handleNotificationClick = async (notification) => {
  if (!notification.is_read) {
    await markAsRead(notification.id)
  }
  
  if (notification.link) {
    router.push(notification.link)
  }
}

const markAsRead = async (id) => {
  try {
    await api.put(`/notifications/${id}/read`)
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.is_read = true
    }
    notificationStore.fetchNotifications()
  } catch (error) {
    console.error('알림 읽음 처리 오류:', error)
  }
}

const markAllAsRead = async () => {
  try {
    await api.put('/notifications/read-all')
    notifications.value.forEach(n => n.is_read = true)
    notificationStore.fetchNotifications()
  } catch (error) {
    console.error('알림 전체 읽음 처리 오류:', error)
  }
}

onMounted(() => {
  fetchNotifications()
})
</script>
