<template>
  <div>
    <router-link to="/messages" class="text-gray-600 hover:text-gray-900 mb-4 inline-block">
      <i class="fa-solid fa-arrow-left mr-2"></i>
      메시지 목록
    </router-link>
    
    <div class="max-w-2xl mx-auto">
      <div class="card p-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-6">새 메시지</h1>
        
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- 받는 사람 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">받는 사람</label>
            <div class="relative">
              <input 
                v-model="searchQuery"
                type="text" 
                class="input" 
                placeholder="이름 또는 학번으로 검색"
                @focus="showUserList = true"
                @input="searchUsers"
              />
              <div 
                v-if="showUserList && searchResults.length > 0"
                class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
              >
                <div 
                  v-for="user in searchResults" 
                  :key="user.id"
                  class="p-3 hover:bg-gray-50 cursor-pointer"
                  @click="selectUser(user)"
                >
                  <p class="font-medium">{{ user.name }}</p>
                  <p class="text-sm text-gray-500">{{ user.student_id }} ({{ getRoleLabel(user.role) }})</p>
                </div>
              </div>
            </div>
            
            <!-- 선택된 수신자 -->
            <div v-if="selectedUser" class="mt-2 flex items-center gap-2 bg-primary-50 text-primary-700 rounded-lg px-3 py-2">
              <i class="fa-solid fa-user"></i>
              <span>{{ selectedUser.name }} ({{ selectedUser.student_id }})</span>
              <button type="button" @click="selectedUser = null" class="ml-auto">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
          
          <!-- 제목 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input v-model="form.subject" type="text" class="input" placeholder="메시지 제목" required />
          </div>
          
          <!-- 내용 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">내용</label>
            <textarea
              v-model="form.content"
              class="input min-h-[200px]"
              placeholder="메시지 내용을 입력하세요"
              required
            ></textarea>
          </div>
          
          <!-- 제출 버튼 -->
          <div class="flex gap-3">
            <button
              type="submit"
              class="btn btn-primary flex-1"
              :disabled="!selectedUser || isSubmitting"
            >
              <template v-if="isSubmitting">
                <i class="fa-solid fa-spinner fa-spin mr-2"></i>
                전송 중...
              </template>
              <template v-else>
                <i class="fa-solid fa-paper-plane mr-2"></i>
                보내기
              </template>
            </button>
            <router-link to="/messages" class="btn btn-secondary">취소</router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'

const router = useRouter()

const form = ref({
  subject: '',
  content: ''
})

const searchQuery = ref('')
const searchResults = ref([])
const selectedUser = ref(null)
const showUserList = ref(false)
const isSubmitting = ref(false)

const getRoleLabel = (role) => {
  const labels = {
    admin: '관리자',
    instructor: '교원',
    student: '학생'
  }
  return labels[role] || role
}

const searchUsers = async () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }
  
  try {
    const response = await api.get(`/users/search?q=${encodeURIComponent(searchQuery.value)}`)
    if (response.success) {
      searchResults.value = response.data
    }
  } catch (error) {
    console.error('사용자 검색 오류:', error)
  }
}

const selectUser = (user) => {
  selectedUser.value = user
  searchQuery.value = ''
  searchResults.value = []
  showUserList.value = false
}

const handleSubmit = async () => {
  if (!selectedUser.value) return
  
  isSubmitting.value = true
  
  try {
    const response = await api.post('/messages', {
      receiverId: selectedUser.value.id,
      subject: form.value.subject,
      content: form.value.content
    })
    
    if (response.success) {
      alert('메시지를 전송했습니다.')
      router.push('/messages')
    }
  } catch (error) {
    alert(error.message || '메시지 전송에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}
</script>
