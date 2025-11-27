<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">사용자 관리</h1>
        <p class="text-gray-600 mt-1">시스템 사용자를 관리합니다</p>
      </div>
      <router-link to="/admin/users/new" class="btn btn-primary">
        <i class="fa-solid fa-plus mr-2"></i>
        사용자 추가
      </router-link>
    </div>
    
    <!-- 검색/필터 -->
    <div class="card p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <input 
          v-model="search" 
          type="text" 
          placeholder="이름 또는 학번 검색..." 
          class="input flex-1"
          @input="debounceSearch"
        />
        <select v-model="filter.role" class="input w-auto" @change="fetchUsers">
          <option value="">전체 역할</option>
          <option value="admin">관리자</option>
          <option value="instructor">교원</option>
          <option value="student">학생</option>
        </select>
      </div>
    </div>
    
    <div v-if="isLoading" class="text-center py-12">
      <i class="fa-solid fa-spinner fa-spin text-4xl text-primary-600"></i>
    </div>
    
    <div v-else class="card overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학번/직번</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">역할</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가입일</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <i class="fa-solid fa-user text-gray-500"></i>
                </div>
                <div class="ml-4">
                  <div class="font-medium text-gray-900">{{ user.name }}</div>
                  <div class="text-sm text-gray-500">{{ user.email }}</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ user.student_id }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="getRoleBadge(user.role)">{{ getRoleLabel(user.role) }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="user.is_active ? 'badge badge-success' : 'badge badge-danger'">
                {{ user.is_active ? '활성' : '비활성' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(user.created_at) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
              <router-link :to="`/admin/users/${user.id}`" class="text-primary-600 hover:text-primary-900 mr-3">
                수정
              </router-link>
              <button 
                @click="toggleUserStatus(user)"
                :class="user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'"
              >
                {{ user.is_active ? '비활성화' : '활성화' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- 페이지네이션 -->
      <div v-if="totalPages > 1" class="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-500">총 {{ totalCount }}명</p>
          <div class="flex gap-2">
            <button 
              @click="page--" 
              :disabled="page === 1"
              class="btn btn-secondary btn-sm"
            >
              이전
            </button>
            <span class="px-3 py-1 text-sm">{{ page }} / {{ totalPages }}</span>
            <button 
              @click="page++"
              :disabled="page === totalPages"
              class="btn btn-secondary btn-sm"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import api from '@/api'

const users = ref([])
const isLoading = ref(true)
const search = ref('')
const filter = ref({ role: '' })
const page = ref(1)
const totalCount = ref(0)
const totalPages = ref(1)

let searchTimeout = null

const getRoleBadge = (role) => {
  const classes = {
    admin: 'badge badge-danger',
    instructor: 'badge badge-info',
    student: 'badge badge-success'
  }
  return classes[role] || 'badge badge-gray'
}

const getRoleLabel = (role) => {
  const labels = {
    admin: '관리자',
    instructor: '교원',
    student: '학생'
  }
  return labels[role] || role
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ko-KR')
}

const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    fetchUsers()
  }, 300)
}

const fetchUsers = async () => {
  isLoading.value = true
  try {
    const params = new URLSearchParams()
    if (search.value) params.append('search', search.value)
    if (filter.value.role) params.append('role', filter.value.role)
    params.append('page', page.value)
    params.append('limit', 20)
    
    const response = await api.get(`/users?${params}`)
    if (response.success) {
      users.value = response.data.users
      totalCount.value = response.data.total
      totalPages.value = response.data.totalPages
    }
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error)
  } finally {
    isLoading.value = false
  }
}

const toggleUserStatus = async (user) => {
  const action = user.is_active ? '비활성화' : '활성화'
  if (!confirm(`${user.name}님을 ${action}하시겠습니까?`)) return
  
  try {
    await api.put(`/users/${user.id}/status`, {
      isActive: !user.is_active
    })
    user.is_active = !user.is_active
  } catch (error) {
    alert(error.message || '상태 변경에 실패했습니다.')
  }
}

watch(page, () => {
  fetchUsers()
})

onMounted(() => {
  fetchUsers()
})
</script>
