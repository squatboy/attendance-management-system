<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">학기 관리</h1>
        <p class="text-gray-600 mt-1">학기 정보를 관리합니다</p>
      </div>
      <button @click="showModal = true" class="btn btn-primary">
        <i class="fa-solid fa-plus mr-2"></i>
        학기 추가
      </button>
    </div>
    
    <div v-if="isLoading" class="text-center py-12">
      <i class="fa-solid fa-spinner fa-spin text-4xl text-primary-600"></i>
    </div>
    
    <div v-else class="card overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학기</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기간</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="semester in semesters" :key="semester.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="font-medium text-gray-900">{{ semester.year }}년 {{ semester.term }}학기</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(semester.start_date) }} ~ {{ formatDate(semester.end_date) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="semester.is_current ? 'badge badge-success' : 'badge badge-gray'">
                {{ semester.is_current ? '현재 학기' : '종료' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
              <button 
                v-if="!semester.is_current"
                @click="setCurrentSemester(semester)"
                class="text-primary-600 hover:text-primary-900 mr-3"
              >
                현재 학기 설정
              </button>
              <button @click="editSemester(semester)" class="text-primary-600 hover:text-primary-900 mr-3">
                수정
              </button>
              <button @click="deleteSemester(semester)" class="text-red-600 hover:text-red-900">
                삭제
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- 학기 추가/수정 모달 -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl max-w-md w-full p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">
          {{ editingId ? '학기 수정' : '학기 추가' }}
        </h3>
        
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">연도</label>
              <input v-model.number="form.year" type="number" class="input" min="2020" max="2100" required />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">학기</label>
              <select v-model.number="form.term" class="input" required>
                <option value="1">1학기</option>
                <option value="2">2학기</option>
              </select>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">시작일</label>
            <input v-model="form.startDate" type="date" class="input" required />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">종료일</label>
            <input v-model="form.endDate" type="date" class="input" required />
          </div>
          
          <div class="flex gap-3">
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
import { ref, onMounted } from 'vue'
import api from '@/api'

const semesters = ref([])
const isLoading = ref(true)
const showModal = ref(false)
const isSubmitting = ref(false)
const editingId = ref(null)

const form = ref({
  year: new Date().getFullYear(),
  term: 1,
  startDate: '',
  endDate: ''
})

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ko-KR')
}

const fetchSemesters = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/semesters')
    if (response.success) {
      semesters.value = response.data
    }
  } catch (error) {
    console.error('학기 목록 조회 오류:', error)
  } finally {
    isLoading.value = false
  }
}

const editSemester = (semester) => {
  editingId.value = semester.id
  form.value = {
    year: semester.year,
    term: semester.term,
    startDate: semester.start_date.split('T')[0],
    endDate: semester.end_date.split('T')[0]
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingId.value = null
  form.value = {
    year: new Date().getFullYear(),
    term: 1,
    startDate: '',
    endDate: ''
  }
}

const handleSubmit = async () => {
  isSubmitting.value = true
  
  try {
    const data = {
      year: form.value.year,
      term: form.value.term,
      startDate: form.value.startDate,
      endDate: form.value.endDate
    }
    
    if (editingId.value) {
      await api.put(`/semesters/${editingId.value}`, data)
      alert('학기 정보가 수정되었습니다.')
    } else {
      await api.post('/semesters', data)
      alert('학기가 추가되었습니다.')
    }
    
    closeModal()
    await fetchSemesters()
  } catch (error) {
    alert(error.message || '저장에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

const setCurrentSemester = async (semester) => {
  if (!confirm(`${semester.year}년 ${semester.term}학기를 현재 학기로 설정하시겠습니까?`)) return
  
  try {
    await api.put(`/semesters/${semester.id}/current`)
    await fetchSemesters()
    alert('현재 학기가 변경되었습니다.')
  } catch (error) {
    alert(error.message || '변경에 실패했습니다.')
  }
}

const deleteSemester = async (semester) => {
  if (!confirm(`${semester.year}년 ${semester.term}학기를 삭제하시겠습니까?`)) return
  
  try {
    await api.delete(`/semesters/${semester.id}`)
    await fetchSemesters()
    alert('학기가 삭제되었습니다.')
  } catch (error) {
    alert(error.message || '삭제에 실패했습니다.')
  }
}

onMounted(() => {
  fetchSemesters()
})
</script>
