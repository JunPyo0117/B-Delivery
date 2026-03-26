FROM node:20-alpine AS builder

WORKDIR /app

# Prisma 스키마 복사 (루트 prisma/ → Docker 빌드 컨텍스트)
COPY prisma/ ./prisma/

COPY package*.json ./
RUN npm ci

# Prisma 클라이언트 생성
RUN npx prisma generate

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# --- 런타임 ---
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 8080

CMD ["node", "dist/index.js"]
