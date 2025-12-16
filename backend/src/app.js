const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

// 라우터 임포트
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const excuseRoutes = require('./routes/excuseRoutes');
const appealRoutes = require('./routes/appealRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const pollRoutes = require('./routes/pollRoutes');
const semesterRoutes = require('./routes/semesterRoutes');
const auditRoutes = require('./routes/auditRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

// CORS 설정
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 디버깅 미들웨어 - 모든 요청 로깅
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    if (req.headers.authorization) {
        console.log(`  Authorization: ${req.headers.authorization.substring(0, 20)}...`);
    }
    if (req.cookies && req.cookies.token) {
        console.log(`  Cookie token: ${req.cookies.token.substring(0, 20)}...`);
    }
    next();
});

// 정적 파일 서빙 (업로드 파일)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API 라우트
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/excuses', excuseRoutes);
app.use('/api/appeals', appealRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/settings', settingsRoutes);

// 헬스 체크
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: '서버가 정상 동작 중입니다.' });
});

// 404 처리
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '요청한 리소스를 찾을 수 없습니다.'
    });
});

// 에러 핸들러
app.use((err, req, res, next) => {
    console.error('서버 오류:', err);
    res.status(500).json({
        success: false,
        message: '서버 내부 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`📍 http://localhost:${PORT}`);
});

module.exports = app;
