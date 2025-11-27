const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const jwtConfig = require('../config/jwt');

// 로그인
exports.login = async (req, res) => {
    try {
        const { studentId, password } = req.body;

        if (!studentId || !password) {
            return res.status(400).json({
                success: false,
                message: '학번과 비밀번호를 입력해주세요.'
            });
        }

        // 사용자 조회
        const [users] = await db.execute(
            'SELECT * FROM users WHERE student_id = ?',
            [studentId]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: '학번 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        const user = users[0];

        // 비밀번호 확인
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: '학번 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        // JWT 토큰 생성
        const token = jwt.sign(
            {
                id: user.id,
                studentId: user.student_id,
                name: user.name,
                role: user.role
            },
            jwtConfig.secret,
            { expiresIn: jwtConfig.expiresIn }
        );

        // 쿠키에 토큰 저장
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
        });

        res.json({
            success: true,
            message: '로그인 성공',
            data: {
                id: user.id,
                studentId: user.student_id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                grade: user.grade,
                token: token
            }
        });

    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 로그아웃
exports.logout = (req, res) => {
    res.clearCookie('token');
    res.json({
        success: true,
        message: '로그아웃 되었습니다.'
    });
};

// 현재 사용자 정보
exports.me = async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, student_id, name, email, role, department, grade, created_at FROM users WHERE id = ?',
            [req.user.id]
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
        console.error('사용자 정보 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 토큰 갱신
exports.refresh = async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, student_id, name, role FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        const user = users[0];

        // 새 토큰 생성
        const token = jwt.sign(
            {
                id: user.id,
                studentId: user.student_id,
                name: user.name,
                role: user.role
            },
            jwtConfig.secret,
            { expiresIn: jwtConfig.expiresIn }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            success: true,
            message: '토큰이 갱신되었습니다.'
        });

    } catch (error) {
        console.error('토큰 갱신 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 프로필 업데이트
exports.updateProfile = async (req, res) => {
    try {
        const { name, email, phone, department } = req.body;

        await db.execute(
            'UPDATE users SET name = ?, email = ?, phone = ?, department = ? WHERE id = ?',
            [name, email || null, phone || null, department || null, req.user.id]
        );

        res.json({
            success: true,
            message: '프로필이 업데이트되었습니다.'
        });
    } catch (error) {
        console.error('프로필 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};

// 비밀번호 변경
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // 현재 사용자 조회
        const [users] = await db.execute(
            'SELECT password FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        // 현재 비밀번호 확인
        const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: '현재 비밀번호가 올바르지 않습니다.'
            });
        }

        // 새 비밀번호 해싱 및 저장
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, req.user.id]
        );

        res.json({
            success: true,
            message: '비밀번호가 변경되었습니다.'
        });
    } catch (error) {
        console.error('비밀번호 변경 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
};
