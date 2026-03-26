FROM node:20-alpine

WORKDIR /app

COPY prisma/ ./prisma/
COPY package*.json ./
RUN npm ci
RUN npx prisma generate

COPY tsconfig.json ./
COPY src/ ./src/

EXPOSE 8080

CMD ["npx", "tsx", "src/index.ts"]
