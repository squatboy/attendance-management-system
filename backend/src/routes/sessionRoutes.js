const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { authenticate, isInstructor, isStudent, isInstructorOrAdmin } = require('../middlewares/auth');

// 모든 라우트에 인증 필요
router.use(authenticate);

// 강의별 출석 세션 목록 조회
router.get('/course/:courseId', sessionController.getSessions);

// 세션 상세 조회
router.get('/:sessionId', sessionController.getSession);

// 출석 세션 생성 (교원만)
router.post('/course/:courseId', isInstructor, sessionController.createSession);

// 출석 코드 갱신 (교원만)
router.post('/:sessionId/refresh-code', isInstructor, sessionController.refreshCode);

// 세션 종료 (교원만)
router.post('/:sessionId/close', isInstructor, sessionController.closeSession);

// 학생 출석 체크 (코드 입력)
router.post('/:sessionId/check-in', isStudent, sessionController.checkIn);

// 호명 방식 출석 처리 (교원만)
router.post('/:sessionId/roll-call', isInstructor, sessionController.rollCall);

// 개별 출석 상태 변경 (교원/관리자)
router.put('/:sessionId/attendance/:studentId', isInstructorOrAdmin, sessionController.updateAttendance);

// 학생 출석 현황 조회
router.get('/course/:courseId/my-attendance', isStudent, sessionController.getMyAttendance);

// 강의 출석 통계 (교원/관리자)
router.get('/course/:courseId/stats', isInstructorOrAdmin, sessionController.getCourseStats);

module.exports = router;
