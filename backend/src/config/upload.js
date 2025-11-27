require('dotenv').config();
const path = require('path');

module.exports = {
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf'
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf']
};
