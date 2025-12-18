-- 학교 출석 관리 시스템 시드 데이터
-- 실행 전 schema.sql을 먼저 실행해주세요

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

USE attendance_db;

-- 1. 관리자 계정 생성 (admin / admin)
-- 비밀번호는 bcrypt로 암호화됨: $2a$10$... 형식
INSERT INTO users (student_id, password, name, email, role, department) VALUES
('admin', '$2a$10$K9El9ADUx8XsFENdcHtJV.cwBru1KII1QeRwLKyL9L6r4gIFftG5m', '관리자', 'admin@university.ac.kr', 'admin', '소프트웨어학과');

-- 2. 교원 계정 생성 (11명)
-- 기본 비밀번호: password123 (실제 운영 시 변경 필요)
INSERT INTO users (student_id, password, name, email, role, department) VALUES
('inst001', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '김진희', 'kim.jh@university.ac.kr', 'instructor', '소프트웨어학과'),
('inst002', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '배동성', 'bae.ds@university.ac.kr', 'instructor', '소프트웨어학과'),
('inst003', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '양희경', 'yang.hk@university.ac.kr', 'instructor', '소프트웨어학과'),
('inst004', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '박한솔', 'park.hs@university.ac.kr', 'instructor', '소프트웨어학과'),
('inst005', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '김현철', 'kim.hc@university.ac.kr', 'instructor', '소프트웨어학과'),
('inst006', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '박한샘', 'park.hsam@university.ac.kr', 'instructor', '소프트웨어학과'),
('inst007', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '성광제', 'sung.kj@university.ac.kr', 'instructor', '소프트웨어학과'),
('inst008', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '이성주', 'lee.sj@university.ac.kr', 'instructor', '소프트웨어학과'),
('inst009', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '최주희', 'choi.jh@university.ac.kr', 'instructor', '소프트웨어학과'),
('inst010', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '이상주', 'lee.sangju@university.ac.kr', 'instructor', '소프트웨어학과'),
('inst011', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '백석영', 'baek.sy@university.ac.kr', 'instructor', '소프트웨어학과');

-- 3. 학생 계정 생성 (샘플 20명)
INSERT INTO users (student_id, password, name, email, role, department, grade) VALUES
('202021001', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '홍길동', 'hong@student.ac.kr', 'student', '소프트웨어학과', 4),
('202021002', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '김철수', 'kim@student.ac.kr', 'student', '소프트웨어학과', 4),
('202021003', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '이영희', 'lee@student.ac.kr', 'student', '소프트웨어학과', 4),
('202021004', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '박민수', 'park@student.ac.kr', 'student', '소프트웨어학과', 4),
('202021005', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '정수진', 'jung@student.ac.kr', 'student', '소프트웨어학과', 4),
('202121001', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '최동현', 'choi@student.ac.kr', 'student', '소프트웨어학과', 3),
('202121002', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '강서연', 'kang@student.ac.kr', 'student', '소프트웨어학과', 3),
('202121003', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '윤지호', 'yoon@student.ac.kr', 'student', '소프트웨어학과', 3),
('202121004', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '임수빈', 'lim@student.ac.kr', 'student', '소프트웨어학과', 3),
('202121005', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '한예진', 'han@student.ac.kr', 'student', '소프트웨어학과', 3),
('202221001', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '송민재', 'song@student.ac.kr', 'student', '소프트웨어학과', 2),
('202221002', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '오승현', 'oh@student.ac.kr', 'student', '소프트웨어학과', 2),
('202221003', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '권나영', 'kwon@student.ac.kr', 'student', '소프트웨어학과', 2),
('202221004', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '신준혁', 'shin@student.ac.kr', 'student', '소프트웨어학과', 2),
('202221005', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '유하은', 'yu@student.ac.kr', 'student', '소프트웨어학과', 2),
('202321001', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '조현우', 'jo@student.ac.kr', 'student', '소프트웨어학과', 1),
('202321002', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '백서윤', 'baek@student.ac.kr', 'student', '소프트웨어학과', 1),
('202321003', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '노시현', 'no@student.ac.kr', 'student', '소프트웨어학과', 1),
('202321004', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '문지원', 'moon@student.ac.kr', 'student', '소프트웨어학과', 1),
('202321005', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '황채원', 'hwang@student.ac.kr', 'student', '소프트웨어학과', 1);

-- 4. 학기 생성 (2025년 2학기)
INSERT INTO semesters (year, term, start_date, end_date, is_current) VALUES
(2025, 2, '2025-09-01', '2025-12-17', TRUE);

