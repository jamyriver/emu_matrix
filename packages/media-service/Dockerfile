FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/media-service/package.json packages/media-service/
COPY package-lock.json* ./
RUN npm install --workspaces
COPY . .
RUN npm run build -w packages/shared
RUN npm run build -w packages/media-service

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/shared/ packages/shared/
COPY --from=builder /app/packages/media-service/ packages/media-service/
COPY --from=builder /app/node_modules/ node_modules/
EXPOSE 3004
CMD ["node", "packages/media-service/dist/index.js"]
