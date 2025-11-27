import { defineStore } from 'pinia'
import api from '@/api'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        isLoading: false
    }),

    getters: {
        isAuthenticated: (state) => !!state.user,
        isAdmin: (state) => state.user?.role === 'admin',
        isInstructor: (state) => state.user?.role === 'instructor',
        isStudent: (state) => state.user?.role === 'student'
    },

    actions: {
        async login(studentId, password) {
            this.isLoading = true
            try {
                const response = await api.post('/auth/login', { studentId, password })
                if (response.success) {
                    this.user = response.data
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
                console.error('로그아웃 오류:', error)
            } finally {
                this.user = null
            }
        },

        async checkAuth() {
            try {
                const response = await api.get('/auth/me')
                if (response.success) {
                    this.user = response.data
                }
            } catch (error) {
                this.user = null
            }
        },

        async refreshToken() {
            try {
                await api.post('/auth/refresh')
            } catch (error) {
                this.user = null
                throw error
            }
        }
    }
})
