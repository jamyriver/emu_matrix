import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createErrorResponse } from '@emu-matrix/shared';

export interface AuthRequest extends Request {
  userId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Missing or invalid authorization header'));
    return;
  }

  const token = authHeader.substring(7);
  try {
    const secret = process.env.JWT_ACCESS_SECRET || 'default-access-secret';
    const decoded = jwt.verify(token, secret) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json(createErrorResponse('TOKEN_EXPIRED', 'Access token is expired or invalid'));
  }
}

export function generateAccessToken(userId: string): string {
  const secret = process.env.JWT_ACCESS_SECRET || 'default-access-secret';
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '7d';
  return jwt.sign({ userId }, secret, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
}

export function generateRefreshToken(userId: string): string {
  const secret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
  return jwt.sign({ userId }, secret, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const secret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
    return jwt.verify(token, secret) as { userId: string };
  } catch {
    return null;
  }
}
