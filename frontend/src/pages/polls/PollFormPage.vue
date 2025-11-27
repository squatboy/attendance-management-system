<template>
  <div>
    <router-link to="/polls" class="text-gray-600 hover:text-gray-900 mb-4 inline-block">
      <i class="fa-solid fa-arrow-left mr-2"></i>
      투표 목록
    </router-link>
    
    <div class="max-w-2xl mx-auto">
      <div class="card p-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-6">투표 만들기</h1>
        
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
          
          <!-- 제목 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input v-model="form.title" type="text" class="input" placeholder="투표 제목" required />
          </div>
          
          <!-- 설명 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <textarea
              v-model="form.description"
              class="input min-h-[80px]"
              placeholder="투표에 대한 설명 (선택)"
            ></textarea>
          </div>
          
          <!-- 선택지 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">선택지</label>
            <div class="space-y-2">
              <div v-for="(option, index) in form.options" :key="index" class="flex gap-2">
                <input 
                  v-model="form.options[index]" 
                  type="text" 
                  class="input flex-1"
                  :placeholder="`선택지 ${index + 1}`"
                  required
                />
                <button 
                  v-if="form.options.length > 2"
                  type="button"
                  @click="removeOption(index)"
                  class="btn btn-danger btn-sm"
                >
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
            <button 
              type="button" 
              @click="addOption" 
              class="btn btn-secondary btn-sm mt-2"
              :disabled="form.options.length >= 10"
            >
              <i class="fa-solid fa-plus mr-1"></i>
              선택지 추가
            </button>
          </div>
          
          <!-- 마감일 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">마감일 (선택)</label>
            <input v-model="form.endDate" type="datetime-local" class="input" />
          </div>
          
          <!-- 옵션 -->
          <div class="space-y-3">
            <label class="flex items-center gap-2">
              <input v-model="form.isAnonymous" type="checkbox" class="w-4 h-4" />
              <span class="text-sm text-gray-700">익명 투표</span>
            </label>
            <label class="flex items-center gap-2">
              <input v-model="form.allowMultiple" type="checkbox" class="w-4 h-4" />
              <span class="text-sm text-gray-700">복수 선택 허용</span>
            </label>
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
                생성 중...
              </template>
              <template v-else>
                <i class="fa-solid fa-check mr-2"></i>
                투표 생성
              </template>
            </button>
            <router-link to="/polls" class="btn btn-secondary">취소</router-link>
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
  title: '',
  description: '',
  options: ['', ''],
  endDate: '',
  isAnonymous: false,
  allowMultiple: false
})
const isSubmitting = ref(false)

const addOption = () => {
  if (form.value.options.length < 10) {
    form.value.options.push('')
  }
}

const removeOption = (index) => {
  form.value.options.splice(index, 1)
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
    const response = await api.post('/polls', {
      courseId: form.value.courseId,
      title: form.value.title,
      description: form.value.description,
      options: form.value.options.filter(o => o.trim()),
      endDate: form.value.endDate || null,
      isAnonymous: form.value.isAnonymous,
      allowMultiple: form.value.allowMultiple
    })
    
    if (response.success) {
      alert('투표가 생성되었습니다.')
      router.push('/polls')
    }
  } catch (error) {
    alert(error.message || '투표 생성에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchCourses()
})
</script>
