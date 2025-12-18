const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middlewares/auth');

// 메시지 전송
router.post('/', authenticateToken, messageController.sendMessage);

// 대화 목록 조회 (대화 상대 목록)
router.get('/conversations', authenticateToken, messageController.getConversations);

// 읽지 않은 메시지 수 조회 (파라미터 라우트보다 먼저 정의)
router.get('/unread/count', authenticateToken, messageController.getUnreadCount);

// 메시지 검색 (파라미터 라우트보다 먼저 정의)
router.get('/search/keyword', authenticateToken, messageController.searchMessages);

// 메시지 전송 가능한 사용자 목록 조회 (파라미터 라우트보다 먼저 정의)
router.get('/users/all', authenticateToken, messageController.getAllUsers);

// 특정 사용자와의 메시지 내역 조회
router.get('/:otherUserId', authenticateToken, messageController.getMessages);

// 메시지 읽음 처리
router.put('/:otherUserId/read', authenticateToken, messageController.markAsRead);

module.exports = router;
