<template>
  <div>
    <router-link to="/messages" class="text-gray-600 hover:text-gray-900 mb-4 inline-block">
      <i class="fa-solid fa-arrow-left mr-2"></i>
      메시지 목록
    </router-link>
    
    <div v-if="isLoading" class="text-center py-12">
      <i class="fa-solid fa-spinner fa-spin text-4xl text-primary-600"></i>
    </div>
    
    <div v-else-if="message" class="max-w-2xl mx-auto">
      <div class="card">
        <div class="p-6 border-b border-gray-100">
          <h1 class="text-xl font-bold text-gray-900 mb-4">{{ message.subject }}</h1>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <i class="fa-solid fa-user text-gray-500"></i>
              </div>
              <div>
                <p class="font-medium text-gray-900">
                  {{ message.is_sender ? '받는 사람: ' : '보낸 사람: ' }}
                  {{ message.is_sender ? message.receiver_name : message.sender_name }}
                </p>
                <p class="text-sm text-gray-500">{{ formatDate(message.created_at) }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="p-6">
          <div class="prose max-w-none whitespace-pre-wrap">
            {{ message.content }}
          </div>
        </div>
        
        <div class="p-6 border-t border-gray-100 flex gap-3">
          <button 
            v-if="!message.is_sender"
            @click="showReplyForm = !showReplyForm" 
            class="btn btn-primary"
          >
            <i class="fa-solid fa-reply mr-2"></i>
            답장
          </button>
          <button @click="deleteMessage" class="btn btn-danger">
            <i class="fa-solid fa-trash mr-2"></i>
            삭제
          </button>
        </div>
      </div>
      
      <!-- 답장 폼 -->
      <div v-if="showReplyForm" class="card p-6 mt-4">
        <h3 class="font-bold text-gray-900 mb-4">답장 작성</h3>
        <form @submit.prevent="sendReply" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input v-model="replyForm.subject" type="text" class="input" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">내용</label>
            <textarea
              v-model="replyForm.content"
              class="input min-h-[120px]"
              placeholder="답장 내용"
              required
            ></textarea>
          </div>
          <div class="flex gap-3">
            <button type="submit" class="btn btn-primary" :disabled="isReplying">
              <template v-if="isReplying">
                <i class="fa-solid fa-spinner fa-spin mr-2"></i>
                전송 중...
              </template>
              <template v-else>
                <i class="fa-solid fa-paper-plane mr-2"></i>
                보내기
              </template>
            </button>
            <button type="button" @click="showReplyForm = false" class="btn btn-secondary">
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'

const route = useRoute()
const router = useRouter()

const message = ref(null)
const isLoading = ref(true)
const showReplyForm = ref(false)
const isReplying = ref(false)
const replyForm = ref({
  subject: '',
  content: ''
})

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('ko-KR')
}

const fetchMessage = async () => {
  isLoading.value = true
  try {
    const response = await api.get(`/messages/${route.params.id}`)
    if (response.success) {
      message.value = response.data
      replyForm.value.subject = `Re: ${message.value.subject}`
    }
  } catch (error) {
    console.error('메시지 조회 오류:', error)
  } finally {
    isLoading.value = false
  }
}

const sendReply = async () => {
  isReplying.value = true
  try {
    await api.post('/messages', {
      receiverId: message.value.sender_id,
      subject: replyForm.value.subject,
      content: replyForm.value.content,
      parentId: message.value.id
    })
    alert('답장을 전송했습니다.')
    showReplyForm.value = false
    replyForm.value.content = ''
  } catch (error) {
    alert(error.message || '답장 전송에 실패했습니다.')
  } finally {
    isReplying.value = false
  }
}

const deleteMessage = async () => {
  if (!confirm('메시지를 삭제하시겠습니까?')) return
  
  try {
    await api.delete(`/messages/${message.value.id}`)
    alert('메시지가 삭제되었습니다.')
    router.push('/messages')
  } catch (error) {
    alert(error.message || '삭제에 실패했습니다.')
  }
}

onMounted(() => {
  fetchMessage()
})
</script>
