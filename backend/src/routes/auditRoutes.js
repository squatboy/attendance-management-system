const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticate, isAdmin } = require('../middlewares/auth');

// 모든 라우트에 인증 필요
router.use(authenticate);

// 감사 로그 조회 (관리자만)
router.get('/', isAdmin, auditController.getAuditLogs);

module.exports = router;
