const db = require('../models/db');

// 감사 로그 기록
const logAudit = async (userId, action, targetType, targetId, oldValue = null, newValue = null, req = null) => {
    try {
        const ipAddress = req ? (req.ip || req.connection?.remoteAddress || null) : null;
        const userAgent = req ? (req.headers['user-agent'] || null) : null;

        await db.execute(
            `INSERT INTO audit_logs (user_id, action, target_type, target_id, old_value, new_value, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                action,
                targetType,
                targetId,
                oldValue ? JSON.stringify(oldValue) : null,
                newValue ? JSON.stringify(newValue) : null,
                ipAddress,
                userAgent
            ]
        );
    } catch (error) {
        console.error('감사 로그 기록 오류:', error);
    }
};

// 감사 로그 미들웨어 (특정 라우트에서 사용)
const auditMiddleware = (action, targetType) => {
    return (req, res, next) => {
        // 응답 후 로그 기록을 위해 res.on('finish') 사용
        const originalJson = res.json.bind(res);

        res.json = function (data) {
            if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
                const targetId = req.params.id || data?.data?.id || 0;
                logAudit(req.user.id, action, targetType, targetId, req.body._oldValue, req.body, req);
            }
            return originalJson(data);
        };

        next();
    };
};

module.exports = {
    logAudit,
    auditMiddleware
};
