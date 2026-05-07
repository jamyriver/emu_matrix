import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mediaRoutes from './routes/media';
import { closePool } from './database';
import { closeRedis } from './redis';
import { ensureBucket } from './storage';
import { startRecordingWorker } from './workers/recording-worker';

dotenv.config();

const app = express();
const PORT = process.env.PORT_MEDIA || 3004;

app.use(cors());
app.use(express.json());

app.use('/api', mediaRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'media-service', timestamp: new Date().toISOString() });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' });
});

const server = app.listen(PORT, async () => {
  console.log(`Media service running on port ${PORT}`);
  try {
    await ensureBucket();
    console.log('MinIO bucket ensured');
    startRecordingWorker();
    console.log('Recording worker started');
  } catch (error) {
    console.error('Initialization error:', error);
  }
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
