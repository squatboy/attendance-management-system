const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const uploadConfig = require('../config/upload');
const fs = require('fs');

// 업로드 디렉토리 생성
const createUploadDir = (subDir = '') => {
    const dir = path.join(uploadConfig.uploadPath, subDir);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
};

// 파일 저장 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const subDir = `excuses/${year}/${month}`;
        const dir = createUploadDir(subDir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        cb(null, filename);
    }
});

// 파일 필터
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!uploadConfig.allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error('허용되지 않는 파일 형식입니다.'), false);
    }

    if (!uploadConfig.allowedExtensions.includes(ext)) {
        return cb(new Error('허용되지 않는 파일 확장자입니다.'), false);
    }

    cb(null, true);
};

// Multer 인스턴스
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: uploadConfig.maxFileSize
    }
});

// 에러 핸들링 미들웨어
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: '파일 크기가 10MB를 초과합니다.'
            });
        }
        return res.status(400).json({
            success: false,
            message: '파일 업로드 오류가 발생했습니다.'
        });
    }

    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    next();
};

module.exports = {
    upload,
    handleUploadError,
    createUploadDir
};
