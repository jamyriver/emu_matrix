FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/auth-service/package.json packages/auth-service/
COPY packages/game-service/package.json packages/game-service/
COPY packages/save-service/package.json packages/save-service/
COPY packages/media-service/package.json packages/media-service/
COPY packages/gateway/package.json packages/gateway/
COPY packages/ws-service/package.json packages/ws-service/

COPY package-lock.json* ./

RUN npm install --workspaces --if-present

COPY . .

RUN npm run build -w packages/shared
RUN npm run build -w packages/auth-service
RUN npm run build -w packages/game-service
RUN npm run build -w packages/save-service
RUN npm run build -w packages/media-service
RUN npm run build -w packages/gateway
RUN npm run build -w packages/ws-service

FROM node:20-alpine AS runtime

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/shared/package.json packages/shared/
COPY --from=builder /app/packages/shared/dist packages/shared/dist/
COPY --from=builder /app/node_modules node_modules/
COPY --from=builder /app/packages/shared/node_modules packages/shared/node_modules/

CMD ["node", "packages/gateway/dist/index.js"]
