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

// 요청 인터셉터
api.interceptors.request.use(
    (config) => {
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

            // 인증 오류
            if (status === 401) {
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

export default api
