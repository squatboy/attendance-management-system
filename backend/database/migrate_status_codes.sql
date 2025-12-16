-- 출석 상태 코드 변환 마이그레이션 스크립트
-- ENUM 문자열 → TINYINT 숫자 코드로 변환
-- 0: 미정(pending), 1: 출석(present), 2: 지각(late), 3: 결석(absent), 4: 공결(excused)

USE attendance_db;

-- 1. attendance 테이블 백업
CREATE TABLE IF NOT EXISTS attendance_backup AS SELECT * FROM attendance;

-- 2. attendance 테이블 컬럼 변경 및 데이터 변환
ALTER TABLE attendance 
  MODIFY COLUMN status TINYINT NOT NULL DEFAULT 3 COMMENT '출석 상태 (0:미정, 1:출석, 2:지각, 3:결석, 4:공결)';

-- 기존 문자열 데이터를 숫자로 변환
UPDATE attendance SET status = 0 WHERE status = 'pending';
UPDATE attendance SET status = 1 WHERE status = 'present';
UPDATE attendance SET status = 2 WHERE status = 'late';
UPDATE attendance SET status = 3 WHERE status = 'absent';
UPDATE attendance SET status = 4 WHERE status = 'excused';

-- 3. appeals 테이블 백업
CREATE TABLE IF NOT EXISTS appeals_backup AS SELECT * FROM appeals;

-- 4. appeals 테이블 컬럼 변경 및 데이터 변환
ALTER TABLE appeals 
  MODIFY COLUMN original_status TINYINT NOT NULL COMMENT '원래 출석 상태 코드',
  MODIFY COLUMN requested_status TINYINT NOT NULL COMMENT '요청 출석 상태 코드 (0,1,2,4만 가능)';

UPDATE appeals SET original_status = 0 WHERE original_status = 'pending';
UPDATE appeals SET original_status = 1 WHERE original_status = 'present';
UPDATE appeals SET original_status = 2 WHERE original_status = 'late';
UPDATE appeals SET original_status = 3 WHERE original_status = 'absent';
UPDATE appeals SET original_status = 4 WHERE original_status = 'excused';

UPDATE appeals SET requested_status = 0 WHERE requested_status = 'pending';
UPDATE appeals SET requested_status = 1 WHERE requested_status = 'present';
UPDATE appeals SET requested_status = 2 WHERE requested_status = 'late';
UPDATE appeals SET requested_status = 4 WHERE requested_status = 'excused';

-- 변환 완료 확인
SELECT 'Migration completed!' as status;
SELECT DISTINCT status, COUNT(*) as count FROM attendance GROUP BY status;
