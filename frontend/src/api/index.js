import axios from 'axios'
import router from '@/router'

const api = axios.create({
    baseURL: '/api',
    timeout: 10000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
})

// 요청 인터셉터 - Authorization 헤더 자동 추가
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// 응답 인터셉터
api.interceptors.response.use(
    (response) => {
        return response.data
    },
    (error) => {
        if (error.response) {
            const { status, data } = error.response

            // 인증 오류 - 토큰 제거 후 로그인 페이지로
            if (status === 401) {
                localStorage.removeItem('token')
                router.push({ name: 'login' })
            }

            // 권한 오류
            if (status === 403) {
                alert('권한이 없습니다.')
            }

            return Promise.reject(data)
        }

        return Promise.reject({
            success: false,
            message: '네트워크 오류가 발생했습니다.'
        })
    }
)

// 메시지 API
export const messageApi = {
    // 메시지 전송
    sendMessage: (receiverId, content) => {
        return api.post('/messages', { receiver_id: receiverId, content })
    },

    // 대화 목록 조회
    getConversations: () => {
        return api.get('/messages/conversations')
    },

    // 특정 사용자와의 메시지 내역 조회
    getMessages: (otherUserId, page = 1, limit = 50) => {
        return api.get(`/messages/${otherUserId}`, { params: { page, limit } })
    },

    // 메시지 읽음 처리
    markAsRead: (otherUserId) => {
        return api.put(`/messages/${otherUserId}/read`)
    },

    // 읽지 않은 메시지 수 조회
    getUnreadCount: () => {
        return api.get('/messages/unread/count')
    },

    // 메시지 검색
    searchMessages: (keyword) => {
        return api.get('/messages/search/keyword', { params: { keyword } })
    },

    // 모든 사용자 조회 (메시지 전송 대상)
    getAllUsers: () => {
        return api.get('/messages/users/all')
    }
}

export default api
