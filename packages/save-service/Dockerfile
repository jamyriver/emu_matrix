FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/save-service/package.json packages/save-service/
COPY package-lock.json* ./
RUN npm install --workspaces
COPY . .
RUN npm run build -w packages/shared
RUN npm run build -w packages/save-service

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/shared/ packages/shared/
COPY --from=builder /app/packages/save-service/ packages/save-service/
COPY --from=builder /app/node_modules/ node_modules/
EXPOSE 3003
CMD ["node", "packages/save-service/dist/index.js"]
