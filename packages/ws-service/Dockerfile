FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/ws-service/package.json packages/ws-service/
COPY package-lock.json* ./
RUN npm install --workspaces
COPY . .
RUN npm run build -w packages/shared
RUN npm run build -w packages/ws-service

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/shared/ packages/shared/
COPY --from=builder /app/packages/ws-service/ packages/ws-service/
COPY --from=builder /app/node_modules/ node_modules/
EXPOSE 3005
CMD ["node", "packages/ws-service/dist/index.js"]
