const db = require('../models/db');

// 메시지 전송 (알림 자동 생성)
exports.sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiver_id, content } = req.body;

        // 유효성 검사
        if (!receiver_id || !content || content.trim() === '') {
            return res.status(400).json({
                success: false,
                message: '수신자와 메시지 내용은 필수입니다.'
            });
        }

        // 자기 자신에게는 메시지를 보낼 수 없음
        if (senderId === parseInt(receiver_id)) {
            return res.status(400).json({
                success: false,
                message: '자기 자신에게는 메시지를 보낼 수 없습니다.'
            });
        }

        // 수신자가 존재하는지 확인
        const [receiverCheck] = await db.execute(
            'SELECT id, name FROM users WHERE id = ?',
            [receiver_id]
        );

        if (receiverCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: '수신자를 찾을 수 없습니다.'
            });
        }

        // 발신자 정보 가져오기
        const [senderInfo] = await db.execute(
            'SELECT name FROM users WHERE id = ?',
            [senderId]
        );

        // 메시지 저장
        const [result] = await db.execute(
            'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
            [senderId, receiver_id, content]
        );

        // 알림 생성
        await db.execute(
            `INSERT INTO notifications (user_id, type, title, message, related_id) 
             VALUES (?, 'message', ?, ?, ?)`,
            [
                receiver_id,
                '새 메시지',
                `${senderInfo[0].name}님으로부터 새 메시지가 도착했습니다.`,
                result.insertId
            ]
        );

        res.status(201).json({
            success: true,
            message: '메시지가 전송되었습니다.',
            data: {
                id: result.insertId,
                sender_id: senderId,
                receiver_id: parseInt(receiver_id),
                content,
                is_read: false,
                created_at: new Date()
            }
        });

    } catch (error) {
        console.error('메시지 전송 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 메시지 목록 조회 (대화 상대 목록)
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        // 최근 메시지를 기준으로 대화 상대 목록 조회 (단순화된 쿼리)
        const [conversations] = await db.execute(
            `SELECT DISTINCT
                IF(m.sender_id = ?, m.receiver_id, m.sender_id) as user_id,
                u.name,
                u.student_id,
                u.role,
                (SELECT content FROM messages 
                 WHERE (sender_id = ? AND receiver_id = user_id) OR (sender_id = user_id AND receiver_id = ?)
                 ORDER BY created_at DESC LIMIT 1) as last_message,
                (SELECT created_at FROM messages 
                 WHERE (sender_id = ? AND receiver_id = user_id) OR (sender_id = user_id AND receiver_id = ?)
                 ORDER BY created_at DESC LIMIT 1) as last_message_time,
                (SELECT COUNT(*) FROM messages 
                 WHERE receiver_id = ? AND sender_id = user_id AND is_read = FALSE) as unread_count
            FROM messages m
            JOIN users u ON u.id = IF(m.sender_id = ?, m.receiver_id, m.sender_id)
            WHERE m.sender_id = ? OR m.receiver_id = ?
            ORDER BY last_message_time DESC`,
            [userId, userId, userId, userId, userId, userId, userId, userId, userId]
        );

        res.json({
            success: true,
            data: conversations
        });

    } catch (error) {
        console.error('대화 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 특정 사용자와의 메시지 내역 조회
exports.getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { otherUserId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 50;
        const offset = (pageNum - 1) * limitNum;

        // 상대방 정보 조회
        const [otherUserInfo] = await db.execute(
            'SELECT id, name, student_id, role FROM users WHERE id = ?',
            [otherUserId]
        );

        if (otherUserInfo.length === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        // 메시지 내역 조회
        const [messages] = await db.execute(
            `SELECT m.*, 
                    sender.name as sender_name,
                    sender.student_id as sender_student_id,
                    receiver.name as receiver_name,
                    receiver.student_id as receiver_student_id
             FROM messages m
             JOIN users sender ON m.sender_id = sender.id
             JOIN users receiver ON m.receiver_id = receiver.id
             WHERE (m.sender_id = ? AND m.receiver_id = ?) 
                OR (m.sender_id = ? AND m.receiver_id = ?)
             ORDER BY m.created_at DESC
             LIMIT ${limitNum} OFFSET ${offset}`,
            [userId, otherUserId, otherUserId, userId]
        );

        // 받은 메시지 읽음 처리
        await db.execute(
            'UPDATE messages SET is_read = TRUE WHERE receiver_id = ? AND sender_id = ? AND is_read = FALSE',
            [userId, otherUserId]
        );

        res.json({
            success: true,
            data: {
                otherUser: otherUserInfo[0],
                messages: messages.reverse() // 시간순 정렬 (오래된 것부터)
            }
        });

    } catch (error) {
        console.error('메시지 내역 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 메시지 읽음 처리
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { otherUserId } = req.params;

        await db.execute(
            'UPDATE messages SET is_read = TRUE WHERE receiver_id = ? AND sender_id = ?',
            [userId, otherUserId]
        );

        res.json({
            success: true,
            message: '메시지를 읽음 처리했습니다.'
        });

    } catch (error) {
        console.error('메시지 읽음 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 읽지 않은 메시지 수 조회
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const [result] = await db.execute(
            'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = FALSE',
            [userId]
        );

        res.json({
            success: true,
            data: {
                unreadCount: result[0].count
            }
        });

    } catch (error) {
        console.error('읽지 않은 메시지 수 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 메시지 검색
exports.searchMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { keyword } = req.query;

        if (!keyword || keyword.trim() === '') {
            return res.status(400).json({
                success: false,
                message: '검색어를 입력해주세요.'
            });
        }

        const [messages] = await db.execute(
            `SELECT m.*, 
                    sender.name as sender_name,
                    receiver.name as receiver_name
             FROM messages m
             JOIN users sender ON m.sender_id = sender.id
             JOIN users receiver ON m.receiver_id = receiver.id
             WHERE (m.sender_id = ? OR m.receiver_id = ?) 
                AND m.content LIKE ?
             ORDER BY m.created_at DESC
             LIMIT 100`,
            [userId, userId, `%${keyword}%`]
        );

        res.json({
            success: true,
            data: messages
        });

    } catch (error) {
        console.error('메시지 검색 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 메시지 전송 가능한 사용자 목록 조회
exports.getAllUsers = async (req, res) => {
    try {
        const currentUserId = req.user.id;

        // 자신을 제외한 모든 사용자 조회
        const [users] = await db.execute(
            'SELECT id, student_id, name, role, department FROM users WHERE id != ? ORDER BY role, name',
            [currentUserId]
        );

        res.json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error('사용자 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};
