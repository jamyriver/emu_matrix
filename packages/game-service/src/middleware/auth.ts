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

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const secret = process.env.JWT_ACCESS_SECRET || 'default-access-secret';
      const decoded = jwt.verify(token, secret) as { userId: string };
      req.userId = decoded.userId;
    } catch {}
  }
  next();
}
