<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">내 프로필</h1>
      <p class="text-gray-600 mt-1">개인 정보를 확인하고 수정합니다</p>
    </div>
    
    <div class="card">
      <!-- 프로필 헤더 -->
      <div class="p-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-t-xl">
        <div class="flex items-center gap-4">
          <div class="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <i class="fa-solid fa-user text-4xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold">{{ user.name }}</h2>
            <p class="text-primary-100">{{ user.student_id }}</p>
            <span class="inline-block mt-1 px-2 py-1 bg-white/20 rounded-full text-sm">
              {{ getRoleLabel(user.role) }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- 프로필 정보 -->
      <div class="p-6">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <input v-model="form.name" type="text" class="input" required />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">학번/직번</label>
            <input :value="user.student_id" type="text" class="input bg-gray-50" disabled />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input v-model="form.email" type="email" class="input" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
            <input v-model="form.phone" type="tel" class="input" placeholder="010-0000-0000" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">학과</label>
            <input v-model="form.department" type="text" class="input" />
          </div>
          
          <div class="pt-4 flex gap-3">
            <button type="submit" class="btn btn-primary flex-1" :disabled="isSaving">
              <template v-if="isSaving">
                <i class="fa-solid fa-spinner fa-spin mr-2"></i>
                저장 중...
              </template>
              <template v-else>
                <i class="fa-solid fa-save mr-2"></i>
                저장
              </template>
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- 비밀번호 변경 -->
    <div class="card mt-6">
      <div class="p-6 border-b border-gray-100">
        <h3 class="font-bold text-gray-900">비밀번호 변경</h3>
      </div>
      <div class="p-6">
        <form @submit.prevent="changePassword" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">현재 비밀번호</label>
            <input v-model="passwordForm.currentPassword" type="password" class="input" required />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
            <input v-model="passwordForm.newPassword" type="password" class="input" required />
            <p class="text-xs text-gray-500 mt-1">영문, 숫자, 특수문자 포함 8자리 이상</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인</label>
            <input v-model="passwordForm.confirmPassword" type="password" class="input" required />
          </div>
          
          <button type="submit" class="btn btn-secondary" :disabled="isChangingPassword">
            <template v-if="isChangingPassword">
              <i class="fa-solid fa-spinner fa-spin mr-2"></i>
              변경 중...
            </template>
            <template v-else>
              <i class="fa-solid fa-key mr-2"></i>
              비밀번호 변경
            </template>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'

const authStore = useAuthStore()
const user = ref({})
const isSaving = ref(false)
const isChangingPassword = ref(false)

const form = ref({
  name: '',
  email: '',
  phone: '',
  department: ''
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const getRoleLabel = (role) => {
  const labels = {
    admin: '관리자',
    instructor: '교원',
    student: '학생'
  }
  return labels[role] || role
}

const fetchProfile = async () => {
  try {
    const response = await api.get('/auth/me')
    if (response.success) {
      user.value = response.data
      form.value = {
        name: response.data.name,
        email: response.data.email || '',
        phone: response.data.phone || '',
        department: response.data.department || ''
      }
    }
  } catch (error) {
    console.error('프로필 조회 오류:', error)
  }
}

const handleSubmit = async () => {
  isSaving.value = true
  try {
    await api.put('/auth/profile', form.value)
    user.value.name = form.value.name
    authStore.user.name = form.value.name
    alert('프로필이 저장되었습니다.')
  } catch (error) {
    alert(error.message || '저장에 실패했습니다.')
  } finally {
    isSaving.value = false
  }
}

const changePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    alert('새 비밀번호가 일치하지 않습니다.')
    return
  }
  
  if (passwordForm.value.newPassword.length < 8) {
    alert('비밀번호는 8자리 이상이어야 합니다.')
    return
  }
  
  isChangingPassword.value = true
  try {
    await api.put('/auth/change-password', {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    })
    alert('비밀번호가 변경되었습니다.')
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  } catch (error) {
    alert(error.message || '비밀번호 변경에 실패했습니다.')
  } finally {
    isChangingPassword.value = false
  }
}

onMounted(() => {
  fetchProfile()
})
</script>
