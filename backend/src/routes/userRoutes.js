const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, isAdmin } = require('../middlewares/auth');

// 모든 라우트에 인증 필요
router.use(authenticate);

// 사용자 목록 조회 (관리자만)
router.get('/', isAdmin, userController.getUsers);

// 사용자 상세 조회 (관리자만)
router.get('/:id', isAdmin, userController.getUser);

// 사용자 생성 (관리자만)
router.post('/', isAdmin, userController.createUser);

// 사용자 수정 (관리자만)
router.put('/:id', isAdmin, userController.updateUser);

// 사용자 삭제 (관리자만)
router.delete('/:id', isAdmin, userController.deleteUser);

module.exports = router;
