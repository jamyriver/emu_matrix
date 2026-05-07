import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, authMiddleware } from '../middleware/auth';
import { isValidEmail, isValidPassword, sanitizeUsername, generateRoomCode, createApiResponse, createErrorResponse } from '@emu-matrix/shared';

describe('Auth Middleware', () => {
  const originalSecret = process.env.JWT_ACCESS_SECRET;

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-secret';
  });

  afterAll(() => {
    process.env.JWT_ACCESS_SECRET = originalSecret;
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateAccessToken('user-123');
      expect(token).toBeDefined();
      const decoded = jwt.verify(token, 'test-secret') as { userId: string };
      expect(decoded.userId).toBe('user-123');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken('user-123');
      expect(token).toBeDefined();
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'default-refresh-secret') as { userId: string };
      expect(decoded.userId).toBe('user-123');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken('user-123');
      const result = verifyRefreshToken(token);
      expect(result).not.toBeNull();
      expect(result?.userId).toBe('user-123');
    });

    it('should return null for invalid token', () => {
      const result = verifyRefreshToken('invalid-token');
      expect(result).toBeNull();
    });
  });

  describe('authMiddleware', () => {
    it('should reject requests without authorization header', () => {
      const req = { headers: {} } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const next = jest.fn();

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should accept valid Bearer token', () => {
      const token = generateAccessToken('user-123');
      const req = {
        headers: { authorization: `Bearer ${token}` },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const next = jest.fn();

      authMiddleware(req, res, next);

      expect(req.userId).toBe('user-123');
      expect(next).toHaveBeenCalled();
    });

    it('should reject expired/invalid token', () => {
      const req = {
        headers: { authorization: 'Bearer invalid-token' },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const next = jest.fn();

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

describe('Shared Utilities', () => {
  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.name@domain.org')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should accept passwords with 6+ characters', () => {
      expect(isValidPassword('123456')).toBe(true);
      expect(isValidPassword('longpassword')).toBe(true);
    });

    it('should reject short passwords', () => {
      expect(isValidPassword('12345')).toBe(false);
      expect(isValidPassword('')).toBe(false);
    });
  });

  describe('sanitizeUsername', () => {
    it('should lowercase and remove invalid characters', () => {
      expect(sanitizeUsername('Player One')).toBe('playerone');
      expect(sanitizeUsername('User_Name123')).toBe('user_name123');
      expect(sanitizeUsername('  spaced  ')).toBe('spaced');
    });
  });

  describe('generateRoomCode', () => {
    it('should generate a 6-character code', () => {
      const code = generateRoomCode();
      expect(code).toHaveLength(6);
      expect(/^[A-Z0-9]+$/.test(code)).toBe(true);
    });

    it('should generate unique codes', () => {
      const codes = new Set(Array.from({ length: 100 }, () => generateRoomCode()));
      expect(codes.size).toBeGreaterThan(90);
    });
  });

  describe('createApiResponse', () => {
    it('should create success response with data', () => {
      const response = createApiResponse({ id: '123' }, 'Success');
      expect(response.success).toBe(true);
      expect(response.data).toEqual({ id: '123' });
      expect(response.message).toBe('Success');
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response', () => {
      const response = createErrorResponse('NOT_FOUND', 'Resource not found');
      expect(response.success).toBe(false);
      expect(response.error).toBe('NOT_FOUND');
      expect(response.message).toBe('Resource not found');
    });
  });
});
