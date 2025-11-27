-- 학교 출석 관리 시스템 데이터베이스 스키마
-- MySQL 8.0

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Docker에서 이미 attendance_db가 생성되어 있으므로 USE만 수행
-- 로컬 환경에서는 attendance_db를 생성해야 함
CREATE DATABASE IF NOT EXISTS attendance_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE attendance_db;

-- 1. 사용자 테이블
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE NOT NULL COMMENT '학번 또는 교번',
    password VARCHAR(255) NOT NULL COMMENT 'bcrypt 암호화',
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    role ENUM('admin', 'instructor', 'student') NOT NULL DEFAULT 'student',
    department VARCHAR(100) DEFAULT '소프트웨어학과',
    grade INT COMMENT '학년 (학생만)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 학기 테이블
CREATE TABLE semesters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    year INT NOT NULL COMMENT '학년도',
    term INT NOT NULL COMMENT '학기 (1: 1학기, 2: 2학기)',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE COMMENT '현재 학기 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_semester (year, term)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. 주차 테이블
CREATE TABLE weeks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    semester_id INT NOT NULL,
    week_number INT NOT NULL COMMENT '주차',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_holiday BOOLEAN DEFAULT FALSE COMMENT '휴일 여부',
    note VARCHAR(255) COMMENT '비고',
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
    UNIQUE KEY unique_week (semester_id, week_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. 강의 테이블
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    semester_id INT NOT NULL,
    title VARCHAR(100) NOT NULL COMMENT '강의명',
    section VARCHAR(20) COMMENT '분반',
    grade INT NOT NULL COMMENT '학년',
    department VARCHAR(100) DEFAULT '소프트웨어학과',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
    INDEX idx_semester (semester_id),
    INDEX idx_grade (grade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. 강의-교원 연결 테이블
CREATE TABLE course_instructors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    instructor_id INT NOT NULL,
    is_primary BOOLEAN DEFAULT TRUE COMMENT '주 담당 여부',
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_course_instructor (course_id, instructor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. 강의 시간표 테이블
CREATE TABLE course_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    day_of_week ENUM('월', '화', '수', '목', '금', '토', '일') NOT NULL,
    period INT NOT NULL COMMENT '교시 (0: 08:00, 1: 09:00, ...)',
    room VARCHAR(50) COMMENT '강의실',
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_day_period (day_of_week, period)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. 수강 등록 테이블
CREATE TABLE enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    student_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (course_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. 출석 세션 테이블
CREATE TABLE attendance_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    session_date DATE NOT NULL COMMENT '수업 날짜',
    period INT NOT NULL COMMENT '교시',
    attendance_type ENUM('electronic', 'code', 'rollcall') NOT NULL COMMENT '출석 방식 (전자출결/인증번호/호명)',
    attendance_code VARCHAR(6) COMMENT '6자리 출석 코드',
    code_expires_at TIMESTAMP NULL COMMENT '코드 만료 시간',
    status ENUM('active', 'closed') DEFAULT 'active',
    closed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course_date (course_id, session_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. 출석 기록 테이블
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('present', 'late', 'absent', 'excused') DEFAULT 'absent',
    checked_at TIMESTAMP NULL COMMENT '출석 체크 시간',
    note VARCHAR(255) COMMENT '비고',
    FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (session_id, student_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. 공결 신청 테이블
CREATE TABLE excuse_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    session_id INT COMMENT '특정 세션에 대한 공결',
    student_id INT NOT NULL,
    excuse_date DATE NOT NULL COMMENT '공결 날짜',
    reason TEXT NOT NULL COMMENT '공결 사유',
    excuse_type VARCHAR(50) COMMENT '공결 유형 (질병, 가사, 공무 등)',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    reject_reason TEXT COMMENT '거절 사유',
    reviewed_by INT COMMENT '처리자',
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. 첨부파일 테이블
CREATE TABLE attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    excuse_request_id INT,
    file_name VARCHAR(255) NOT NULL COMMENT '저장된 파일명',
    original_name VARCHAR(255) NOT NULL COMMENT '원본 파일명',
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL COMMENT '파일 크기 (bytes)',
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (excuse_request_id) REFERENCES excuse_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. 이의 신청 테이블
CREATE TABLE appeals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    student_id INT NOT NULL,
    original_status ENUM('present', 'late', 'absent', 'excused') NOT NULL,
    requested_status ENUM('present', 'late', 'excused') NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    reject_reason TEXT,
    reviewed_by INT,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. 알림 테이블
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL COMMENT '알림 유형',
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    related_type VARCHAR(50) COMMENT '관련 엔티티 유형',
    related_id INT COMMENT '관련 엔티티 ID',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. 투표 테이블
CREATE TABLE polls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    created_by INT NOT NULL,
    question TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE COMMENT '익명 투표 여부',
    allow_multiple BOOLEAN DEFAULT FALSE COMMENT '복수 선택 허용',
    end_date TIMESTAMP NULL COMMENT '투표 마감 시간',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. 투표 선택지 테이블
CREATE TABLE poll_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    poll_id INT NOT NULL,
    option_text VARCHAR(255) NOT NULL,
    option_order INT NOT NULL DEFAULT 1,
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. 투표 응답 테이블
CREATE TABLE poll_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    option_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vote (option_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 17. 쪽지 테이블
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sender_deleted BOOLEAN DEFAULT FALSE,
    receiver_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_receiver (receiver_id, is_read),
    INDEX idx_sender (sender_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 18. 감사 로그 테이블
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(50) NOT NULL COMMENT '수행 작업',
    entity_type VARCHAR(50) NOT NULL COMMENT '대상 엔티티 유형',
    entity_id INT COMMENT '대상 엔티티 ID',
    old_values JSON COMMENT '변경 전 값',
    new_values JSON COMMENT '변경 후 값',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
