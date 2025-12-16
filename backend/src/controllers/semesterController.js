const db = require('../models/db');

// 학기 목록 조회
exports.getSemesters = async (req, res) => {
    try {
        const [semesters] = await db.execute(
            'SELECT * FROM semesters ORDER BY year DESC, term DESC'
        );

        res.json({
            success: true,
            data: semesters
        });

    } catch (error) {
        console.error('학기 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 현재 학기 조회
exports.getCurrentSemester = async (req, res) => {
    try {
        const [semesters] = await db.execute(
            'SELECT * FROM semesters WHERE is_current = TRUE LIMIT 1'
        );

        if (semesters.length === 0) {
            return res.status(404).json({
                success: false,
                message: '현재 학기가 설정되어 있지 않습니다.'
            });
        }

        res.json({
            success: true,
            data: semesters[0]
        });

    } catch (error) {
        console.error('현재 학기 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 학기 생성
exports.createSemester = async (req, res) => {
    try {
        const { year, term, startDate, endDate, isCurrent } = req.body;

        // 중복 확인
        const [existing] = await db.execute(
            'SELECT id FROM semesters WHERE year = ? AND term = ?',
            [year, term]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: '이미 동일한 학기가 존재합니다.'
            });
        }

        // 현재 학기로 설정하는 경우 기존 현재 학기 해제
        if (isCurrent) {
            await db.execute('UPDATE semesters SET is_current = FALSE WHERE is_current = TRUE');
        }

        const [result] = await db.execute(
            `INSERT INTO semesters (year, term, start_date, end_date, is_current)
       VALUES (?, ?, ?, ?, ?)`,
            [year, term, startDate, endDate, isCurrent || false]
        );

        res.status(201).json({
            success: true,
            message: '학기가 생성되었습니다.',
            data: { id: result.insertId }
        });

    } catch (error) {
        console.error('학기 생성 오류:', error);

        // 중복 에러 처리
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: '이미 동일한 학기가 존재합니다.'
            });
        }

        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 학기 수정
exports.updateSemester = async (req, res) => {
    try {
        const { id } = req.params;
        const { year, term, startDate, endDate, isCurrent } = req.body;

        // 현재 학기로 설정하는 경우 기존 현재 학기 해제
        if (isCurrent) {
            await db.execute('UPDATE semesters SET is_current = FALSE WHERE is_current = TRUE');
        }

        await db.execute(
            `UPDATE semesters SET year = ?, term = ?, start_date = ?, end_date = ?, is_current = ?
       WHERE id = ?`,
            [year, term, startDate, endDate, isCurrent || false, id]
        );

        res.json({
            success: true,
            message: '학기가 수정되었습니다.'
        });

    } catch (error) {
        console.error('학기 수정 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 학기 삭제
exports.deleteSemester = async (req, res) => {
    try {
        const { id } = req.params;

        await db.execute('DELETE FROM semesters WHERE id = ?', [id]);

        res.json({
            success: true,
            message: '학기가 삭제되었습니다.'
        });

    } catch (error) {
        console.error('학기 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 주차 정보 조회
exports.getWeeks = async (req, res) => {
    try {
        const { semesterId } = req.params;

        const [weeks] = await db.execute(
            'SELECT * FROM weeks WHERE semester_id = ? ORDER BY week_number',
            [semesterId]
        );

        res.json({
            success: true,
            data: weeks
        });

    } catch (error) {
        console.error('주차 정보 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 주차 생성 (자동 생성)
exports.generateWeeks = async (req, res) => {
    try {
        const { semesterId } = req.params;

        // 학기 정보 조회
        const [semesters] = await db.execute(
            'SELECT * FROM semesters WHERE id = ?',
            [semesterId]
        );

        if (semesters.length === 0) {
            return res.status(404).json({
                success: false,
                message: '학기를 찾을 수 없습니다.'
            });
        }

        const semester = semesters[0];
        const startDate = new Date(semester.start_date);
        const endDate = new Date(semester.end_date);

        // 기존 주차 삭제
        await db.execute('DELETE FROM weeks WHERE semester_id = ?', [semesterId]);

        // 16주 생성
        let weekNumber = 1;
        let currentDate = new Date(startDate);

        // 월요일 시작으로 조정
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 1) {
            currentDate.setDate(currentDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        }

        while (weekNumber <= 16 && currentDate <= endDate) {
            const weekStart = new Date(currentDate);
            const weekEnd = new Date(currentDate);
            weekEnd.setDate(weekEnd.getDate() + 6);

            await db.execute(
                `INSERT INTO weeks (semester_id, week_number, start_date, end_date)
         VALUES (?, ?, ?, ?)`,
                [semesterId, weekNumber, weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]]
            );

            weekNumber++;
            currentDate.setDate(currentDate.getDate() + 7);
        }

        res.json({
            success: true,
            message: '주차 정보가 생성되었습니다.'
        });

    } catch (error) {
        console.error('주차 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};
