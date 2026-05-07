FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/gateway/package.json packages/gateway/
COPY package-lock.json* ./
RUN npm install --workspaces
COPY . .
RUN npm run build -w packages/shared
RUN npm run build -w packages/gateway

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/shared/ packages/shared/
COPY --from=builder /app/packages/gateway/ packages/gateway/
COPY --from=builder /app/node_modules/ node_modules/
EXPOSE 3000
CMD ["node", "packages/gateway/dist/index.js"]
