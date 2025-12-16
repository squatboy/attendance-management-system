const db = require('../models/db');

// 알림 목록 조회
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { unreadOnly, page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        let query = 'SELECT * FROM notifications WHERE user_id = ?';
        const params = [userId];

        if (unreadOnly === 'true') {
            query += ' AND is_read = FALSE';
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limitNum, offset);

        const [notifications] = await db.execute(query, params);

        // 읽지 않은 알림 수
        const [unreadCount] = await db.execute(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount: unreadCount[0].count
            }
        });

    } catch (error) {
        console.error('알림 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 알림 읽음 처리
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await db.execute(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        res.json({
            success: true,
            message: '알림을 읽음 처리했습니다.'
        });

    } catch (error) {
        console.error('알림 읽음 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 모든 알림 읽음 처리
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await db.execute(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: '모든 알림을 읽음 처리했습니다.'
        });

    } catch (error) {
        console.error('모든 알림 읽음 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 알림 삭제
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await db.execute(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        res.json({
            success: true,
            message: '알림이 삭제되었습니다.'
        });

    } catch (error) {
        console.error('알림 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 읽지 않은 알림 수 조회
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const [result] = await db.execute(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );

        res.json({
            success: true,
            data: { count: result[0].count }
        });

    } catch (error) {
        console.error('알림 수 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};
