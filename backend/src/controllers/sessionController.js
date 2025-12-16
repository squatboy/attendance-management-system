const db = require('../models/db');

// 결석 누적 확인 및 경고 알림 발송
const checkAbsentWarning = async (sessionId, studentId) => {
    try {
        // 세션의 강의 ID 조회
        const [sessions] = await db.execute(
            'SELECT course_id FROM attendance_sessions WHERE id = ?',
            [sessionId]
        );

        if (sessions.length === 0) return;

        const courseId = sessions[0].course_id;

        // 해당 강의의 결석 횟수 조회
        const [absentCount] = await db.execute(`
            SELECT COUNT(*) as count 
            FROM attendance a
            JOIN attendance_sessions s ON a.session_id = s.id
            WHERE s.course_id = ? AND a.student_id = ? AND a.status = 'absent'
        `, [courseId, studentId]);

        const count = absentCount[0].count;

        // 강의명 조회
        const [courses] = await db.execute('SELECT title FROM courses WHERE id = ?', [courseId]);
        const courseTitle = courses[0]?.title || '강의';

        // 2회 또는 3회 결석 시 알림
        if (count === 2) {
            await db.execute(
                `INSERT INTO notifications (user_id, type, title, message, related_type, related_id)
                 VALUES (?, 'absent_warning', '⚠️ 결석 경고', ?, 'course', ?)`,
                [
                    studentId,
                    `[${courseTitle}] 결석이 2회 누적되었습니다. 추가 결석 시 불이익이 있을 수 있습니다.`,
                    courseId
                ]
            );
        } else if (count >= 3) {
            await db.execute(
                `INSERT INTO notifications (user_id, type, title, message, related_type, related_id)
                 VALUES (?, 'absent_danger', '🚨 결석 위험', ?, 'course', ?)`,
                [
                    studentId,
                    `[${courseTitle}] 결석이 ${count}회 누적되었습니다! 즉시 담당 교수님께 연락하세요.`,
                    courseId
                ]
            );
        }
    } catch (error) {
        console.error('결석 경고 알림 오류:', error);
    }
};

