<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">메시지</h1>
        <p class="text-gray-600 mt-1">{{ unreadCount }}개의 읽지 않은 메시지</p>
      </div>
      <router-link to="/messages/new" class="btn btn-primary">
        <i class="fa-solid fa-pen-to-square mr-2"></i>
        새 메시지
      </router-link>
    </div>
    
    <!-- 탭 -->
    <div class="flex border-b border-gray-200 mb-4">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="currentTab = tab.id"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="currentTab === tab.id 
          ? 'border-primary-500 text-primary-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700'"
      >
        {{ tab.label }}
      </button>
    </div>
    
    <div v-if="isLoading" class="text-center py-12">
      <i class="fa-solid fa-spinner fa-spin text-4xl text-primary-600"></i>
    </div>
    
    <div v-else-if="filteredMessages.length === 0" class="card p-12 text-center">
      <i class="fa-solid fa-inbox text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-600">메시지가 없습니다.</p>
    </div>
    
    <div v-else class="space-y-2">
      <router-link 
        v-for="message in filteredMessages" 
        :key="message.id"
        :to="`/messages/${message.id}`"
        class="card p-4 block transition-colors"
        :class="!message.is_read && currentTab === 'received' ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'"
      >
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-user text-gray-500"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <p class="font-medium text-gray-900 truncate">
                {{ currentTab === 'received' ? message.sender_name : message.receiver_name }}
              </p>
              <span class="text-xs text-gray-400 flex-shrink-0">
                {{ formatTime(message.created_at) }}
              </span>
            </div>
            <p class="font-medium text-gray-800 text-sm mt-1">{{ message.subject }}</p>
            <p class="text-sm text-gray-500 truncate mt-1">{{ message.content }}</p>
          </div>
          <span v-if="!message.is_read && currentTab === 'received'" class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></span>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api'

const tabs = [
  { id: 'received', label: '받은 메시지' },
  { id: 'sent', label: '보낸 메시지' }
]

const currentTab = ref('received')
const messages = ref([])
const isLoading = ref(true)

const filteredMessages = computed(() => {
  return messages.value.filter(m => {
    if (currentTab.value === 'received') return m.type === 'received'
    return m.type === 'sent'
  })
})

const unreadCount = computed(() => {
  return messages.value.filter(m => m.type === 'received' && !m.is_read).length
})

const formatTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '방금 전'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`
  return date.toLocaleDateString('ko-KR')
}

const fetchMessages = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/messages')
    if (response.success) {
      messages.value = response.data
    }
  } catch (error) {
    console.error('메시지 목록 조회 오류:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchMessages()
})
</script>
