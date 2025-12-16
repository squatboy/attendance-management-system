import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 레이아웃
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

// 페이지
import LoginPage from '@/pages/LoginPage.vue'

const routes = [
    // 인증 관련 라우트
    {
        path: '/login',
        component: AuthLayout,
        meta: { requiresAuth: false },
        children: [
            {
                path: '',
                name: 'login',
                component: LoginPage
            }
        ]
    },

    // 메인 라우트 (인증 필요)
    {
        path: '/',
        component: DefaultLayout,
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'dashboard',
                component: () => import('@/pages/DashboardPage.vue')
            },
            {
                path: 'profile',
                name: 'profile',
                component: () => import('@/pages/ProfilePage.vue')
            },

            // 강의 관련
            {
                path: 'courses',
                name: 'courses',
                component: () => import('@/pages/courses/CourseListPage.vue')
            },
            {
                path: 'courses/:id',
                name: 'course-detail',
                component: () => import('@/pages/courses/CourseDetailPage.vue')
            },

            // 출석 관련
            {
                path: 'courses/:courseId/attendance',
                name: 'attendance',
                component: () => import('@/pages/attendance/AttendanceListPage.vue')
            },
            {
                path: 'courses/:courseId/attendance/:sessionId',
                name: 'attendance-detail',
                component: () => import('@/pages/attendance/AttendanceDetailPage.vue')
            },
            {
                path: 'courses/:courseId/attendance/start',
                name: 'attendance-start',
                component: () => import('@/pages/attendance/AttendanceStartPage.vue'),
                meta: { roles: ['instructor', 'admin'] }
            },
            {
                path: 'attendance/check-in/:sessionId',
                name: 'attendance-checkin',
                component: () => import('@/pages/attendance/AttendanceCheckInPage.vue'),
                meta: { roles: ['student'] }
            },

            // 공결 신청
            {
                path: 'excuses',
                name: 'excuses',
                component: () => import('@/pages/excuses/ExcuseListPage.vue')
            },
            {
                path: 'excuses/new',
                name: 'excuse-new',
                component: () => import('@/pages/excuses/ExcuseFormPage.vue'),
                meta: { roles: ['student'] }
            },
            {
                path: 'excuses/:id',
                name: 'excuse-detail',
                component: () => import('@/pages/excuses/ExcuseDetailPage.vue')
            },

            // 이의 신청
            {
                path: 'appeals',
                name: 'appeals',
                component: () => import('@/pages/appeals/AppealListPage.vue')
            },
            {
                path: 'appeals/new',
                name: 'appeal-new',
                component: () => import('@/pages/appeals/AppealFormPage.vue'),
                meta: { roles: ['student'] }
            },
            {
                path: 'appeals/:id',
                name: 'appeal-detail',
                component: () => import('@/pages/appeals/AppealDetailPage.vue')
            },

            // 투표
            {
                path: 'polls',
                name: 'polls',
                component: () => import('@/pages/polls/PollListPage.vue')
            },
            {
                path: 'polls/new',
                name: 'poll-new',
                component: () => import('@/pages/polls/PollFormPage.vue'),
                meta: { roles: ['instructor', 'admin'] }
            },
            {
                path: 'polls/:id',
                name: 'poll-detail',
                component: () => import('@/pages/polls/PollDetailPage.vue')
            },

            // 쪽지
            {
                path: 'messages',
                name: 'messages',
                component: () => import('@/pages/messages/MessageListPage.vue')
            },
            {
                path: 'messages/new',
                name: 'message-new',
                component: () => import('@/pages/messages/MessageFormPage.vue')
            },
            {
                path: 'messages/:id',
                name: 'message-detail',
                component: () => import('@/pages/messages/MessageDetailPage.vue')
            },

            // 알림
            {
                path: 'notifications',
                name: 'notifications',
                component: () => import('@/pages/notifications/NotificationListPage.vue')
            },

            // 관리자 전용
            {
                path: 'admin/users',
                name: 'admin-users',
                component: () => import('@/pages/admin/UserListPage.vue'),
                meta: { roles: ['admin'] }
            },
            {
                path: 'admin/users/new',
                name: 'admin-user-new',
                component: () => import('@/pages/admin/UserFormPage.vue'),
                meta: { roles: ['admin'] }
            },
            {
                path: 'admin/users/:id',
                name: 'admin-user-edit',
                component: () => import('@/pages/admin/UserFormPage.vue'),
                meta: { roles: ['admin'] }
            },
            {
                path: 'admin/semesters',
                name: 'admin-semesters',
                component: () => import('@/pages/admin/SemesterListPage.vue'),
                meta: { roles: ['admin'] }
            },
            {
                path: 'admin/courses',
                name: 'admin-courses',
                component: () => import('@/pages/admin/CourseManagePage.vue'),
                meta: { roles: ['admin'] }
            },
            {
                path: 'admin/settings',
                name: 'admin-settings',
                component: () => import('@/pages/admin/SettingsPage.vue'),
                meta: { roles: ['admin'] }
            },
            {
                path: 'admin/audit-logs',
                name: 'admin-audit-logs',
                component: () => import('@/pages/admin/AuditLogPage.vue'),
                meta: { roles: ['admin'] }
            }
        ]
    },

    // 404
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: () => import('@/pages/NotFoundPage.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 네비게이션 가드
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // 인증이 필요한 페이지
    if (to.meta.requiresAuth) {
        if (!authStore.isAuthenticated) {
            return next({ name: 'login', query: { redirect: to.fullPath } })
        }

        // 역할 체크
        if (to.meta.roles && !to.meta.roles.includes(authStore.user?.role)) {
            return next({ name: 'dashboard' })
        }
    }

    // 로그인 페이지인데 이미 로그인된 경우
    if (to.name === 'login' && authStore.isAuthenticated) {
        return next({ name: 'dashboard' })
    }

    next()
})

export default router
