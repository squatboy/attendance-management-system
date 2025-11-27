const express = require('express');
const router = express.Router();
const semesterController = require('../controllers/semesterController');
const { authenticate, isAdmin } = require('../middlewares/auth');

// 모든 라우트에 인증 필요
router.use(authenticate);

// 학기 목록 조회
router.get('/', semesterController.getSemesters);

// 현재 학기 조회
router.get('/current', semesterController.getCurrentSemester);

// 학기 생성 (관리자만)
router.post('/', isAdmin, semesterController.createSemester);

// 학기 수정 (관리자만)
router.put('/:id', isAdmin, semesterController.updateSemester);

// 학기 삭제 (관리자만)
router.delete('/:id', isAdmin, semesterController.deleteSemester);

// 주차 정보 조회
router.get('/:semesterId/weeks', semesterController.getWeeks);

// 주차 자동 생성 (관리자만)
router.post('/:semesterId/weeks/generate', isAdmin, semesterController.generateWeeks);

module.exports = router;
