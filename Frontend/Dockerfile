FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

RUN npm i -g serve@14

COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]

