const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { isAdmin } = require('../middlewares/auth');

// GET /api/settings - 설정 조회 (관리자만)
router.get('/', isAdmin, settingsController.getSettings);

// PUT /api/settings - 설정 업데이트 (관리자만)
router.put('/', isAdmin, settingsController.updateSettings);

module.exports = router;