-- 5. 주차 생성 (16주)
INSERT INTO weeks (semester_id, week_number, start_date, end_date) VALUES
(1, 1, '2025-09-01', '2025-09-07'),
(1, 2, '2025-09-08', '2025-09-14'),
(1, 3, '2025-09-15', '2025-09-21'),
(1, 4, '2025-09-22', '2025-09-28'),
(1, 5, '2025-09-29', '2025-10-05'),
(1, 6, '2025-10-06', '2025-10-12'),
(1, 7, '2025-10-13', '2025-10-19'),
(1, 8, '2025-10-20', '2025-10-26'),
(1, 9, '2025-10-27', '2025-11-02'),
(1, 10, '2025-11-03', '2025-11-09'),
(1, 11, '2025-11-10', '2025-11-16'),
(1, 12, '2025-11-17', '2025-11-23'),
(1, 13, '2025-11-24', '2025-11-30'),
(1, 14, '2025-12-01', '2025-12-07'),
(1, 15, '2025-12-08', '2025-12-14'),
(1, 16, '2025-12-15', '2025-12-17');

-- 6. 강의 생성 (30개)
-- 1학년 (7개)
INSERT INTO courses (semester_id, title, grade, department) VALUES
(1, '기초프로그래밍', 1, '소프트웨어학과'),
(1, '이산수학', 1, '소프트웨어학과'),
(1, '미적분학', 1, '소프트웨어학과'),
(1, '선형대수학', 1, '소프트웨어학과'),
(1, '대학물리학', 1, '소프트웨어학과'),
(1, '대학영어', 1, '소프트웨어학과'),
(1, 'AI프로그래밍', 1, '소프트웨어학과');

-- 2학년 (9개)
INSERT INTO courses (semester_id, title, grade, department) VALUES
(1, '자료구조', 2, '소프트웨어학과'),
(1, '객체지향프로그래밍', 2, '소프트웨어학과'),
(1, '컴퓨터구조', 2, '소프트웨어학과'),
(1, '컴퓨터네트워크', 2, '소프트웨어학과'),
(1, '운영체제', 2, '소프트웨어학과'),
(1, '웹프로그래밍', 2, '소프트웨어학과'),
(1, '데이터베이스', 2, '소프트웨어학과'),
(1, '통계학개론', 2, '소프트웨어학과'),
(1, '정보보호개론', 2, '소프트웨어학과');

-- 3학년 (9개)
INSERT INTO courses (semester_id, title, grade, department) VALUES
(1, '알고리즘', 3, '소프트웨어학과'),
(1, '소프트웨어공학', 3, '소프트웨어학과'),
(1, '프로그래밍언어론', 3, '소프트웨어학과'),
(1, '시스템프로그래밍', 3, '소프트웨어학과'),
(1, '인공지능', 3, '소프트웨어학과'),
(1, '컴퓨터그래픽스', 3, '소프트웨어학과'),
(1, '기계학습', 3, '소프트웨어학과'),
(1, '임베디드시스템', 3, '소프트웨어학과'),
(1, '모바일프로그래밍', 3, '소프트웨어학과');

-- 4학년 (5개)
INSERT INTO courses (semester_id, title, grade, department) VALUES
(1, '서버프로그래밍', 4, '소프트웨어학과'),
(1, '빅데이터', 4, '소프트웨어학과'),
(1, '클라우드컴퓨팅', 4, '소프트웨어학과'),
(1, '졸업프로젝트', 4, '소프트웨어학과'),
(1, '정보보호', 4, '소프트웨어학과');

-- 7. 교원-강의 연결
-- 교원 ID 조회: admin(1), 김진희(2), 배동성(3), 양희경(4), 박한솔(5), 김현철(6), 박한샘(7), 성광제(8), 이성주(9), 최주희(10), 이상주(11), 백석영(12)
INSERT INTO course_instructors (course_id, instructor_id, is_primary) VALUES
-- 1학년
(1, 2, TRUE),   -- 기초프로그래밍 - 김진희
(2, 3, TRUE),   -- 이산수학 - 배동성
(3, 3, TRUE),   -- 미적분학 - 배동성
(4, 4, TRUE),   -- 선형대수학 - 양희경
(5, 4, TRUE),   -- 대학물리학 - 양희경
(6, 5, TRUE),   -- 대학영어 - 박한솔
(7, 2, TRUE),   -- AI프로그래밍 - 김진희

-- 2학년
(8, 6, TRUE),   -- 자료구조 - 김현철
(9, 7, TRUE),   -- 객체지향프로그래밍 - 박한샘
(10, 8, TRUE),  -- 컴퓨터구조 - 성광제
(11, 9, TRUE),  -- 컴퓨터네트워크 - 이성주
(12, 8, TRUE),  -- 운영체제 - 성광제
(13, 10, TRUE), -- 웹프로그래밍 - 최주희
(14, 11, TRUE), -- 데이터베이스 - 이상주
(15, 12, TRUE), -- 통계학개론 - 백석영
(16, 9, TRUE),  -- 정보보호개론 - 이성주

