import { defineStore } from 'pinia'
import api from '@/api'

export const useNotificationStore = defineStore('notification', {
    state: () => ({
        notifications: [],
        unreadCount: 0
    }),

    actions: {
        async fetchNotifications(unreadOnly = false) {
            try {
                const response = await api.get('/notifications', {
                    params: { unreadOnly }
                })
                if (response.success) {
                    this.notifications = response.data.notifications
                    this.unreadCount = response.data.unreadCount
                }
            } catch (error) {
                console.error('알림 조회 오류:', error)
            }
        },

        async fetchUnreadCount() {
            try {
                const response = await api.get('/notifications/unread-count')
                if (response.success) {
                    this.unreadCount = response.data.count
                }
            } catch (error) {
                console.error('알림 수 조회 오류:', error)
            }
        },

        async markAsRead(id) {
            try {
                await api.put(`/notifications/${id}/read`)
                const notification = this.notifications.find(n => n.id === id)
                if (notification && !notification.is_read) {
                    notification.is_read = true
                    this.unreadCount--
                }
            } catch (error) {
                console.error('알림 읽음 처리 오류:', error)
            }
        },

        async markAllAsRead() {
            try {
                await api.put('/notifications/read-all')
                this.notifications.forEach(n => n.is_read = true)
                this.unreadCount = 0
            } catch (error) {
                console.error('전체 읽음 처리 오류:', error)
            }
        },

        async deleteNotification(id) {
            try {
                await api.delete(`/notifications/${id}`)
                const index = this.notifications.findIndex(n => n.id === id)
                if (index !== -1) {
                    if (!this.notifications[index].is_read) {
                        this.unreadCount--
                    }
                    this.notifications.splice(index, 1)
                }
            } catch (error) {
                console.error('알림 삭제 오류:', error)
            }
        }
    }
})
