<template>
  <div>
    <router-link to="/excuses" class="text-gray-600 hover:text-gray-900 mb-4 inline-block">
      <i class="fa-solid fa-arrow-left mr-2"></i>
      공결 신청 목록
    </router-link>
    
    <div class="max-w-2xl mx-auto">
      <div class="card p-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-6">공결 신청</h1>
        
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- 강의 선택 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">강의</label>
            <select v-model="form.courseId" class="input" required>
              <option value="">강의를 선택하세요</option>
              <option v-for="course in courses" :key="course.id" :value="course.id">
                {{ course.title }}
              </option>
            </select>
          </div>
          
          <!-- 공결 날짜 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">공결 날짜</label>
            <input v-model="form.excuseDate" type="date" class="input" required />
          </div>
          
          <!-- 공결 유형 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">공결 유형</label>
            <select v-model="form.excuseType" class="input" required>
              <option value="">유형을 선택하세요</option>
              <option value="질병">질병</option>
              <option value="가사">가사</option>
              <option value="공무">공무</option>
              <option value="경조사">경조사</option>
              <option value="기타">기타</option>
            </select>
          </div>
          
          <!-- 사유 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">공결 사유</label>
            <textarea
              v-model="form.reason"
              class="input min-h-[120px]"
              placeholder="공결 사유를 상세히 입력하세요"
              required
            ></textarea>
          </div>
          
          <!-- 첨부파일 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">증빙 서류</label>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              @change="handleFileChange"
              class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            <p class="text-xs text-gray-500 mt-1">PDF, JPG, PNG 파일 (최대 5개)</p>
          </div>
          
          <!-- 제출 버튼 -->
          <div class="flex gap-3">
            <button
              type="submit"
              class="btn btn-primary flex-1"
              :disabled="isSubmitting"
            >
              <template v-if="isSubmitting">
                <i class="fa-solid fa-spinner fa-spin mr-2"></i>
                제출 중...
              </template>
              <template v-else>
                <i class="fa-solid fa-paper-plane mr-2"></i>
                신청하기
              </template>
            </button>
            <router-link to="/excuses" class="btn btn-secondary">취소</router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'

const router = useRouter()

const courses = ref([])
const form = ref({
  courseId: '',
  excuseDate: '',
  excuseType: '',
  reason: ''
})
const files = ref([])
const isSubmitting = ref(false)

const handleFileChange = (event) => {
  files.value = Array.from(event.target.files).slice(0, 5)
}

const fetchCourses = async () => {
  try {
    const response = await api.get('/courses')
    if (response.success) {
      courses.value = response.data
    }
  } catch (error) {
    console.error('강의 목록 조회 오류:', error)
  }
}

const handleSubmit = async () => {
  isSubmitting.value = true
  
  try {
    const formData = new FormData()
    formData.append('courseId', form.value.courseId)
    formData.append('excuseDate', form.value.excuseDate)
    formData.append('excuseType', form.value.excuseType)
    formData.append('reason', form.value.reason)
    
    files.value.forEach(file => {
      formData.append('attachments', file)
    })
    
    const response = await api.post('/excuses', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    if (response.success) {
      alert('공결 신청이 완료되었습니다.')
      router.push('/excuses')
    }
  } catch (error) {
    alert(error.message || '공결 신청에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchCourses()
})
</script>