-- 3학년
(17, 6, TRUE),  -- 알고리즘 - 김현철
(18, 7, TRUE),  -- 소프트웨어공학 - 박한샘
(19, 5, TRUE),  -- 프로그래밍언어론 - 박한솔
(20, 8, TRUE),  -- 시스템프로그래밍 - 성광제
(21, 2, TRUE),  -- 인공지능 - 김진희
(22, 10, TRUE), -- 컴퓨터그래픽스 - 최주희
(23, 2, TRUE),  -- 기계학습 - 김진희
(24, 8, TRUE),  -- 임베디드시스템 - 성광제
(25, 10, TRUE), -- 모바일프로그래밍 - 최주희

-- 4학년
(26, 10, TRUE), -- 서버프로그래밍 - 최주희
(27, 11, TRUE), -- 빅데이터 - 이상주
(28, 9, TRUE),  -- 클라우드컴퓨팅 - 이성주
(29, 7, TRUE),  -- 졸업프로젝트 - 박한샘
(30, 9, TRUE);  -- 정보보호 - 이성주

-- 8. 강의 시간표
-- 1학년
INSERT INTO course_schedules (course_id, day_of_week, period, room) VALUES
-- 기초프로그래밍: 월1,2,3
(1, '월', 1, '공학관 101'), (1, '월', 2, '공학관 101'), (1, '월', 3, '공학관 101'),
-- 이산수학: 화4,5,6
(2, '화', 4, '공학관 102'), (2, '화', 5, '공학관 102'), (2, '화', 6, '공학관 102'),
-- 미적분학: 수1,2,3
(3, '수', 1, '공학관 103'), (3, '수', 2, '공학관 103'), (3, '수', 3, '공학관 103'),
-- 선형대수학: 목1,2,3
(4, '목', 1, '공학관 104'), (4, '목', 2, '공학관 104'), (4, '목', 3, '공학관 104'),
-- 대학물리학: 금4,5,6
(5, '금', 4, '공학관 105'), (5, '금', 5, '공학관 105'), (5, '금', 6, '공학관 105'),
-- 대학영어: 화1,2
(6, '화', 1, '어학관 201'), (6, '화', 2, '어학관 201'),
-- AI프로그래밍: 수4,5,6
(7, '수', 4, '공학관 106'), (7, '수', 5, '공학관 106'), (7, '수', 6, '공학관 106'),

-- 2학년
-- 자료구조: 월4,5,6
(8, '월', 4, '공학관 201'), (8, '월', 5, '공학관 201'), (8, '월', 6, '공학관 201'),
-- 객체지향프로그래밍: 화1,2,3
(9, '화', 1, '공학관 202'), (9, '화', 2, '공학관 202'), (9, '화', 3, '공학관 202'),
-- 컴퓨터구조: 수1,2,3
(10, '수', 1, '공학관 203'), (10, '수', 2, '공학관 203'), (10, '수', 3, '공학관 203'),
-- 컴퓨터네트워크: 목4,5,6
(11, '목', 4, '공학관 204'), (11, '목', 5, '공학관 204'), (11, '목', 6, '공학관 204'),
-- 운영체제: 금1,2,3
(12, '금', 1, '공학관 205'), (12, '금', 2, '공학관 205'), (12, '금', 3, '공학관 205'),
-- 웹프로그래밍: 월1,2,3
(13, '월', 1, '공학관 206'), (13, '월', 2, '공학관 206'), (13, '월', 3, '공학관 206'),
-- 데이터베이스: 화4,5,6
(14, '화', 4, '공학관 207'), (14, '화', 5, '공학관 207'), (14, '화', 6, '공학관 207'),
-- 통계학개론: 수4,5
(15, '수', 4, '공학관 208'), (15, '수', 5, '공학관 208'),
-- 정보보호개론: 목1,2
(16, '목', 1, '공학관 209'), (16, '목', 2, '공학관 209'),

