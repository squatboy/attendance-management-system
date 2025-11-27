<template>
  <div>
    <router-link to="/admin/users" class="text-gray-600 hover:text-gray-900 mb-4 inline-block">
      <i class="fa-solid fa-arrow-left mr-2"></i>
      사용자 목록
    </router-link>
    
    <div class="max-w-2xl mx-auto">
      <div class="card p-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-6">
          {{ isEdit ? '사용자 수정' : '사용자 추가' }}
        </h1>
        
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- 학번/직번 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">학번/직번 *</label>
            <input 
              v-model="form.studentId" 
              type="text" 
              class="input" 
              :disabled="isEdit"
              required 
            />
            <p class="text-xs text-gray-500 mt-1">학생: 9자리, 교원: I로 시작하는 8자리</p>
          </div>
          
          <!-- 이름 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
            <input v-model="form.name" type="text" class="input" required />
          </div>
          
          <!-- 이메일 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input v-model="form.email" type="email" class="input" />
          </div>
          
          <!-- 전화번호 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
            <input v-model="form.phone" type="tel" class="input" placeholder="010-0000-0000" />
          </div>
          
          <!-- 학과 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">학과</label>
            <input v-model="form.department" type="text" class="input" />
          </div>
          
          <!-- 역할 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">역할 *</label>
            <select v-model="form.role" class="input" required>
              <option value="">역할 선택</option>
              <option value="admin">관리자</option>
              <option value="instructor">교원</option>
              <option value="student">학생</option>
            </select>
          </div>
          
          <!-- 비밀번호 -->
          <div v-if="!isEdit">
            <label class="block text-sm font-medium text-gray-700 mb-1">비밀번호 *</label>
            <input v-model="form.password" type="password" class="input" :required="!isEdit" />
            <p class="text-xs text-gray-500 mt-1">영문, 숫자, 특수문자 포함 8자리 이상</p>
          </div>
          
          <!-- 비밀번호 변경 (수정 시) -->
          <div v-if="isEdit">
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input v-model="changePassword" type="checkbox" class="w-4 h-4" />
              비밀번호 변경
            </label>
            <input 
              v-if="changePassword"
              v-model="form.password" 
              type="password" 
              class="input mt-2" 
              placeholder="새 비밀번호"
            />
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
                저장 중...
              </template>
              <template v-else>
                <i class="fa-solid fa-check mr-2"></i>
                {{ isEdit ? '수정' : '추가' }}
              </template>
            </button>
            <router-link to="/admin/users" class="btn btn-secondary">취소</router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => route.params.id && route.params.id !== 'new')
const changePassword = ref(false)

const form = ref({
  studentId: '',
  name: '',
  email: '',
  phone: '',
  department: '',
  role: '',
  password: ''
})
const isSubmitting = ref(false)

const fetchUser = async () => {
  if (!isEdit.value) return
  
  try {
    const response = await api.get(`/users/${route.params.id}`)
    if (response.success) {
      const user = response.data
      form.value = {
        studentId: user.student_id,
        name: user.name,
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        role: user.role,
        password: ''
      }
    }
  } catch (error) {
    console.error('사용자 조회 오류:', error)
  }
}

const handleSubmit = async () => {
  isSubmitting.value = true
  
  try {
    const data = {
      studentId: form.value.studentId,
      name: form.value.name,
      email: form.value.email || null,
      phone: form.value.phone || null,
      department: form.value.department || null,
      role: form.value.role
    }
    
    if (!isEdit.value || (changePassword.value && form.value.password)) {
      data.password = form.value.password
    }
    
    if (isEdit.value) {
      await api.put(`/users/${route.params.id}`, data)
      alert('사용자 정보가 수정되었습니다.')
    } else {
      await api.post('/users', data)
      alert('사용자가 추가되었습니다.')
    }
    
    router.push('/admin/users')
  } catch (error) {
    alert(error.message || '저장에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchUser()
})
</script>
