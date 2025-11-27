const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

// JWT 토큰 검증 미들웨어
const authenticateToken = (req, res, next) => {
    // 쿠키에서 토큰 가져오기
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: '인증이 필요합니다.'
        });
    }

    try {
        const decoded = jwt.verify(token, jwtConfig.secret);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: '유효하지 않은 토큰입니다.'
        });
    }
};

// 역할 확인 미들웨어
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '인증이 필요합니다.'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: '접근 권한이 없습니다.'
            });
        }

        next();
    };
};

// 관리자 전용
const isAdmin = authorizeRoles('admin');

// 교원 전용
const isInstructor = authorizeRoles('instructor');

// 학생 전용
const isStudent = authorizeRoles('student');

// 교원 또는 관리자
const isInstructorOrAdmin = authorizeRoles('instructor', 'admin');

module.exports = {
    authenticate: authenticateToken,
    authenticateToken,
    authorizeRoles,
    isAdmin,
    isInstructor,
    isStudent,
    isInstructorOrAdmin
};
