const db = require('../models/db');

/**
 * 시스템 설정 조회
 */
exports.getSettings = async (req, res) => {
    try {
        const query = `
            SELECT id, setting_key, setting_value, description, updated_at
            FROM settings
            WHERE setting_key IN ('max_file_upload_size', 'max_concurrent_sessions', 'session_timeout', 'email_notifications_enabled')
            ORDER BY setting_key
        `;

        const [settings] = await db.query(query);

        // 기본값 설정
        const defaultSettings = {
            max_file_upload_size: '10',
            max_concurrent_sessions: '5',
            session_timeout: '3600',
            email_notifications_enabled: '1'
        };

        // 데이터베이스의 설정과 병합
        const result = {};
        settings.forEach(setting => {
            result[setting.setting_key] = {
                value: setting.setting_value,
                description: setting.description || ''
            };
        });

        // 누락된 설정에 기본값 추가
        for (const [key, defaultValue] of Object.entries(defaultSettings)) {
            if (!result[key]) {
                result[key] = { value: defaultValue, description: '' };
            }
        }

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch settings'
        });
    }
};

/**
 * 시스템 설정 업데이트
 */
exports.updateSettings = async (req, res) => {
    try {
        const { settings } = req.body;

        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Settings object is required'
            });
        }

        for (const [key, value] of Object.entries(settings)) {
            const query = `
                INSERT INTO settings (setting_key, setting_value, updated_at)
                VALUES (?, ?, NOW())
                ON DUPLICATE KEY UPDATE 
                    setting_value = ?,
                    updated_at = NOW()
            `;

            await db.query(query, [key, value, value]);
        }

        res.json({
            success: true,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings'
        });
    }
};
