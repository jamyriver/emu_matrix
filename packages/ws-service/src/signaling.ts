import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { generateRoomCode } from '@emu-matrix/shared';

interface Room {
  id: string;
  code: string;
  hostId: string;
  gameId: string;
  platform: string;
  players: Map<string, { id: string; username: string }>;
  createdAt: Date;
}

const rooms = new Map<string, Room>();
const userRooms = new Map<string, string>();

export function setupSignaling(io: SocketIOServer): void {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }

    try {
      const secret = process.env.JWT_ACCESS_SECRET || 'default-access-secret';
      const decoded = jwt.verify(token, secret) as { userId: string };
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    console.log(`User ${userId} connected`);

    socket.on('room:create', (data: { gameId: string; platform: string; username: string }) => {
      const existingRoom = userRooms.get(userId);
      if (existingRoom) {
        socket.emit('room:error', { message: 'Already in a room' });
        return;
      }

      const roomId = uuidv4();
      const code = generateRoomCode();
      const room: Room = {
        id: roomId,
        code,
        hostId: userId,
        gameId: data.gameId,
        platform: data.platform,
        players: new Map([[userId, { id: userId, username: data.username }]]),
        createdAt: new Date(),
      };

      rooms.set(roomId, room);
      userRooms.set(userId, roomId);
      socket.join(roomId);

      socket.emit('room:created', {
        roomId,
        code,
        gameId: data.gameId,
        platform: data.platform,
      });

      console.log(`Room ${code} created by ${userId}`);
    });

    socket.on('room:join', (data: { code: string; username: string }) => {
      const existingRoom = userRooms.get(userId);
      if (existingRoom) {
        socket.emit('room:error', { message: 'Already in a room' });
        return;
      }

      let targetRoom: Room | undefined;
      for (const room of rooms.values()) {
        if (room.code === data.code) {
          targetRoom = room;
          break;
        }
      }

      if (!targetRoom) {
        socket.emit('room:error', { message: 'Room not found' });
        return;
      }

      if (targetRoom.players.size >= 2) {
        socket.emit('room:error', { message: 'Room is full' });
        return;
      }

      targetRoom.players.set(userId, { id: userId, username: data.username });
      userRooms.set(userId, targetRoom.id);
      socket.join(targetRoom.id);

      socket.emit('room:joined', {
        roomId: targetRoom.id,
        code: targetRoom.code,
        gameId: targetRoom.gameId,
        platform: targetRoom.platform,
        hostId: targetRoom.hostId,
      });

      io.to(targetRoom.id).emit('room:player-joined', {
        playerId: userId,
        username: data.username,
        playerCount: targetRoom.players.size,
      });

      console.log(`User ${userId} joined room ${targetRoom.code}`);
    });

    socket.on('room:leave', () => {
      handleLeaveRoom(io, socket, userId);
    });

    socket.on('webrtc:offer', (data: { targetId: string; offer: unknown }) => {
      const roomId = userRooms.get(userId);
      if (!roomId) return;

      socket.to(roomId).emit('webrtc:offer', {
        fromId: userId,
        offer: data.offer,
      });
    });

    socket.on('webrtc:answer', (data: { targetId: string; answer: unknown }) => {
      const roomId = userRooms.get(userId);
      if (!roomId) return;

      socket.to(roomId).emit('webrtc:answer', {
        fromId: userId,
        answer: data.answer,
      });
    });

    socket.on('webrtc:ice-candidate', (data: { targetId: string; candidate: unknown }) => {
      const roomId = userRooms.get(userId);
      if (!roomId) return;

      socket.to(roomId).emit('webrtc:ice-candidate', {
        fromId: userId,
        candidate: data.candidate,
      });
    });

    socket.on('game:input', (data: { inputs: Record<string, boolean> }) => {
      const roomId = userRooms.get(userId);
      if (!roomId) return;

      socket.to(roomId).emit('game:input', {
        fromId: userId,
        inputs: data.inputs,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
      handleLeaveRoom(io, socket, userId);
    });
  });
}

function handleLeaveRoom(io: SocketIOServer, socket: Socket, userId: string): void {
  const roomId = userRooms.get(userId);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  room.players.delete(userId);
  userRooms.delete(userId);
  socket.leave(roomId);

  io.to(roomId).emit('room:player-left', {
    playerId: userId,
    playerCount: room.players.size,
  });

  if (room.players.size === 0) {
    rooms.delete(roomId);
    console.log(`Room ${room.code} deleted (empty)`);
  } else if (room.hostId === userId) {
    const newHost = room.players.values().next().value;
    if (newHost) {
      room.hostId = newHost.id;
      io.to(roomId).emit('room:host-changed', { newHostId: newHost.id });
    }
  }

  console.log(`User ${userId} left room ${room.code}`);
}
