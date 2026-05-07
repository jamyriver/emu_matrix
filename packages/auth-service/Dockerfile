FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/auth-service/package.json packages/auth-service/
COPY package-lock.json* ./
RUN npm install --workspaces
COPY . .
RUN npm run build -w packages/shared
RUN npm run build -w packages/auth-service

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/shared/ packages/shared/
COPY --from=builder /app/packages/auth-service/ packages/auth-service/
COPY --from=builder /app/node_modules/ node_modules/
EXPOSE 3001
CMD ["node", "packages/auth-service/dist/index.js"]
