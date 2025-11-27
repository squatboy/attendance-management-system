const express = require('express');
const router = express.Router();
const excuseController = require('../controllers/excuseController');
const { authenticate, isStudent, isInstructorOrAdmin } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');

// 모든 라우트에 인증 필요
router.use(authenticate);

// 공결 신청 목록 조회
router.get('/', excuseController.getExcuses);

// 공결 신청 상세 조회
router.get('/:id', excuseController.getExcuse);

// 공결 신청 생성 (학생만)
router.post('/', isStudent, upload.array('attachments', 5), excuseController.createExcuse);

// 공결 신청 처리 (교원/관리자)
router.put('/:id/process', isInstructorOrAdmin, excuseController.processExcuse);

// 공결 신청 삭제 (학생만, 본인의 대기 중인 신청만)
router.delete('/:id', isStudent, excuseController.deleteExcuse);

module.exports = router;
