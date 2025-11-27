<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">강의 관리</h1>
        <p class="text-gray-600 mt-1">전체 강의를 관리합니다</p>
      </div>
      <button @click="showModal = true" class="btn btn-primary">
        <i class="fa-solid fa-plus mr-2"></i>
        강의 추가
      </button>
    </div>
    
    <!-- 검색/필터 -->
    <div class="card p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <input 
          v-model="search" 
          type="text" 
          placeholder="강의명 검색..." 
          class="input flex-1"
        />
        <select v-model="filter.semester" class="input w-auto" @change="fetchCourses">
          <option value="">전체 학기</option>
          <option v-for="sem in semesters" :key="sem.id" :value="sem.id">
            {{ sem.year }}년 {{ sem.term }}학기
          </option>
        </select>
        <button @click="fetchCourses" class="btn btn-secondary">
          <i class="fa-solid fa-search"></i>
        </button>
      </div>
    </div>
    
    <div v-if="isLoading" class="text-center py-12">
      <i class="fa-solid fa-spinner fa-spin text-4xl text-primary-600"></i>
    </div>
    
    <div v-else class="card overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">강의명</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">담당 교원</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학기</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수강생</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="course in filteredCourses" :key="course.id" class="hover:bg-gray-50">
            <td class="px-6 py-4">
              <div class="font-medium text-gray-900">{{ course.title }}</div>
              <div class="text-sm text-gray-500">{{ course.code }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ course.instructor_name }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ course.year }}년 {{ course.term }}학기
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ course.student_count }}명
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
              <button @click="editCourse(course)" class="text-primary-600 hover:text-primary-900 mr-3">
                수정
              </button>
              <button @click="deleteCourse(course)" class="text-red-600 hover:text-red-900">
                삭제
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="filteredCourses.length === 0" class="p-12 text-center">
        <i class="fa-solid fa-book text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-600">강의가 없습니다.</p>
      </div>
    </div>
    
    <!-- 강의 추가/수정 모달 -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold text-gray-900 mb-4">
          {{ editingId ? '강의 수정' : '강의 추가' }}
        </h3>
        
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">강의 코드 *</label>
            <input v-model="form.code" type="text" class="input" required />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">강의명 *</label>
            <input v-model="form.title" type="text" class="input" required />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">담당 교원 *</label>
            <select v-model="form.instructorId" class="input" required>
              <option value="">선택하세요</option>
              <option v-for="inst in instructors" :key="inst.id" :value="inst.id">
                {{ inst.name }} ({{ inst.student_id }})
              </option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">학기 *</label>
            <select v-model="form.semesterId" class="input" required>
              <option value="">선택하세요</option>
              <option v-for="sem in semesters" :key="sem.id" :value="sem.id">
                {{ sem.year }}년 {{ sem.term }}학기
              </option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">강의실</label>
            <input v-model="form.room" type="text" class="input" placeholder="예: 공학관 301호" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">학점</label>
            <input v-model.number="form.credits" type="number" class="input" min="1" max="6" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <textarea v-model="form.description" class="input min-h-[80px]"></textarea>
          </div>
          
          <div class="flex gap-3 pt-4">
            <button type="submit" class="btn btn-primary flex-1" :disabled="isSubmitting">
              {{ editingId ? '수정' : '추가' }}
            </button>
            <button type="button" @click="closeModal" class="btn btn-secondary flex-1">
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api'

const courses = ref([])
const semesters = ref([])
const instructors = ref([])
const isLoading = ref(true)
const showModal = ref(false)
const isSubmitting = ref(false)
const editingId = ref(null)
const search = ref('')
const filter = ref({ semester: '' })

const form = ref({
  code: '',
  title: '',
  instructorId: '',
  semesterId: '',
  room: '',
  credits: 3,
  description: ''
})

const filteredCourses = computed(() => {
  let result = courses.value
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(c => c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
  }
  return result
})

const fetchCourses = async () => {
  isLoading.value = true
  try {
    const params = new URLSearchParams()
    if (filter.value.semester) params.append('semesterId', filter.value.semester)
    
    const response = await api.get(`/courses/admin?${params}`)
    if (response.success) {
      courses.value = response.data
    }
  } catch (error) {
    console.error('강의 목록 조회 오류:', error)
  } finally {
    isLoading.value = false
  }
}

const fetchSemesters = async () => {
  try {
    const response = await api.get('/semesters')
    if (response.success) {
      semesters.value = response.data
    }
  } catch (error) {
    console.error('학기 목록 조회 오류:', error)
  }
}

const fetchInstructors = async () => {
  try {
    const response = await api.get('/users?role=instructor')
    if (response.success) {
      instructors.value = response.data.users || response.data
    }
  } catch (error) {
    console.error('교원 목록 조회 오류:', error)
  }
}

const editCourse = (course) => {
  editingId.value = course.id
  form.value = {
    code: course.code,
    title: course.title,
    instructorId: course.instructor_id,
    semesterId: course.semester_id,
    room: course.room || '',
    credits: course.credits || 3,
    description: course.description || ''
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingId.value = null
  form.value = {
    code: '',
    title: '',
    instructorId: '',
    semesterId: '',
    room: '',
    credits: 3,
    description: ''
  }
}

const handleSubmit = async () => {
  isSubmitting.value = true
  
  try {
    if (editingId.value) {
      await api.put(`/courses/${editingId.value}`, form.value)
      alert('강의가 수정되었습니다.')
    } else {
      await api.post('/courses', form.value)
      alert('강의가 추가되었습니다.')
    }
    
    closeModal()
    await fetchCourses()
  } catch (error) {
    alert(error.message || '저장에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

const deleteCourse = async (course) => {
  if (!confirm(`"${course.title}" 강의를 삭제하시겠습니까?`)) return
  
  try {
    await api.delete(`/courses/${course.id}`)
    await fetchCourses()
    alert('강의가 삭제되었습니다.')
  } catch (error) {
    alert(error.message || '삭제에 실패했습니다.')
  }
}

onMounted(async () => {
  await Promise.all([fetchSemesters(), fetchInstructors()])
  await fetchCourses()
})
</script>
