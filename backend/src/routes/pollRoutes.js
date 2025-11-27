const express = require('express');
const router = express.Router();
const pollController = require('../controllers/pollController');
const { authenticate, isInstructor, isInstructorOrAdmin } = require('../middlewares/auth');

// 모든 라우트에 인증 필요
router.use(authenticate);

// 투표 목록 조회
router.get('/', pollController.getPolls);

// 투표 상세 조회
router.get('/:id', pollController.getPoll);

// 투표 생성 (교원만)
router.post('/', isInstructor, pollController.createPoll);

// 투표하기
router.post('/:id/vote', pollController.vote);

// 투표 종료 (교원/관리자)
router.post('/:id/close', isInstructorOrAdmin, pollController.closePoll);

// 투표 삭제 (교원/관리자)
router.delete('/:id', isInstructorOrAdmin, pollController.deletePoll);

module.exports = router;
