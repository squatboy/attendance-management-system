const db = require('../models/db');

// 투표 목록 조회
exports.getPolls = async (req, res) => {
    try {
        const { courseId, status } = req.query;
        const userId = req.user.id;
        const userRole = req.user.role;

        let query = `
      SELECT p.*, 
             c.title as course_title,
             u.name as creator_name,
             (SELECT COUNT(*) FROM poll_options WHERE poll_id = p.id) as option_count,
             (SELECT COUNT(DISTINCT pv.user_id) FROM poll_votes pv 
              JOIN poll_options po ON pv.option_id = po.id 
              WHERE po.poll_id = p.id) as vote_count
      FROM polls p
      JOIN courses c ON p.course_id = c.id
      JOIN users u ON p.created_by = u.id
      WHERE 1=1
    `;
        const params = [];

        // 역할에 따른 필터링
        if (userRole === 'student') {
            query += ' AND p.course_id IN (SELECT course_id FROM enrollments WHERE student_id = ?)';
            params.push(userId);
        } else if (userRole === 'instructor') {
            query += ' AND p.course_id IN (SELECT course_id FROM course_instructors WHERE instructor_id = ?)';
            params.push(userId);
        }

        if (courseId) {
            query += ' AND p.course_id = ?';
            params.push(courseId);
        }

        if (status === 'active') {
            query += ' AND p.is_active = TRUE AND (p.end_date IS NULL OR p.end_date > NOW())';
        } else if (status === 'closed') {
            query += ' AND (p.is_active = FALSE OR p.end_date <= NOW())';
        }

        query += ' ORDER BY p.created_at DESC';

        const [polls] = await db.execute(query, params);

        res.json({
            success: true,
            data: polls
        });

    } catch (error) {
        console.error('투표 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 투표 상세 조회
exports.getPoll = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [polls] = await db.execute(`
      SELECT p.*, 
             c.title as course_title,
             u.name as creator_name
      FROM polls p
      JOIN courses c ON p.course_id = c.id
      JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `, [id]);

        if (polls.length === 0) {
            return res.status(404).json({
                success: false,
                message: '투표를 찾을 수 없습니다.'
            });
        }

        const poll = polls[0];

        // 옵션 및 득표수 조회
        const [options] = await db.execute(`
      SELECT po.*, 
             COUNT(pv.id) as vote_count,
             MAX(CASE WHEN pv.user_id = ? THEN 1 ELSE 0 END) as is_voted
      FROM poll_options po
      LEFT JOIN poll_votes pv ON po.id = pv.option_id
      WHERE po.poll_id = ?
      GROUP BY po.id
      ORDER BY po.option_order
    `, [userId, id]);

        poll.options = options;

        // 사용자 투표 여부
        poll.hasVoted = options.some(o => o.is_voted === 1);

        res.json({
            success: true,
            data: poll
        });

    } catch (error) {
        console.error('투표 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 투표 생성
exports.createPoll = async (req, res) => {
    try {
        const { courseId, title, description, options, isAnonymous, allowMultiple, endDate } = req.body;
        const creatorId = req.user.id;

        // 유효성 검사
        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: '강의를 선택하세요.'
            });
        }

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: '투표 제목은 필수입니다.'
            });
        }

        if (!options || options.length < 2) {
            return res.status(400).json({
                success: false,
                message: '최소 2개 이상의 선택지가 필요합니다.'
            });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [result] = await connection.execute(
                `INSERT INTO polls 
         (course_id, created_by, question, is_anonymous, allow_multiple, end_date, is_active)
         VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
                [courseId, creatorId, title, isAnonymous || false, allowMultiple || false, endDate || null]
            );

            const pollId = result.insertId;

            // 옵션 추가 (빈 값 제거)
            const validOptions = options.filter(o => o && o.trim());
            for (let i = 0; i < validOptions.length; i++) {
                await connection.execute(
                    'INSERT INTO poll_options (poll_id, option_text, option_order) VALUES (?, ?, ?)',
                    [pollId, validOptions[i], i + 1]
                );
            }

            await connection.commit();

            res.status(201).json({
                success: true,
                message: '투표가 생성되었습니다.',
                data: { id: pollId }
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('투표 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 투표하기
exports.vote = async (req, res) => {
    try {
        const { id } = req.params;
        const { optionIds } = req.body;
        const userId = req.user.id;

        // 투표 확인
        const [polls] = await db.execute(
            'SELECT * FROM polls WHERE id = ?',
            [id]
        );

        if (polls.length === 0) {
            return res.status(404).json({
                success: false,
                message: '투표를 찾을 수 없습니다.'
            });
        }

        const poll = polls[0];

        if (!poll.is_active) {
            return res.status(400).json({
                success: false,
                message: '종료된 투표입니다.'
            });
        }

        if (poll.end_date && new Date() > new Date(poll.end_date)) {
            return res.status(400).json({
                success: false,
                message: '투표 기간이 종료되었습니다.'
            });
        }

        // 이미 투표했는지 확인
        const [existingVotes] = await db.execute(`
      SELECT pv.* FROM poll_votes pv
      JOIN poll_options po ON pv.option_id = po.id
      WHERE po.poll_id = ? AND pv.user_id = ?
    `, [id, userId]);

        if (existingVotes.length > 0) {
            return res.status(400).json({
                success: false,
                message: '이미 투표하셨습니다.'
            });
        }

        // 다중 선택 여부 확인
        if (!poll.allow_multiple && optionIds.length > 1) {
            return res.status(400).json({
                success: false,
                message: '하나의 선택지만 선택할 수 있습니다.'
            });
        }

        // 투표 기록
        for (const optionId of optionIds) {
            await db.execute(
                'INSERT INTO poll_votes (option_id, user_id) VALUES (?, ?)',
                [optionId, userId]
            );
        }

        res.json({
            success: true,
            message: '투표가 완료되었습니다.'
        });

    } catch (error) {
        console.error('투표 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 투표 종료
exports.closePoll = async (req, res) => {
    try {
        const { id } = req.params;

        await db.execute(
            'UPDATE polls SET is_active = FALSE WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: '투표가 종료되었습니다.'
        });

    } catch (error) {
        console.error('투표 종료 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 투표 삭제
exports.deletePoll = async (req, res) => {
    try {
        const { id } = req.params;

        await db.execute('DELETE FROM polls WHERE id = ?', [id]);

        res.json({
            success: true,
            message: '투표가 삭제되었습니다.'
        });

    } catch (error) {
        console.error('투표 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};