// 출석 세션 목록 조회
exports.getSessions = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { status } = req.query;

        let query = `
      SELECT s.*, 
             (SELECT COUNT(*) FROM attendance WHERE session_id = s.id AND status = 'present') as present_count,
             (SELECT COUNT(*) FROM attendance WHERE session_id = s.id AND status = 'late') as late_count,
             (SELECT COUNT(*) FROM attendance WHERE session_id = s.id AND status = 'absent') as absent_count
      FROM attendance_sessions s
      WHERE s.course_id = ?
    `;
        const params = [courseId];

        if (status) {
            query += ' AND s.status = ?';
            params.push(status);
        }

        query += ' ORDER BY s.session_date DESC, s.period DESC';

        const [sessions] = await db.execute(query, params);

        res.json({
            success: true,
            data: sessions
        });

    } catch (error) {
        console.error('세션 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 출석 세션 상세 조회
exports.getSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const [sessions] = await db.execute(`
      SELECT s.*, c.title as course_title
      FROM attendance_sessions s
      JOIN courses c ON s.course_id = c.id
      WHERE s.id = ?
    `, [sessionId]);

        if (sessions.length === 0) {
            return res.status(404).json({
                success: false,
                message: '세션을 찾을 수 없습니다.'
            });
        }

        const session = sessions[0];

        // 출석 현황 조회
        const [attendances] = await db.execute(`
      SELECT a.*, u.student_id, u.name
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      WHERE a.session_id = ?
      ORDER BY u.student_id
    `, [sessionId]);

        session.attendances = attendances;

        res.json({
            success: true,
            data: session
        });

    } catch (error) {
        console.error('세션 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 6자리 랜덤 코드 생성
const generateAttendanceCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// 출석 세션 생성 (출석 시작)
exports.createSession = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { sessionDate, period, attendanceType, codeExpiryMinutes = 5 } = req.body;

        // 중복 세션 확인
        const [existing] = await db.execute(
            'SELECT id FROM attendance_sessions WHERE course_id = ? AND session_date = ? AND period = ?',
            [courseId, sessionDate, period]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: '해당 날짜와 교시에 이미 세션이 존재합니다.'
            });
        }

        let attendanceCode = null;
        let codeExpiresAt = null;

        if (attendanceType === 'code') {
            attendanceCode = generateAttendanceCode();
            codeExpiresAt = new Date(Date.now() + codeExpiryMinutes * 60 * 1000);
        }

        const [result] = await db.execute(
            `INSERT INTO attendance_sessions 
       (course_id, session_date, period, attendance_type, attendance_code, code_expires_at, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
            [courseId, sessionDate, period, attendanceType, attendanceCode, codeExpiresAt]
        );

        const sessionId = result.insertId;

        // 수강생들의 초기 출석 레코드 생성 (결석 상태로)
        const [students] = await db.execute(
            'SELECT student_id FROM enrollments WHERE course_id = ?',
            [courseId]
        );

        for (const student of students) {
            await db.execute(
                `INSERT INTO attendance (session_id, student_id, status) VALUES (?, ?, 'absent')`,
                [sessionId, student.student_id]
            );
        }

        res.status(201).json({
            success: true,
            message: '출석 세션이 생성되었습니다.',
            data: {
                id: sessionId,
                attendanceCode,
                codeExpiresAt
            }
        });

    } catch (error) {
        console.error('세션 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 출석 코드 갱신
exports.refreshCode = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { expiryMinutes = 5 } = req.body;

        const newCode = generateAttendanceCode();
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

        await db.execute(
            'UPDATE attendance_sessions SET attendance_code = ?, code_expires_at = ? WHERE id = ?',
            [newCode, expiresAt, sessionId]
        );

        res.json({
            success: true,
            message: '출석 코드가 갱신되었습니다.',
            data: {
                attendanceCode: newCode,
                codeExpiresAt: expiresAt
            }
        });

    } catch (error) {
        console.error('코드 갱신 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 세션 종료
exports.closeSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        await db.execute(
            'UPDATE attendance_sessions SET status = ?, closed_at = NOW() WHERE id = ?',
            ['closed', sessionId]
        );

        // 결석자들에게 경고 알림 확인
        const [absentStudents] = await db.execute(
            `SELECT student_id FROM attendance WHERE session_id = ? AND status = 'absent'`,
            [sessionId]
        );

        for (const student of absentStudents) {
            await checkAbsentWarning(sessionId, student.student_id);
        }

        res.json({
            success: true,
            message: '출석이 종료되었습니다.'
        });

    } catch (error) {
        console.error('세션 종료 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 학생 출석 체크 (코드 입력)
exports.checkIn = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { code } = req.body;
        const studentId = req.user.id;

        // 세션 확인
        const [sessions] = await db.execute(
            'SELECT * FROM attendance_sessions WHERE id = ?',
            [sessionId]
        );

        if (sessions.length === 0) {
            return res.status(404).json({
                success: false,
                message: '세션을 찾을 수 없습니다.'
            });
        }

        const session = sessions[0];

        if (session.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: '출석이 종료되었습니다.'
            });
        }

        if (session.attendance_type !== 'code') {
            return res.status(400).json({
                success: false,
                message: '코드 입력 방식이 아닙니다.'
            });
        }

        // 코드 확인
        if (session.attendance_code !== code) {
            return res.status(400).json({
                success: false,
                message: '출석 코드가 올바르지 않습니다.'
            });
        }

        // 만료 확인
        if (new Date() > new Date(session.code_expires_at)) {
            return res.status(400).json({
                success: false,
                message: '출석 코드가 만료되었습니다.'
            });
        }

        // 중복 출석 확인
        const [existingAttendance] = await db.execute(
            'SELECT status FROM attendance WHERE session_id = ? AND student_id = ?',
            [sessionId, studentId]
        );

        if (existingAttendance.length > 0 && existingAttendance[0].status !== 'absent') {
            return res.status(400).json({
                success: false,
                message: '이미 출석 처리된 학생입니다.'
            });
        }

        // 출석 처리 (지각 여부 판단은 별도 로직 필요)
        await db.execute(
            `UPDATE attendance SET status = 'present', checked_at = NOW() WHERE session_id = ? AND student_id = ?`,
            [sessionId, studentId]
        );

        res.json({
            success: true,
            message: '출석이 완료되었습니다.'
        });

    } catch (error) {
        console.error('출석 체크 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 호명 방식 출석 처리 (교원용)
exports.rollCall = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { attendances } = req.body; // [{studentId, status}]

        for (const att of attendances) {
            await db.execute(
                `UPDATE attendance SET status = ?, checked_at = NOW() WHERE session_id = ? AND student_id = ?`,
                [att.status, sessionId, att.studentId]
            );

            // 결석인 경우 경고 알림 확인
            if (att.status === 'absent') {
                await checkAbsentWarning(sessionId, att.studentId);
            }
        }

        res.json({
            success: true,
            message: '출석이 처리되었습니다.'
        });

    } catch (error) {
        console.error('호명 출석 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 개별 출석 상태 변경
exports.updateAttendance = async (req, res) => {
    try {
        const { sessionId, studentId } = req.params;
        const { status, note } = req.body;

        // 기존 상태 조회
        const [oldAttendance] = await db.execute(
            'SELECT status FROM attendance WHERE session_id = ? AND student_id = ?',
            [sessionId, studentId]
        );

        await db.execute(
            `UPDATE attendance SET status = ?, note = ? WHERE session_id = ? AND student_id = ?`,
            [status, note || null, sessionId, studentId]
        );

        // 결석으로 변경된 경우, 누적 결석 확인 및 알림
        if (status === 'absent') {
            await checkAbsentWarning(sessionId, studentId);
        }

        res.json({
            success: true,
            message: '출석 상태가 변경되었습니다.'
        });

    } catch (error) {
        console.error('출석 상태 변경 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 학생 출석 현황 조회
exports.getMyAttendance = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;

        const [attendances] = await db.execute(`
      SELECT a.*, s.session_date, s.period
      FROM attendance a
      JOIN attendance_sessions s ON a.session_id = s.id
      WHERE s.course_id = ? AND a.student_id = ?
      ORDER BY s.session_date DESC
    `, [courseId, studentId]);

        // 통계 계산
        const stats = {
            total: attendances.length,
            present: attendances.filter(a => a.status === 'present').length,
            late: attendances.filter(a => a.status === 'late').length,
            absent: attendances.filter(a => a.status === 'absent').length,
            excused: attendances.filter(a => a.status === 'excused').length
        };

        res.json({
            success: true,
            data: {
                attendances,
                stats
            }
        });

    } catch (error) {
        console.error('출석 현황 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 강의 출석 통계
exports.getCourseStats = async (req, res) => {
    try {
        const { courseId } = req.params;

        const [stats] = await db.execute(`
      SELECT 
        u.id, u.student_id, u.name,
        COUNT(a.id) as total_sessions,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END) as excused_count
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      LEFT JOIN attendance a ON a.student_id = u.id
      LEFT JOIN attendance_sessions s ON a.session_id = s.id AND s.course_id = e.course_id
      WHERE e.course_id = ?
      GROUP BY u.id
      ORDER BY u.student_id
    `, [courseId]);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('출석 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 활성 출석 세션 조회 (학생용)
exports.getActiveSession = async (req, res) => {
    try {
        const { courseId } = req.params;

        const [sessions] = await db.execute(`
            SELECT 
                id,
                course_id,
                session_date,
                period,
                attendance_type,
                attendance_code,
                code_expires_at,
                status,
                created_at
            FROM attendance_sessions
            WHERE course_id = ? 
            AND status = 'active'
            AND DATE(session_date) = CURDATE()
            LIMIT 1
        `, [courseId]);

        if (sessions.length === 0) {
            return res.status(404).json({
                success: false,
                message: '활성 출석 세션이 없습니다.'
            });
        }

        res.json({
            success: true,
            data: sessions[0]
        });

    } catch (error) {
        console.error('활성 출석 세션 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};
