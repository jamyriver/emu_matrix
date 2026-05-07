import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import { closePool } from './database';
import { closeRedis } from './redis';

dotenv.config();

const app = express();
const PORT = process.env.PORT_AUTH || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' });
});

const server = app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  server.close();
  await closePool();
  await closeRedis();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  server.close();
  await closePool();
  await closeRedis();
  process.exit(0);
});

export default app;
