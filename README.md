## Main Features

- **관리자**: 사용자/학기/강의 관리, 감사 로그 조회
- **교원**: 출석 관리(전자출결/인증코드/호명), 공결 승인, 강의 공지, 투표 생성
- **학생**: 출석 체크, 출석 현황 확인, 공결/이의 신청, 쪽지


## Getting Started

### Prerequisites

- **Docker Desktop** 설치 필요
  - macOS: https://docs.docker.com/desktop/install/mac-install/
  - Windows: https://docs.docker.com/desktop/install/windows-install/
  - Linux: https://docs.docker.com/desktop/install/linux-install/

### 1. Clone the Project

```bash
git clone <repository-url>
cd web-server-project
```

### 2. Run with Docker

```bash
# 모든 서비스 빌드 및 실행 (백그라운드)
docker compose up -d --build
```

> 최초 실행 시 이미지 빌드와 MySQL 초기화로 1-2분 소요됩니다.

### 3. Verify Running Status

```bash
# 모든 컨테이너 상태 확인
docker compose ps
```

다음과 같이 3개 서비스가 모두 실행 중이어야 합니다:
```
NAME                  STATUS
attendance-mysql      Up (healthy)
attendance-backend    Up
attendance-frontend   Up
```

### 4. Access the Application

**http://localhost:5173** 접속


## 프로젝트 구조

```
web-server-project/
├── docker-compose.yml      # Docker 오케스트레이션
├── backend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── app.js          # Express 앱 진입점
│   │   ├── config/         # 설정 파일
│   │   ├── controllers/    # API 컨트롤러
│   │   ├── routes/         # 라우트 정의
│   │   ├── middlewares/    # 인증/감사 미들웨어
│   │   └── models/         # DB 연결
│   └── database/
│       ├── schema.sql      # 테이블 스키마
│       └── seed.sql        # 초기 데이터
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── pages/          # Vue 페이지 컴포넌트
│   │   ├── components/     # 재사용 컴포넌트
│   │   ├── stores/         # Pinia 상태 관리
│   │   ├── api/            # API 클라이언트
│   │   └── router/         # Vue Router
│   └── vite.config.js
└── docs/
    └── project-plan.md     # 프로젝트 요구사항
```

## DB 접속

```bash
# Docker 컨테이너 내 MySQL 접속
docker exec -it attendance-mysql mysql -uattendance_user -pattendance_pass attendance_db
```
