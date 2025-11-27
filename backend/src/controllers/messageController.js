const db = require('../models/db');

// 쪽지 목록 조회 (받은 쪽지)
exports.getReceivedMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const [messages] = await db.execute(`
      SELECT m.*, u.name as sender_name, u.student_id as sender_student_id
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.receiver_id = ? AND m.receiver_deleted = FALSE
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, parseInt(limit), offset]);

        const [countResult] = await db.execute(
            'SELECT COUNT(*) as total FROM messages WHERE receiver_id = ? AND receiver_deleted = FALSE',
            [userId]
        );

        res.json({
            success: true,
            data: {
                messages,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limit)
                }
            }
        });

    } catch (error) {
        console.error('받은 쪽지 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 보낸 쪽지 목록 조회
exports.getSentMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const [messages] = await db.execute(`
      SELECT m.*, u.name as receiver_name, u.student_id as receiver_student_id
      FROM messages m
      JOIN users u ON m.receiver_id = u.id
      WHERE m.sender_id = ? AND m.sender_deleted = FALSE
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, parseInt(limit), offset]);

        const [countResult] = await db.execute(
            'SELECT COUNT(*) as total FROM messages WHERE sender_id = ? AND sender_deleted = FALSE',
            [userId]
        );

        res.json({
            success: true,
            data: {
                messages,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limit)
                }
            }
        });

    } catch (error) {
        console.error('보낸 쪽지 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 쪽지 상세 조회
exports.getMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [messages] = await db.execute(`
      SELECT m.*, 
             sender.name as sender_name, sender.student_id as sender_student_id,
             receiver.name as receiver_name, receiver.student_id as receiver_student_id
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users receiver ON m.receiver_id = receiver.id
      WHERE m.id = ? AND (m.sender_id = ? OR m.receiver_id = ?)
    `, [id, userId, userId]);

        if (messages.length === 0) {
            return res.status(404).json({
                success: false,
                message: '쪽지를 찾을 수 없습니다.'
            });
        }

        // 수신자가 읽는 경우 읽음 처리
        if (messages[0].receiver_id === userId && !messages[0].is_read) {
            await db.execute('UPDATE messages SET is_read = TRUE WHERE id = ?', [id]);
        }

        res.json({
            success: true,
            data: messages[0]
        });

    } catch (error) {
        console.error('쪽지 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 쪽지 보내기
exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user.id;

        if (senderId === receiverId) {
            return res.status(400).json({
                success: false,
                message: '자신에게 쪽지를 보낼 수 없습니다.'
            });
        }

        // 수신자 확인
        const [receivers] = await db.execute('SELECT id FROM users WHERE id = ?', [receiverId]);
        if (receivers.length === 0) {
            return res.status(404).json({
                success: false,
                message: '수신자를 찾을 수 없습니다.'
            });
        }

        const [result] = await db.execute(
            'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
            [senderId, receiverId, content]
        );

        // 수신자에게 알림
        await db.execute(
            `INSERT INTO notifications (user_id, type, title, message, related_type, related_id)
       VALUES (?, 'message', '새 쪽지', ?, 'message', ?)`,
            [receiverId, `${req.user.name}님이 쪽지를 보냈습니다.`, result.insertId]
        );

        res.status(201).json({
            success: true,
            message: '쪽지가 전송되었습니다.',
            data: { id: result.insertId }
        });

    } catch (error) {
        console.error('쪽지 전송 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 쪽지 삭제 (본인의 목록에서만)
exports.deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // 발신자/수신자 확인
        const [messages] = await db.execute(
            'SELECT * FROM messages WHERE id = ?',
            [id]
        );

        if (messages.length === 0) {
            return res.status(404).json({
                success: false,
                message: '쪽지를 찾을 수 없습니다.'
            });
        }

        const message = messages[0];

        if (message.sender_id === userId) {
            await db.execute('UPDATE messages SET sender_deleted = TRUE WHERE id = ?', [id]);
        } else if (message.receiver_id === userId) {
            await db.execute('UPDATE messages SET receiver_deleted = TRUE WHERE id = ?', [id]);
        } else {
            return res.status(403).json({
                success: false,
                message: '권한이 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '쪽지가 삭제되었습니다.'
        });

    } catch (error) {
        console.error('쪽지 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 읽지 않은 쪽지 수
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const [result] = await db.execute(
            'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = FALSE AND receiver_deleted = FALSE',
            [userId]
        );

        res.json({
            success: true,
            data: { count: result[0].count }
        });

    } catch (error) {
        console.error('읽지 않은 쪽지 수 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};
