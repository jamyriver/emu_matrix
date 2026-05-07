import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT_GATEWAY || 3000;

app.use(cors());
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'RATE_LIMITED', message: 'Too many auth attempts, please try again later' },
});

const authServiceUrl = `http://localhost:${process.env.PORT_AUTH || 3001}`;
const gameServiceUrl = `http://localhost:${process.env.PORT_GAME || 3002}`;
const saveServiceUrl = `http://localhost:${process.env.PORT_SAVE || 3003}`;
const mediaServiceUrl = `http://localhost:${process.env.PORT_MEDIA || 3004}`;

app.use('/api/auth', authLimiter, createProxyMiddleware({
  target: authServiceUrl,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/api/auth' },
}));

app.use('/api/games', apiLimiter, createProxyMiddleware({
  target: gameServiceUrl,
  changeOrigin: true,
  pathRewrite: { '^/api/games': '/api/games' },
}));

app.use('/api/saves', apiLimiter, createProxyMiddleware({
  target: saveServiceUrl,
  changeOrigin: true,
  pathRewrite: { '^/api/saves': '/api/saves' },
}));

app.use('/api/screenshots', apiLimiter, createProxyMiddleware({
  target: mediaServiceUrl,
  changeOrigin: true,
  pathRewrite: { '^/api/screenshots': '/api/screenshots' },
}));

app.use('/api/recordings', apiLimiter, createProxyMiddleware({
  target: mediaServiceUrl,
  changeOrigin: true,
  pathRewrite: { '^/api/recordings': '/api/recordings' },
}));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    routes: {
      auth: authServiceUrl,
      games: gameServiceUrl,
      saves: saveServiceUrl,
      media: mediaServiceUrl,
    },
  });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Gateway error:', err);
  res.status(500).json({ success: false, error: 'GATEWAY_ERROR', message: 'An error occurred in the API gateway' });
});

const server = app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`  → Auth service:   ${authServiceUrl}`);
  console.log(`  → Game service:   ${gameServiceUrl}`);
  console.log(`  → Save service:   ${saveServiceUrl}`);
  console.log(`  → Media service:  ${mediaServiceUrl}`);
});

process.on('SIGTERM', () => {
  server.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  server.close();
  process.exit(0);
});

export default app;
