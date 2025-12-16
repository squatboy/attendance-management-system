const db = require('../models/db');
const fs = require('fs').promises;
const path = require('path');
const { STATUS_CODES } = require('../utils/attendanceStatus');

// 공결 신청 목록 조회
exports.getExcuses = async (req, res) => {
    try {
        const { status, courseId } = req.query;
        const userId = req.user.id;
        const userRole = req.user.role;

        let query = `
      SELECT e.*, 
             u.student_id, u.name as student_name,
             c.title as course_title
      FROM excuse_requests e
      JOIN users u ON e.student_id = u.id
      JOIN courses c ON e.course_id = c.id
      WHERE 1=1
    `;
        const params = [];

        // 역할에 따른 필터링
        if (userRole === 'student') {
            query += ' AND e.student_id = ?';
            params.push(userId);
        } else if (userRole === 'instructor') {
            query += ' AND e.course_id IN (SELECT course_id FROM course_instructors WHERE instructor_id = ?)';
            params.push(userId);
        }

        if (status) {
            query += ' AND e.status = ?';
            params.push(status);
        }

        if (courseId) {
            query += ' AND e.course_id = ?';
            params.push(courseId);
        }

        query += ' ORDER BY e.created_at DESC';

        const [excuses] = await db.execute(query, params);

        res.json({
            success: true,
            data: excuses
        });

    } catch (error) {
        console.error('공결 신청 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 공결 신청 상세 조회
exports.getExcuse = async (req, res) => {
    try {
        const { id } = req.params;

        const [excuses] = await db.execute(`
      SELECT e.*, 
             u.student_id, u.name as student_name, u.email as student_email,
             c.title as course_title,
             reviewer.name as reviewer_name
      FROM excuse_requests e
      JOIN users u ON e.student_id = u.id
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN users reviewer ON e.reviewed_by = reviewer.id
      WHERE e.id = ?
    `, [id]);

        if (excuses.length === 0) {
            return res.status(404).json({
                success: false,
                message: '공결 신청을 찾을 수 없습니다.'
            });
        }

        const excuse = excuses[0];

        // 첨부파일 조회
        const [attachments] = await db.execute(
            'SELECT * FROM attachments WHERE excuse_request_id = ?',
            [id]
        );
        excuse.attachments = attachments;

        res.json({
            success: true,
            data: excuse
        });

    } catch (error) {
        console.error('공결 신청 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 공결 신청 생성
exports.createExcuse = async (req, res) => {
    try {
        const { courseId, sessionId, excuseDate, reason, excuseType } = req.body;
        const studentId = req.user.id;
        const files = req.files || [];

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [result] = await connection.execute(
                `INSERT INTO excuse_requests 
         (course_id, session_id, student_id, excuse_date, reason, excuse_type, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
                [courseId, sessionId || null, studentId, excuseDate, reason, excuseType]
            );

            const excuseId = result.insertId;

            // 첨부파일 저장
            for (const file of files) {
                await connection.execute(
                    `INSERT INTO attachments 
           (excuse_request_id, file_name, original_name, file_path, file_size, mime_type)
           VALUES (?, ?, ?, ?, ?, ?)`,
                    [excuseId, file.filename, file.originalname, file.path, file.size, file.mimetype]
                );
            }

            // 담당 교원에게 알림 발송
            const [instructors] = await connection.execute(
                'SELECT instructor_id FROM course_instructors WHERE course_id = ?',
                [courseId]
            );

            for (const instructor of instructors) {
                await connection.execute(
                    `INSERT INTO notifications (user_id, type, title, message, related_type, related_id)
           VALUES (?, 'excuse_request', '새 공결 신청', ?, 'excuse_request', ?)`,
                    [
                        instructor.instructor_id,
                        `${req.user.name} 학생이 공결을 신청했습니다.`,
                        excuseId
                    ]
                );
            }

            await connection.commit();

            res.status(201).json({
                success: true,
                message: '공결 신청이 완료되었습니다.',
                data: { id: excuseId }
            });

        } catch (error) {
            await connection.rollback();
            // 업로드된 파일 삭제
            for (const file of files) {
                await fs.unlink(file.path).catch(() => { });
            }
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('공결 신청 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 공결 신청 처리 (승인/거절)
exports.processExcuse = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectReason } = req.body;
        const reviewerId = req.user.id;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // 공결 신청 상태 업데이트
            await connection.execute(
                `UPDATE excuse_requests 
         SET status = ?, reject_reason = ?, reviewed_by = ?, reviewed_at = NOW()
         WHERE id = ?`,
                [status, rejectReason || null, reviewerId, id]
            );

            // 공결 신청 정보 조회
            const [excuses] = await connection.execute(
                'SELECT * FROM excuse_requests WHERE id = ?',
                [id]
            );

            const excuse = excuses[0];

            // 승인 시 출석 상태를 공결(4)로 변경
            if (status === 'approved' && excuse.session_id) {
                await connection.execute(
                    `UPDATE attendance SET status = ? WHERE session_id = ? AND student_id = ?`,
                    [STATUS_CODES.EXCUSED, excuse.session_id, excuse.student_id]
                );
            }

            // 학생에게 알림 발송
            const message = status === 'approved'
                ? '공결 신청이 승인되었습니다.'
                : `공결 신청이 거절되었습니다. 사유: ${rejectReason || '없음'}`;

            await connection.execute(
                `INSERT INTO notifications (user_id, type, title, message, related_type, related_id)
         VALUES (?, 'excuse_processed', '공결 신청 처리 결과', ?, 'excuse_request', ?)`,
                [excuse.student_id, message, id]
            );

            await connection.commit();

            res.json({
                success: true,
                message: status === 'approved' ? '공결이 승인되었습니다.' : '공결이 거절되었습니다.'
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('공결 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 첨부파일 다운로드
exports.downloadAttachment = async (req, res) => {
    try {
        const { attachmentId } = req.params;

        const [attachments] = await db.execute(
            'SELECT * FROM attachments WHERE id = ?',
            [attachmentId]
        );

        if (attachments.length === 0) {
            return res.status(404).json({
                success: false,
                message: '파일을 찾을 수 없습니다.'
            });
        }

        const attachment = attachments[0];

        // 파일이 실제로 존재하는지 확인
        try {
            await fs.access(attachment.file_path);
        } catch {
            return res.status(404).json({
                success: false,
                message: '파일이 존재하지 않습니다.'
            });
        }

        // 파일 다운로드
        res.download(attachment.file_path, attachment.original_name);

    } catch (error) {
        console.error('파일 다운로드 오류:', error);
        res.status(500).json({
            success: false,
            message: '파일 다운로드에 실패했습니다.'
        });
    }
};

// 공결 신청 삭제
exports.deleteExcuse = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // 본인 신청인지 확인
        const [excuses] = await db.execute(
            'SELECT * FROM excuse_requests WHERE id = ? AND student_id = ?',
            [id, userId]
        );

        if (excuses.length === 0) {
            return res.status(404).json({
                success: false,
                message: '공결 신청을 찾을 수 없습니다.'
            });
        }

        if (excuses[0].status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: '처리된 공결 신청은 삭제할 수 없습니다.'
            });
        }

        // 첨부파일 삭제
        const [attachments] = await db.execute(
            'SELECT file_path FROM attachments WHERE excuse_request_id = ?',
            [id]
        );

        for (const att of attachments) {
            await fs.unlink(att.file_path).catch(() => { });
        }

        await db.execute('DELETE FROM excuse_requests WHERE id = ?', [id]);

        res.json({
            success: true,
            message: '공결 신청이 삭제되었습니다.'
        });

    } catch (error) {
        console.error('공결 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};
