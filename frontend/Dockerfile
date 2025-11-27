# Frontend Dockerfile
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 코드 복사
COPY . .

# 포트 노출
EXPOSE 5173

# 개발 서버 실행 (호스트 바인딩 필요)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
