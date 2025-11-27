const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticate, isAdmin, isInstructor, isInstructorOrAdmin } = require('../middlewares/auth');

// 모든 라우트에 인증 필요
router.use(authenticate);

// 강의 목록 조회
router.get('/', courseController.getCourses);

// 강의 상세 조회
router.get('/:id', courseController.getCourse);

// 강의 생성 (관리자만)
router.post('/', isAdmin, courseController.createCourse);

// 강의 수정 (관리자만)
router.put('/:id', isAdmin, courseController.updateCourse);

// 강의 삭제 (관리자만)
router.delete('/:id', isAdmin, courseController.deleteCourse);

// 수강생 목록 조회 (교원/관리자)
router.get('/:id/students', isInstructorOrAdmin, courseController.getStudents);

// 수강생 등록 (관리자만)
router.post('/:id/students', isAdmin, courseController.enrollStudent);

// 강의 공지 작성 (교원/관리자) - 수강생 전체 알림
router.post('/:id/announcements', isInstructorOrAdmin, courseController.createAnnouncement);

module.exports = router;
