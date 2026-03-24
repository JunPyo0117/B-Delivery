# B-Delivery

배달의 민족 클론 - 위치 기반 음식 주문/배달 플랫폼 웹앱

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 14+ (App Router), Tailwind CSS, shadcn/ui, Zustand |
| Backend | Next.js API Routes, NextAuth.js v5 |
| Chat Server | Go, Fiber, WebSocket, Redis Streams |
| Database | PostgreSQL, Prisma ORM |
| Cache | Redis |
| Storage | MinIO (S3 호환) |
| Maps | Kakao Map API, Kakao 우편번호 서비스 |
| Infra | Docker, docker-compose |

## 로컬 실행

### 사전 준비
- Docker, Docker Compose 설치
- Node.js 20+
- Go 1.22+

### 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일에 아래 값 입력:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Kakao Map
NEXT_PUBLIC_KAKAO_JS_KEY=

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/bdelivery

# Redis
REDIS_URL=redis://localhost:6379

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=bdelivery
```

### 실행

```bash
# 인프라 컨테이너 실행 (DB, Redis, MinIO, Chat Server)
docker-compose up -d

# 의존성 설치
npm install

# DB 마이그레이션
npx prisma migrate dev

# 개발 서버 실행
npm run dev
```

### 접속 주소

| 서비스 | 주소 |
|--------|------|
| 웹앱 | http://localhost:3000 |
| 채팅 서버 | http://localhost:8080 |
| MinIO 콘솔 | http://localhost:9001 |

## 컨테이너 구성

```
postgres    :5432   메인 데이터베이스
redis       :6379   세션 캐싱, 채팅 Pub/Sub
minio       :9000   이미지 스토리지
chat-server :8080   Go WebSocket 채팅 서버
web-app     :3000   Next.js 웹앱
```

## 주요 기능

- Google 소셜 로그인
- 위치 기반 주변 음식점 탐색 (반경 3km)
- 음식점 카테고리 필터 (한식/중식/치킨/피자 등)
- 메뉴 검색 (음식점명, 메뉴명, 카테고리 통합 검색)
- 장바구니 & 주문
- 실시간 주문 상태 업데이트 (WebSocket)
- 음식점 위치 지도 표시 (카카오 지도)
- 고객센터 실시간 1:1 채팅
- 리뷰 & 별점
- 음식점 사장 페이지 (주문 관리, 메뉴 관리)
- 관리자 페이지

## 사용자 역할

| 역할 | 설명 |
|------|------|
| `USER` | 일반 주문 고객 |
| `OWNER` | 음식점 사장 (마이페이지에서 음식점 등록 시 전환) |
| `ADMIN` | 플랫폼 관리자 |