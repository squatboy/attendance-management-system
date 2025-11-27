const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middlewares/auth');

// 모든 라우트에 인증 필요
router.use(authenticate);

// 받은 쪽지 목록 조회
router.get('/received', messageController.getReceivedMessages);

// 보낸 쪽지 목록 조회
router.get('/sent', messageController.getSentMessages);

// 읽지 않은 쪽지 수 조회
router.get('/unread-count', messageController.getUnreadCount);

// 쪽지 상세 조회
router.get('/:id', messageController.getMessage);

// 쪽지 보내기
router.post('/', messageController.sendMessage);

// 쪽지 삭제
router.delete('/:id', messageController.deleteMessage);

module.exports = router;