-- 3학년
-- 알고리즘: 월1,2,3
(17, '월', 1, '공학관 301'), (17, '월', 2, '공학관 301'), (17, '월', 3, '공학관 301'),
-- 소프트웨어공학: 화1,2,3
(18, '화', 1, '공학관 302'), (18, '화', 2, '공학관 302'), (18, '화', 3, '공학관 302'),
-- 프로그래밍언어론: 수1,2,3
(19, '수', 1, '공학관 303'), (19, '수', 2, '공학관 303'), (19, '수', 3, '공학관 303'),
-- 시스템프로그래밍: 목1,2,3
(20, '목', 1, '공학관 304'), (20, '목', 2, '공학관 304'), (20, '목', 3, '공학관 304'),
-- 인공지능: 금1,2,3
(21, '금', 1, '공학관 305'), (21, '금', 2, '공학관 305'), (21, '금', 3, '공학관 305'),
-- 컴퓨터그래픽스: 월4,5,6
(22, '월', 4, '공학관 306'), (22, '월', 5, '공학관 306'), (22, '월', 6, '공학관 306'),
-- 기계학습: 화4,5,6
(23, '화', 4, '공학관 307'), (23, '화', 5, '공학관 307'), (23, '화', 6, '공학관 307'),
-- 임베디드시스템: 수4,5,6
(24, '수', 4, '공학관 308'), (24, '수', 5, '공학관 308'), (24, '수', 6, '공학관 308'),
-- 모바일프로그래밍: 목4,5,6
(25, '목', 4, '공학관 309'), (25, '목', 5, '공학관 309'), (25, '목', 6, '공학관 309'),

-- 4학년
-- 서버프로그래밍: 목1,2,3
(26, '목', 1, '공학관 401'), (26, '목', 2, '공학관 401'), (26, '목', 3, '공학관 401'),
-- 빅데이터: 금1,2,3
(27, '금', 1, '공학관 402'), (27, '금', 2, '공학관 402'), (27, '금', 3, '공학관 402'),
-- 클라우드컴퓨팅: 월4,5,6
(28, '월', 4, '공학관 403'), (28, '월', 5, '공학관 403'), (28, '월', 6, '공학관 403'),
-- 졸업프로젝트: 화4,5,6
(29, '화', 4, '공학관 404'), (29, '화', 5, '공학관 404'), (29, '화', 6, '공학관 404'),
-- 정보보호: 수1,2,3
(30, '수', 1, '공학관 405'), (30, '수', 2, '공학관 405'), (30, '수', 3, '공학관 405');

-- 9. 수강 등록 (샘플)
-- 4학년 학생들 -> 4학년 과목 등록
INSERT INTO enrollments (course_id, student_id)
SELECT c.id, u.id 
FROM courses c 
CROSS JOIN users u 
WHERE c.grade = 4 AND u.role = 'student' AND u.grade = 4;

-- 3학년 학생들 -> 3학년 과목 등록
INSERT INTO enrollments (course_id, student_id)
SELECT c.id, u.id 
FROM courses c 
CROSS JOIN users u 
WHERE c.grade = 3 AND u.role = 'student' AND u.grade = 3;

-- 2학년 학생들 -> 2학년 과목 등록
INSERT INTO enrollments (course_id, student_id)
SELECT c.id, u.id 
FROM courses c 
CROSS JOIN users u 
WHERE c.grade = 2 AND u.role = 'student' AND u.grade = 2;

-- 1학년 학생들 -> 1학년 과목 등록
INSERT INTO enrollments (course_id, student_id)
SELECT c.id, u.id 
FROM courses c 
CROSS JOIN users u 
WHERE c.grade = 1 AND u.role = 'student' AND u.grade = 1;

-- 샘플 메시지 데이터
-- 교원(inst001, id=2) -> 학생(202021001, id=12)
INSERT INTO messages (sender_id, receiver_id, content, is_read, created_at) VALUES
(2, 12, '지난 주 과제 제출이 누락되었습니다. 확인 부탁드립니다.', TRUE, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(12, 2, '교수님, 과제 제출했습니다. 확인 부탁드립니다!', TRUE, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 12, '확인했습니다. 잘 작성되었네요.', FALSE, DATE_SUB(NOW(), INTERVAL 12 HOUR));

-- 학생(202021002, id=13) -> 교원(inst002, id=3)
INSERT INTO messages (sender_id, receiver_id, content, is_read, created_at) VALUES
(13, 3, '교수님, 다음 주 시험 범위가 어디까지인가요?', TRUE, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(3, 13, '3장부터 6장까지입니다.', FALSE, DATE_SUB(NOW(), INTERVAL 1 HOUR));

-- 학생(202121001, id=17) -> 교원(inst003, id=4)
INSERT INTO messages (sender_id, receiver_id, content, is_read, created_at) VALUES
(17, 4, '교수님, 프로젝트 주제 변경 가능한가요?', FALSE, DATE_SUB(NOW(), INTERVAL 30 MINUTE));

-- 완료 메시지
SELECT '시드 데이터 입력이 완료되었습니다.' AS message;
