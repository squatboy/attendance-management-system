<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">메시지</h1>
        <p class="text-gray-600 mt-1">{{ totalUnreadCount }}개의 읽지 않은 메시지</p>
      </div>
      <div class="flex gap-2">
        <button @click="showUserList = !showUserList" class="btn btn-primary">
          <i class="fa-solid fa-plus mr-2"></i>
          새 메시지
        </button>
        <button @click="searchVisible = !searchVisible" class="btn btn-secondary">
          <i class="fa-solid fa-search mr-2"></i>
          검색
        </button>
      </div>
    </div>

    <!-- 사용자 목록 -->
    <div v-if="showUserList" class="card p-4 mb-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold">사용자 선택</h3>
        <button @click="showUserList = false" class="text-gray-500 hover:text-gray-700">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
      <div class="max-h-96 overflow-y-auto space-y-2">
        <div v-if="loadingUsers" class="text-center py-4">
          <i class="fa-solid fa-spinner fa-spin text-primary-600"></i>
        </div>
        <div 
          v-else 
          v-for="user in allUsers" 
          :key="user.id"
          class="p-3 hover:bg-gray-50 rounded cursor-pointer transition-colors"
          @click="startNewConversation(user.id)"
        >
          <p class="font-medium">{{ user.name }} ({{ user.student_id }})</p>
          <p class="text-sm text-gray-500">
            <span class="px-2 py-0.5 text-xs rounded" :class="getRoleBadgeClass(user.role)">
              {{ getRoleText(user.role) }}
            </span>
          </p>
        </div>
      </div>
    </div>

    <!-- 검색창 -->
    <div v-if="searchVisible" class="card p-4 mb-4">
      <div class="flex gap-2">
        <input 
          v-model="searchKeyword"
          type="text" 
          placeholder="메시지 내용 검색..."
          class="input flex-1"
          @keyup.enter="handleSearch"
        />
        <button @click="handleSearch" class="btn btn-primary">검색</button>
        <button @click="clearSearch" class="btn btn-secondary">취소</button>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-12">
      <i class="fa-solid fa-spinner fa-spin text-4xl text-primary-600"></i>
    </div>

    <div v-else-if="conversations.length === 0" class="card p-12 text-center">
      <i class="fa-solid fa-envelope text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-600">메시지가 없습니다.</p>
    </div>

    <div v-else class="space-y-2">
      <div 
        v-for="conversation in conversations" 
        :key="conversation.user_id"
        class="card p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        :class="conversation.unread_count > 0 ? 'border-l-4 border-blue-500' : ''"
        @click="goToConversation(conversation.user_id)"
      >
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0">
            <div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <i class="fa-solid fa-user text-primary-600"></i>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-1">
              <p class="font-medium text-gray-900">
                {{ conversation.name }} ({{ conversation.student_id }})
              </p>
              <span class="text-xs text-gray-400">
                {{ formatTime(conversation.last_message_time) }}
              </span>
            </div>
            <p class="text-sm text-gray-500 flex items-center gap-2">
              <span class="px-2 py-0.5 text-xs rounded" :class="getRoleBadgeClass(conversation.role)">
                {{ getRoleText(conversation.role) }}
              </span>
            </p>
            <p class="text-sm text-gray-600 mt-1 truncate">
              {{ conversation.last_message }}
            </p>
            <div v-if="conversation.unread_count > 0" class="mt-2">
              <span class="inline-block px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded-full">
                {{ conversation.unread_count }}개의 새 메시지
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { messageApi } from '@/api'

const router = useRouter()

const conversations = ref([])
const allUsers = ref([])
const isLoading = ref(true)
const loadingUsers = ref(false)
const searchVisible = ref(false)
const showUserList = ref(false)
const searchKeyword = ref('')

const totalUnreadCount = computed(() => {
  return conversations.value.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)
})

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
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '방금 전'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`
  
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadConversations = async () => {
  try {
    isLoading.value = true
    const response = await messageApi.getConversations()
    conversations.value = response.data
  } catch (error) {
    console.error('대화 목록 조회 실패:', error)
    alert('대화 목록을 불러오는데 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

const goToConversation = (userId) => {
  router.push({ name: 'message-detail', params: { userId } })
}

const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    alert('검색어를 입력해주세요.')
    return
  }

  try {
    isLoading.value = true
    const response = await messageApi.searchMessages(searchKeyword.value)
    
    // 검색 결과를 대화 형태로 변환
    const searchResults = response.data
    if (searchResults.length === 0) {
      alert('검색 결과가 없습니다.')
      clearSearch()
      return
    }
    
    // 검색 결과 표시 (간단하게 대화 목록으로 변환)
    const uniqueUsers = new Map()
    searchResults.forEach(msg => {
      const otherUserId = msg.sender_id === msg.receiver_id ? msg.receiver_id : 
                         (msg.sender_id !== msg.id ? msg.sender_id : msg.receiver_id)
      if (!uniqueUsers.has(otherUserId)) {
        uniqueUsers.set(otherUserId, {
          user_id: otherUserId,
          name: msg.sender_name || msg.receiver_name,
          last_message: msg.content,
          last_message_time: msg.created_at,
          unread_count: 0
        })
      }
    })
    conversations.value = Array.from(uniqueUsers.values())
  } catch (error) {
    console.error('메시지 검색 실패:', error)
    alert('메시지 검색에 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

const clearSearch = () => {
  searchKeyword.value = ''
  searchVisible.value = false
  loadConversations()
}

const loadAllUsers = async () => {
  try {
    loadingUsers.value = true
    const response = await messageApi.getAllUsers()
    allUsers.value = response.data || []
  } catch (error) {
    console.error('사용자 목록 조회 실패:', error)
    alert('사용자 목록을 불러오는데 실패했습니다.')
  } finally {
    loadingUsers.value = false
  }
}

const startNewConversation = (userId) => {
  showUserList.value = false
  router.push({ name: 'message-detail', params: { userId } })
}

onMounted(() => {
  loadConversations()
  loadAllUsers()
})

// 다른 페이지에서 돌아올 때 목록 새로고침
onActivated(() => {
  loadConversations()
})
</script>
