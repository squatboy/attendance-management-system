const express = require('express');
const router = express.Router();
const appealController = require('../controllers/appealController');
const { authenticate, isStudent, isInstructorOrAdmin } = require('../middlewares/auth');

// 모든 라우트에 인증 필요
router.use(authenticate);

// 이의 신청 목록 조회
router.get('/', appealController.getAppeals);

// 이의 신청 상세 조회
router.get('/:id', appealController.getAppeal);

// 이의 신청 생성 (학생만)
router.post('/', isStudent, appealController.createAppeal);

// 이의 신청 처리 (교원/관리자)
router.put('/:id/process', isInstructorOrAdmin, appealController.processAppeal);

module.exports = router;
