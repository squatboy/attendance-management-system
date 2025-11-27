const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

// 로그인
router.post('/login', authController.login);

// 로그아웃
router.post('/logout', authController.logout);

// 현재 사용자 정보
router.get('/me', authenticate, authController.me);

// 프로필 업데이트
router.put('/profile', authenticate, authController.updateProfile);

// 비밀번호 변경
router.put('/change-password', authenticate, authController.changePassword);

// 토큰 갱신
router.post('/refresh', authenticate, authController.refresh);

module.exports = router;
