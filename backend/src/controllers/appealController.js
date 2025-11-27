const db = require('../models/db');

// 이의 신청 목록 조회
exports.getAppeals = async (req, res) => {
    try {
        const { status, courseId } = req.query;
        const userId = req.user.id;
        const userRole = req.user.role;

        let query = `
      SELECT ap.*, 
             u.student_id, u.name as student_name,
             c.title as course_title,
             s.session_date, s.period
      FROM appeals ap
      JOIN users u ON ap.student_id = u.id
      JOIN attendance_sessions s ON ap.session_id = s.id
      JOIN courses c ON s.course_id = c.id
      WHERE 1=1
    `;
        const params = [];

        if (userRole === 'student') {
            query += ' AND ap.student_id = ?';
            params.push(userId);
        } else if (userRole === 'instructor') {
            query += ' AND s.course_id IN (SELECT course_id FROM course_instructors WHERE instructor_id = ?)';
            params.push(userId);
        }

        if (status) {
            query += ' AND ap.status = ?';
            params.push(status);
        }

        if (courseId) {
            query += ' AND s.course_id = ?';
            params.push(courseId);
        }

        query += ' ORDER BY ap.created_at DESC';

        const [appeals] = await db.execute(query, params);

        res.json({
            success: true,
            data: appeals
        });

    } catch (error) {
        console.error('이의 신청 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 이의 신청 상세 조회
exports.getAppeal = async (req, res) => {
    try {
        const { id } = req.params;

        const [appeals] = await db.execute(`
      SELECT ap.*, 
             u.student_id, u.name as student_name, u.email as student_email,
             c.title as course_title,
             s.session_date, s.period,
             a.status as current_attendance_status,
             reviewer.name as reviewer_name
      FROM appeals ap
      JOIN users u ON ap.student_id = u.id
      JOIN attendance_sessions s ON ap.session_id = s.id
      JOIN courses c ON s.course_id = c.id
      JOIN attendance a ON a.session_id = ap.session_id AND a.student_id = ap.student_id
      LEFT JOIN users reviewer ON ap.reviewed_by = reviewer.id
      WHERE ap.id = ?
    `, [id]);

        if (appeals.length === 0) {
            return res.status(404).json({
                success: false,
                message: '이의 신청을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: appeals[0]
        });

    } catch (error) {
        console.error('이의 신청 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 이의 신청 생성
exports.createAppeal = async (req, res) => {
    try {
        const { sessionId, requestedStatus, reason } = req.body;
        const studentId = req.user.id;

        // 현재 출석 상태 확인
        const [attendances] = await db.execute(
            'SELECT * FROM attendance WHERE session_id = ? AND student_id = ?',
            [sessionId, studentId]
        );

        if (attendances.length === 0) {
            return res.status(404).json({
                success: false,
                message: '출석 기록을 찾을 수 없습니다.'
            });
        }

        // 중복 신청 확인
        const [existing] = await db.execute(
            'SELECT id FROM appeals WHERE session_id = ? AND student_id = ? AND status = ?',
            [sessionId, studentId, 'pending']
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: '이미 처리 대기 중인 이의 신청이 있습니다.'
            });
        }

        const [result] = await db.execute(
            `INSERT INTO appeals 
       (session_id, student_id, original_status, requested_status, reason, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
            [sessionId, studentId, attendances[0].status, requestedStatus, reason]
        );

        const appealId = result.insertId;

        // 세션 정보 조회
        const [sessions] = await db.execute(
            'SELECT course_id FROM attendance_sessions WHERE id = ?',
            [sessionId]
        );

        // 담당 교원에게 알림
        const [instructors] = await db.execute(
            'SELECT instructor_id FROM course_instructors WHERE course_id = ?',
            [sessions[0].course_id]
        );

        for (const instructor of instructors) {
            await db.execute(
                `INSERT INTO notifications (user_id, type, title, message, related_type, related_id)
         VALUES (?, 'appeal_request', '새 이의 신청', ?, 'appeal', ?)`,
                [
                    instructor.instructor_id,
                    `${req.user.name} 학생이 출석 이의를 신청했습니다.`,
                    appealId
                ]
            );
        }

        res.status(201).json({
            success: true,
            message: '이의 신청이 완료되었습니다.',
            data: { id: appealId }
        });

    } catch (error) {
        console.error('이의 신청 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 이의 신청 처리
exports.processAppeal = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectReason } = req.body;
        const reviewerId = req.user.id;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // 이의 신청 조회
            const [appeals] = await connection.execute(
                'SELECT * FROM appeals WHERE id = ?',
                [id]
            );

            if (appeals.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: '이의 신청을 찾을 수 없습니다.'
                });
            }

            const appeal = appeals[0];

            // 이의 신청 상태 업데이트
            await connection.execute(
                `UPDATE appeals 
         SET status = ?, reject_reason = ?, reviewed_by = ?, reviewed_at = NOW()
         WHERE id = ?`,
                [status, rejectReason || null, reviewerId, id]
            );

            // 승인 시 출석 상태 변경
            if (status === 'approved') {
                await connection.execute(
                    `UPDATE attendance SET status = ? WHERE session_id = ? AND student_id = ?`,
                    [appeal.requested_status, appeal.session_id, appeal.student_id]
                );
            }

            // 학생에게 알림
            const message = status === 'approved'
                ? '이의 신청이 승인되었습니다. 출석 상태가 변경되었습니다.'
                : `이의 신청이 거절되었습니다. 사유: ${rejectReason || '없음'}`;

            await connection.execute(
                `INSERT INTO notifications (user_id, type, title, message, related_type, related_id)
         VALUES (?, 'appeal_processed', '이의 신청 처리 결과', ?, 'appeal', ?)`,
                [appeal.student_id, message, id]
            );

            await connection.commit();

            res.json({
                success: true,
                message: status === 'approved' ? '이의 신청이 승인되었습니다.' : '이의 신청이 거절되었습니다.'
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('이의 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};
