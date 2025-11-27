const db = require('../models/db');
const bcrypt = require('bcryptjs');
const { logAudit } = require('../middlewares/audit');

// 사용자 목록 조회
exports.getUsers = async (req, res) => {
    try {
        const { role, department, search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT id, student_id, name, email, role, department, grade, created_at FROM users WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
        const params = [];
        const countParams = [];

        if (role) {
            query += ' AND role = ?';
            countQuery += ' AND role = ?';
            params.push(role);
            countParams.push(role);
        }

        if (department) {
            query += ' AND department = ?';
            countQuery += ' AND department = ?';
            params.push(department);
            countParams.push(department);
        }

        if (search) {
            query += ' AND (name LIKE ? OR student_id LIKE ?)';
            countQuery += ' AND (name LIKE ? OR student_id LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
            countParams.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [users] = await db.execute(query, params);
        const [countResult] = await db.execute(countQuery, countParams);

        res.json({
            success: true,
            data: users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });

    } catch (error) {
        console.error('사용자 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 사용자 상세 조회
exports.getUser = async (req, res) => {
    try {
        const { id } = req.params;

        const [users] = await db.execute(
            'SELECT id, student_id, name, email, role, department, grade, created_at FROM users WHERE id = ?',
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            data: users[0]
        });

    } catch (error) {
        console.error('사용자 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 사용자 생성
exports.createUser = async (req, res) => {
    try {
        const { studentId, password, name, email, role, department, grade } = req.body;

        // 중복 확인
        const [existing] = await db.execute(
            'SELECT id FROM users WHERE student_id = ?',
            [studentId]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: '이미 존재하는 학번입니다.'
            });
        }

        // 비밀번호 암호화
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            `INSERT INTO users (student_id, password, name, email, role, department, grade)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [studentId, hashedPassword, name, email || null, role, department || '소프트웨어학과', grade || null]
        );

        // 감사 로그
        await logAudit(req.user.id, 'CREATE', 'users', result.insertId, null, { studentId, name, role }, req);

        res.status(201).json({
            success: true,
            message: '사용자가 생성되었습니다.',
            data: { id: result.insertId }
        });

    } catch (error) {
        console.error('사용자 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 사용자 수정
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, department, grade, password } = req.body;

        // 기존 사용자 조회
        const [existing] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        let query = 'UPDATE users SET name = ?, email = ?, role = ?, department = ?, grade = ?';
        const params = [name, email, role, department, grade];

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await db.execute(query, params);

        // 감사 로그
        await logAudit(req.user.id, 'UPDATE', 'users', id, existing[0], { name, email, role, department, grade }, req);

        res.json({
            success: true,
            message: '사용자 정보가 수정되었습니다.'
        });

    } catch (error) {
        console.error('사용자 수정 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 사용자 삭제
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        await db.execute('DELETE FROM users WHERE id = ?', [id]);

        // 감사 로그
        await logAudit(req.user.id, 'DELETE', 'users', id, existing[0], null, req);

        res.json({
            success: true,
            message: '사용자가 삭제되었습니다.'
        });

    } catch (error) {
        console.error('사용자 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};
