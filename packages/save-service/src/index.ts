import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import saveRoutes from './routes/saves';
import { closePool } from './database';
import { closeRedis } from './redis';

dotenv.config();

const app = express();
const PORT = process.env.PORT_SAVE || 3003;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/saves', saveRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'save-service', timestamp: new Date().toISOString() });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' });
});

const server = app.listen(PORT, () => {
  console.log(`Save service running on port ${PORT}`);
});

process.on('SIGTERM', async () => {
  server.close();
  await closePool();
  await closeRedis();
  process.exit(0);
});

process.on('SIGINT', async () => {
  server.close();
  await closePool();
  await closeRedis();
  process.exit(0);
});

export default app;
