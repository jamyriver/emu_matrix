import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database';
import { cacheSet, cacheDel, cacheGet } from '../redis';
import {
  authMiddleware,
  AuthRequest,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../middleware/auth';
import {
  createApiResponse,
  createErrorResponse,
  isValidEmail,
  isValidPassword,
  sanitizeUsername,
  User,
  AuthTokens,
  RegisterRequest,
  LoginRequest,
  HTTP_STATUS,
} from '@emu-matrix/shared';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { username, email, password }: RegisterRequest = req.body;

  if (!username || !email || !password) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse('VALIDATION_ERROR', 'All fields are required'));
    return;
  }

  const cleanUsername = sanitizeUsername(username);
  if (cleanUsername.length < 3 || cleanUsername.length > 50) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse('VALIDATION_ERROR', 'Username must be 3-50 characters'));
    return;
  }

  if (!isValidEmail(email)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse('VALIDATION_ERROR', 'Invalid email format'));
    return;
  }

  if (!isValidPassword(password)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse('VALIDATION_ERROR', 'Password must be at least 6 characters'));
    return;
  }

  try {
    const existingUser = await query('SELECT id FROM users WHERE username = $1 OR email = $2', [cleanUsername, email]);
    if (existingUser.rows.length > 0) {
      res.status(HTTP_STATUS.CONFLICT).json(createErrorResponse('CONFLICT', 'Username or email already exists'));
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, avatar_url, status, created_at',
      [cleanUsername, email, passwordHash]
    );

    const user = result.rows[0];
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await query(
      'INSERT INTO user_sessions (user_id, access_token, refresh_token, user_agent, ip_address, expires_at) VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL \'30 days\')',
      [user.id, accessToken, refreshToken, req.headers['user-agent'] || null, req.ip || null]
    );

    await cacheSet(`user:${user.id}`, JSON.stringify(user), 3600);

    const tokens: AuthTokens = { accessToken, refreshToken };
    res.status(HTTP_STATUS.CREATED).json(createApiResponse({ user, tokens }, 'Registration successful'));
  } catch (error) {
    console.error('Register error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Registration failed'));
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { username, password }: LoginRequest = req.body;

  if (!username || !password) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse('VALIDATION_ERROR', 'Username and password are required'));
    return;
  }

  try {
    const result = await query(
      'SELECT id, username, email, password_hash, avatar_url, status FROM users WHERE username = $1 OR email = $1',
      [username]
    );

    if (result.rows.length === 0) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json(createErrorResponse('INVALID_CREDENTIALS', 'Invalid username or password'));
      return;
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json(createErrorResponse('INVALID_CREDENTIALS', 'Invalid username or password'));
      return;
    }

    if (user.status !== 'active') {
      res.status(HTTP_STATUS.FORBIDDEN).json(createErrorResponse('ACCOUNT_DISABLED', 'Account is disabled'));
      return;
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await query(
      'INSERT INTO user_sessions (user_id, access_token, refresh_token, user_agent, ip_address, expires_at) VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL \'30 days\')',
      [user.id, accessToken, refreshToken, req.headers['user-agent'] || null, req.ip || null]
    );

    await query('UPDATE users SET last_login_at = NOW(), last_login_ip = $1 WHERE id = $2', [req.ip || null, user.id]);

    await cacheSet(`user:${user.id}`, JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url,
      status: user.status,
    }), 3600);

    const { password_hash, ...userWithoutPassword } = user;
    const tokens: AuthTokens = { accessToken, refreshToken };
    res.json(createApiResponse({ user: userWithoutPassword, tokens }, 'Login successful'));
  } catch (error) {
    console.error('Login error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Login failed'));
  }
});

router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);

    if (token) {
      await query('DELETE FROM user_sessions WHERE access_token = $1', [token]);
    }

    if (req.userId) {
      await cacheDel(`user:${req.userId}`);
    }

    res.json(createApiResponse(null, 'Logout successful'));
  } catch (error) {
    console.error('Logout error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Logout failed'));
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse('VALIDATION_ERROR', 'Refresh token is required'));
    return;
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json(createErrorResponse('TOKEN_EXPIRED', 'Invalid or expired refresh token'));
      return;
    }

    const sessionResult = await query('SELECT id FROM user_sessions WHERE refresh_token = $1 AND user_id = $2', [refreshToken, decoded.userId]);
    if (sessionResult.rows.length === 0) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json(createErrorResponse('TOKEN_EXPIRED', 'Session not found'));
      return;
    }

    const newAccessToken = generateAccessToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    await query('UPDATE user_sessions SET access_token = $1, refresh_token = $2 WHERE refresh_token = $3', [newAccessToken, newRefreshToken, refreshToken]);

    const tokens: AuthTokens = { accessToken: newAccessToken, refreshToken: newRefreshToken };
    res.json(createApiResponse(tokens, 'Token refreshed'));
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Token refresh failed'));
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const cached = await cacheGet(`user:${req.userId}`);
    if (cached) {
      const user = JSON.parse(cached);
      res.json(createApiResponse(user));
      return;
    }

    const result = await query('SELECT id, username, email, avatar_url, status, last_login_at, created_at, updated_at FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) {
      res.status(HTTP_STATUS.NOT_FOUND).json(createErrorResponse('NOT_FOUND', 'User not found'));
      return;
    }

    const user: User = result.rows[0];
    await cacheSet(`user:${req.userId}`, JSON.stringify(user), 3600);
    res.json(createApiResponse(user));
  } catch (error) {
    console.error('Get me error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Failed to get user info'));
  }
});

export default router;
