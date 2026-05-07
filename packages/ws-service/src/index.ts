import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupSignaling } from './signaling';

dotenv.config();

const app = express();
const PORT = process.env.PORT_WS || 3005;

app.use(cors());
app.use(express.json());

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

setupSignaling(io);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ws-service', timestamp: new Date().toISOString() });
});

httpServer.listen(PORT, () => {
  console.log(`WebSocket service running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  io.close();
  httpServer.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  io.close();
  httpServer.close();
  process.exit(0);
});

export default app;
