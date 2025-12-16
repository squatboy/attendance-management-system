const db = require('../models/db');

// 감사 로그 목록 조회
exports.getAuditLogs = async (req, res) => {
    try {
        const { action, search, startDate, endDate, page = 1, limit = 50 } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 50;
        const offset = (pageNum - 1) * limitNum;

        let query = `
            SELECT al.*, u.name as user_name, u.student_id
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE 1=1
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1';
        const params = [];
        const countParams = [];

        if (action) {
            query += ' AND al.action = ?';
            countQuery += ' AND action = ?';
            params.push(action);
            countParams.push(action);
        }

        if (search) {
            query += ' AND (u.name LIKE ? OR u.student_id LIKE ?)';
            countQuery += ' AND (u.name LIKE ? OR u.student_id LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
            countParams.push(`%${search}%`, `%${search}%`);
        }

        if (startDate) {
            query += ' AND DATE(al.created_at) >= ?';
            countQuery += ' AND DATE(created_at) >= ?';
            params.push(startDate);
            countParams.push(startDate);
        }

        if (endDate) {
            query += ' AND DATE(al.created_at) <= ?';
            countQuery += ' AND DATE(created_at) <= ?';
            params.push(endDate);
            countParams.push(endDate);
        }

        query += ` ORDER BY al.created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

        const [logs] = await db.execute(query, params);
        const [countResult] = await db.execute(countQuery, countParams);
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limitNum);

        // 로그 데이터 포맷팅
        const formattedLogs = logs.map(log => {
            let details = '-';
            if (log.new_values) {
                try {
                    const parsedData = typeof log.new_values === 'string' ? JSON.parse(log.new_values) : log.new_values;
                    details = JSON.stringify(parsedData, null, 2);
                } catch (e) {
                    details = log.new_values;
                }
            }

            return {
                id: log.id,
                user_name: log.user_name || '(삭제된 사용자)',
                student_id: log.student_id || '-',
                action: log.action,
                details: details,
                ip_address: log.ip_address || '-',
                created_at: log.created_at
            };
        });

        res.json({
            success: true,
            data: {
                logs: formattedLogs,
                total,
                totalPages,
                page: pageNum,
                limit: limitNum
            }
        });

    } catch (error) {
        console.error('감사 로그 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};
