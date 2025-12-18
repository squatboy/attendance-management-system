<template>
  <div>
    <div class="mb-6">
      <button @click="goBack" class="btn btn-secondary mb-4">
        <i class="fa-solid fa-arrow-left mr-2"></i>
        뒤로가기
      </button>

      <div v-if="otherUser" class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
          <i class="fa-solid fa-user text-2xl text-primary-600"></i>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ otherUser.name }}</h1>
          <p class="text-gray-600">
            {{ otherUser.student_id }} · 
            <span class="px-2 py-0.5 text-xs rounded" :class="getRoleBadgeClass(otherUser.role)">
              {{ getRoleText(otherUser.role) }}
            </span>
          </p>
        </div>
      </div>
    </div>

    <!-- 메시지 목록 -->
    <div class="card mb-4" style="min-height: 500px; max-height: 500px; overflow-y: auto;">
      <div v-if="isLoading" class="text-center py-12">
        <i class="fa-solid fa-spinner fa-spin text-4xl text-primary-600"></i>
      </div>

      <div v-else-if="messages.length === 0" class="text-center py-12">
        <i class="fa-solid fa-comments text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-600">메시지를 시작해보세요!</p>
      </div>

      <div v-else class="p-4 space-y-4">
        <div 
          v-for="message in messages" 
          :key="message.id"
          :class="message.sender_id === currentUserId ? 'flex justify-end' : 'flex justify-start'"
        >
          <div 
            class="max-w-[70%] rounded-lg p-3"
            :class="message.sender_id === currentUserId 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-100 text-gray-900'"
          >
            <p class="whitespace-pre-wrap break-words">{{ message.content }}</p>
            <p 
              class="text-xs mt-1"
              :class="message.sender_id === currentUserId ? 'text-primary-100' : 'text-gray-500'"
            >
              {{ formatTime(message.created_at) }}
              <span v-if="message.sender_id === currentUserId">
                · {{ message.is_read ? '읽음' : '안읽음' }}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 메시지 입력 -->
    <div class="card p-4">
      <form @submit.prevent="sendMessage" class="flex gap-2">
        <textarea
          v-model="newMessage"
          placeholder="메시지를 입력하세요..."
          class="input flex-1 resize-none"
          rows="2"
          @keydown.enter.exact.prevent="sendMessage"
        ></textarea>
        <button 
          type="submit" 
          class="btn btn-primary"
          :disabled="!newMessage.trim() || isSending"
        >
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </form>
      <p class="text-xs text-gray-500 mt-2">Enter 키로 전송, Shift+Enter로 줄바꿈</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { messageApi } from '@/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const userId = route.params.userId
const currentUserId = authStore.user?.id

const otherUser = ref(null)
const messages = ref([])
const newMessage = ref('')
const isLoading = ref(true)
const isSending = ref(false)

const getRoleText = (role) => {
  const roles = {
    admin: '관리자',
    instructor: '교원',
    student: '학생'
  }
  return roles[role] || role
}

const getRoleBadgeClass = (role) => {
  const classes = {
    admin: 'bg-red-100 text-red-800',
    instructor: 'bg-blue-100 text-blue-800',
    student: 'bg-green-100 text-green-800'
  }
  return classes[role] || 'bg-gray-100 text-gray-800'
}

const formatTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadMessages = async () => {
  try {
    isLoading.value = true
    const response = await messageApi.getMessages(userId)
    otherUser.value = response.data.otherUser
    messages.value = response.data.messages
    
    // 읽음 처리 (백엔드에서 자동으로 처리되지만 명시적으로 호출)
    try {
      await messageApi.markAsRead(userId)
    } catch (err) {
      console.error('읽음 처리 오류:', err)
    }
    
    // 스크롤을 최하단으로
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('메시지 조회 실패:', error)
    alert('메시지를 불러오는데 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || isSending.value) return

  try {
    isSending.value = true
    const response = await messageApi.sendMessage(userId, newMessage.value)
    
    // 메시지 목록에 추가
    messages.value.push(response.data)
    newMessage.value = ''
    
    // 스크롤을 최하단으로
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('메시지 전송 실패:', error)
    alert(error.message || '메시지 전송에 실패했습니다.')
  } finally {
    isSending.value = false
  }
}

const scrollToBottom = () => {
  const messageContainer = document.querySelector('.card[style*="overflow-y"]')
  if (messageContainer) {
    messageContainer.scrollTop = messageContainer.scrollHeight
  }
}

const goBack = () => {
  // 메시지 목록으로 돌아갈 때 강제로 새로고침
  router.push({ name: 'message-list', params: { refresh: Date.now() } })
}

onMounted(() => {
  loadMessages()
})
</script>
