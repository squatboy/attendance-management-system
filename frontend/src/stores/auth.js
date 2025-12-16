import { defineStore } from 'pinia'
import api from '@/api'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        isLoading: false,
        token: null
    }),

    getters: {
        isAuthenticated: (state) => !!state.user,
        isAdmin: (state) => state.user?.role === 'admin',
        isInstructor: (state) => state.user?.role === 'instructor',
        isStudent: (state) => state.user?.role === 'student'
    },

    actions: {
        initToken() {
            // 페이지 로드 시 localStorage에서 토큰 가져오기
            const savedToken = localStorage.getItem('token')
            if (savedToken) {
                this.token = savedToken
                console.log('[Auth] Token initialized from localStorage')
            }
        },

        async login(studentId, password) {
            this.isLoading = true
            try {
                const response = await api.post('/auth/login', { studentId, password })
                if (response.success) {
                    this.user = response.data
                    this.token = response.data.token
                    // 로컬 스토리지에 토큰 저장
                    localStorage.setItem('token', response.data.token)
                    // API 기본 헤더에 토큰 추가
                    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
                    console.log('[Auth] ✓ Login successful for:', this.user.name)
                }
                return response
            } catch (error) {
                throw error
            } finally {
                this.isLoading = false
            }
        },

        async logout() {
            try {
                await api.post('/auth/logout')
            } catch (error) {
                console.error('[Auth] Logout error:', error)
            } finally {
                this.user = null
                this.token = null
                localStorage.removeItem('token')
                delete api.defaults.headers.common['Authorization']
                console.log('[Auth] ✓ Logged out')
            }
        },

        async checkAuth() {
            try {
                // 저장된 토큰이 없으면 인증 실패
                if (!this.token) {
                    console.log('[Auth] No token available')
                    this.user = null
                    return
                }

                console.log('[Auth] Token found, verifying with backend...')

                // 저장된 토큰이 있으면 헤더에 추가
                api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`

                const response = await api.get('/auth/me')
                console.log('[Auth] /auth/me response:', response)

                if (response && response.success) {
                    this.user = response.data
                    console.log('[Auth] ✓ Auth check success:', this.user.name)
                    return true
                } else {
                    console.log('[Auth] Response success is false:', response)
                    this.user = null
                    this.token = null
                    localStorage.removeItem('token')
                    delete api.defaults.headers.common['Authorization']
                    return false
                }
            } catch (error) {
                console.error('[Auth] ✗ Auth check error:', error)
                console.error('[Auth] Error details:', {
                    message: error.message,
                    status: error.status,
                    data: error.data
                })
                this.user = null
                this.token = null
                localStorage.removeItem('token')
                delete api.defaults.headers.common['Authorization']
                return false
            }
        },

        async refreshToken() {
            try {
                await api.post('/auth/refresh')
            } catch (error) {
                this.user = null
                this.token = null
                localStorage.removeItem('token')
                throw error
            }
        }
    }
})
