const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/auth');

// 모든 라우트에 인증 필요
router.use(authenticate);

// 알림 목록 조회
router.get('/', notificationController.getNotifications);

// 읽지 않은 알림 수 조회
router.get('/unread-count', notificationController.getUnreadCount);

// 알림 읽음 처리
router.put('/:id/read', notificationController.markAsRead);

// 모든 알림 읽음 처리
router.put('/read-all', notificationController.markAllAsRead);

// 알림 삭제
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
