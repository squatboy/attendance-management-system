const db = require('../models/db');

// 강의 목록 조회
exports.getCourses = async (req, res) => {
    try {
        const { semesterId, instructorId, grade, search } = req.query;
        const userId = req.user.id;
        const userRole = req.user.role;

        let query = `
      SELECT c.*, 
             s.year, s.term,
             GROUP_CONCAT(DISTINCT u.name SEPARATOR ', ') as instructor_names,
             GROUP_CONCAT(DISTINCT ci.instructor_id) as instructor_ids
      FROM courses c
      LEFT JOIN semesters s ON c.semester_id = s.id
      LEFT JOIN course_instructors ci ON c.id = ci.course_id
      LEFT JOIN users u ON ci.instructor_id = u.id
      WHERE 1=1
    `;
        const params = [];

        // 역할에 따른 필터링
        if (userRole === 'student') {
            query = `
        SELECT c.*, 
               s.year, s.term,
               GROUP_CONCAT(DISTINCT u.name SEPARATOR ', ') as instructor_names
        FROM courses c
        INNER JOIN enrollments e ON c.id = e.course_id AND e.student_id = ?
        LEFT JOIN semesters s ON c.semester_id = s.id
        LEFT JOIN course_instructors ci ON c.id = ci.course_id
        LEFT JOIN users u ON ci.instructor_id = u.id
        WHERE 1=1
      `;
            params.push(userId);
        } else if (userRole === 'instructor') {
            query = `
        SELECT c.*, 
               s.year, s.term,
               GROUP_CONCAT(DISTINCT u.name SEPARATOR ', ') as instructor_names
        FROM courses c
        INNER JOIN course_instructors ci ON c.id = ci.course_id AND ci.instructor_id = ?
        LEFT JOIN semesters s ON c.semester_id = s.id
        LEFT JOIN users u ON ci.instructor_id = u.id
        WHERE 1=1
      `;
            params.push(userId);
        }

        if (semesterId) {
            query += ' AND c.semester_id = ?';
            params.push(semesterId);
        }

        if (grade) {
            query += ' AND c.grade = ?';
            params.push(grade);
        }

        if (search) {
            query += ' AND c.title LIKE ?';
            params.push(`%${search}%`);
        }

        query += ' GROUP BY c.id ORDER BY c.grade, c.title';

        const [courses] = await db.execute(query, params);

        // 각 강의의 시간표 조회
        for (let course of courses) {
            const [schedules] = await db.execute(
                'SELECT * FROM course_schedules WHERE course_id = ? ORDER BY day_of_week, period',
                [course.id]
            );
            course.schedules = schedules;
        }

        res.json({
            success: true,
            data: courses
        });

    } catch (error) {
        console.error('강의 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 강의 상세 조회
exports.getCourse = async (req, res) => {
    try {
        const { id } = req.params;

        const [courses] = await db.execute(`
      SELECT c.*, 
             s.year, s.term, s.start_date, s.end_date,
             GROUP_CONCAT(DISTINCT u.name SEPARATOR ', ') as instructor_names
      FROM courses c
      LEFT JOIN semesters s ON c.semester_id = s.id
      LEFT JOIN course_instructors ci ON c.id = ci.course_id
      LEFT JOIN users u ON ci.instructor_id = u.id
      WHERE c.id = ?
      GROUP BY c.id
    `, [id]);

        if (courses.length === 0) {
            return res.status(404).json({
                success: false,
                message: '강의를 찾을 수 없습니다.'
            });
        }

        const course = courses[0];

        // 시간표 조회
        const [schedules] = await db.execute(
            'SELECT * FROM course_schedules WHERE course_id = ?',
            [id]
        );
        course.schedules = schedules;

        // 담당 교원 목록
        const [instructors] = await db.execute(`
      SELECT u.id, u.name, u.email, ci.is_primary
      FROM course_instructors ci
      JOIN users u ON ci.instructor_id = u.id
      WHERE ci.course_id = ?
    `, [id]);
        course.instructors = instructors;

        res.json({
            success: true,
            data: course
        });

    } catch (error) {
        console.error('강의 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 강의 생성
exports.createCourse = async (req, res) => {
    try {
        // 프론트엔드에서 보낸 데이터 (code, title, instructorId, semesterId, room, credits, description)
        // 또는 기존 형식 (semesterId, title, section, grade, department, instructorIds, schedules) 모두 지원
        const {
            semesterId,
            title,
            section,
            grade,
            department,
            instructorIds,
            instructorId,  // 프론트엔드에서 보내는 단일 instructorId
            schedules,
            room  // 프론트엔드에서 보내는 room
        } = req.body;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // 강의 생성
            const [result] = await connection.execute(
                `INSERT INTO courses (semester_id, title, section, grade, department)
         VALUES (?, ?, ?, ?, ?)`,
                [
                    semesterId,
                    title,
                    section || null,
                    grade || 1,  // 기본값 1학년
                    department || '소프트웨어학과'
                ]
            );

            const courseId = result.insertId;

            // 담당 교원 연결 (배열 또는 단일 ID 모두 지원)
            const instructors = instructorIds || (instructorId ? [instructorId] : []);
            if (instructors.length > 0) {
                for (let i = 0; i < instructors.length; i++) {
                    await connection.execute(
                        `INSERT INTO course_instructors (course_id, instructor_id, is_primary)
             VALUES (?, ?, ?)`,
                        [courseId, instructors[i], i === 0]
                    );
                }
            }

            // 시간표 추가
            if (schedules && schedules.length > 0) {
                for (const schedule of schedules) {
                    await connection.execute(
                        `INSERT INTO course_schedules (course_id, day_of_week, period, room)
             VALUES (?, ?, ?, ?)`,
                        [courseId, schedule.dayOfWeek, schedule.period, schedule.room || null]
                    );
                }
            } else if (room) {
                // schedules가 없고 room만 있는 경우 (프론트엔드 형식)
                // 기본 시간표 생성하지 않고 넘어감 (추후 시간표는 별도 관리)
            }

            await connection.commit();

            res.status(201).json({
                success: true,
                message: '강의가 생성되었습니다.',
                data: { id: courseId }
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('강의 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 강의 수정
exports.updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, section, grade, department, instructorIds, schedules } = req.body;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // 강의 수정
            await connection.execute(
                `UPDATE courses SET title = ?, section = ?, grade = ?, department = ? WHERE id = ?`,
                [title, section, grade, department, id]
            );

            // 기존 교원 연결 삭제 후 재생성
            if (instructorIds) {
                await connection.execute('DELETE FROM course_instructors WHERE course_id = ?', [id]);
                for (let i = 0; i < instructorIds.length; i++) {
                    await connection.execute(
                        `INSERT INTO course_instructors (course_id, instructor_id, is_primary)
             VALUES (?, ?, ?)`,
                        [id, instructorIds[i], i === 0]
                    );
                }
            }

            // 기존 시간표 삭제 후 재생성
            if (schedules) {
                await connection.execute('DELETE FROM course_schedules WHERE course_id = ?', [id]);
                for (const schedule of schedules) {
                    await connection.execute(
                        `INSERT INTO course_schedules (course_id, day_of_week, period, room)
             VALUES (?, ?, ?, ?)`,
                        [id, schedule.dayOfWeek, schedule.period, schedule.room || null]
                    );
                }
            }

            await connection.commit();

            res.json({
                success: true,
                message: '강의가 수정되었습니다.'
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('강의 수정 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 강의 삭제
exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        await db.execute('DELETE FROM courses WHERE id = ?', [id]);

        res.json({
            success: true,
            message: '강의가 삭제되었습니다.'
        });

    } catch (error) {
        console.error('강의 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 수강생 목록 조회
exports.getStudents = async (req, res) => {
    try {
        const { id } = req.params;

        const [students] = await db.execute(`
      SELECT u.id, u.student_id, u.name, u.email, u.grade, e.enrolled_at
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE e.course_id = ?
      ORDER BY u.student_id
    `, [id]);

        res.json({
            success: true,
            data: students
        });

    } catch (error) {
        console.error('수강생 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 수강생 등록
exports.enrollStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { studentId } = req.body;

        // 중복 확인
        const [existing] = await db.execute(
            'SELECT id FROM enrollments WHERE course_id = ? AND student_id = ?',
            [id, studentId]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: '이미 수강 등록된 학생입니다.'
            });
        }

        await db.execute(
            'INSERT INTO enrollments (course_id, student_id) VALUES (?, ?)',
            [id, studentId]
        );

        res.status(201).json({
            success: true,
            message: '수강 등록되었습니다.'
        });

    } catch (error) {
        console.error('수강 등록 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 강의 공지 작성 (교원) - 수강생 전체 알림
exports.createAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const instructorId = req.user.id;

        // 담당 교원인지 확인
        const [isInstructor] = await db.execute(
            'SELECT id FROM course_instructors WHERE course_id = ? AND instructor_id = ?',
            [id, instructorId]
        );

        if (isInstructor.length === 0 && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '해당 강의의 담당 교원이 아닙니다.'
            });
        }

        // 수강생 목록 조회
        const [students] = await db.execute(
            'SELECT student_id FROM enrollments WHERE course_id = ?',
            [id]
        );

        // 강의명 조회
        const [courses] = await db.execute('SELECT title FROM courses WHERE id = ?', [id]);
        const courseTitle = courses[0]?.title || '강의';

        // 각 수강생에게 알림 발송
        for (const student of students) {
            await db.execute(
                `INSERT INTO notifications (user_id, type, title, message, related_type, related_id)
                 VALUES (?, 'announcement', ?, ?, 'course', ?)`,
                [
                    student.student_id,
                    `[${courseTitle}] ${title}`,
                    content,
                    id
                ]
            );
        }

        res.status(201).json({
            success: true,
            message: `${students.length}명의 수강생에게 공지가 발송되었습니다.`
        });

    } catch (error) {
        console.error('공지 작성 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};
