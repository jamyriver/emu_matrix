import { Router, Request, Response } from 'express';
import { query } from '../database';
import { cacheGet, cacheSet } from '../redis';
import { authMiddleware, optionalAuth, AuthRequest } from '../middleware/auth';
import {
  createApiResponse,
  createErrorResponse,
  isValidPlatform,
  Game,
  GameListQuery,
  PaginatedResponse,
  HTTP_STATUS,
  VALID_PLATFORMS,
  PLATFORM_LABELS,
  PLATFORM_CORE_MAP,
  PLATFORM_SYSTEM_MAP,
  PLATFORM_NATIVE_RESOLUTION,
  PLATFORM_TARGET_FPS,
  PLATFORM_CONTROL_MAPPINGS,
  PLATFORM_ROM_EXTENSIONS,
  validateRomFile,
} from '@emu-matrix/shared';

const router = Router();

router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  const {
    page = '1',
    pageSize = '20',
    platform,
    category,
    search,
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  const offset = (pageNum - 1) * pageSizeNum;

  try {
    const cacheKey = `games:list:${platform || 'all'}:${category || 'all'}:${search || 'none'}:${pageNum}:${pageSizeNum}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const conditions: string[] = ["status = 'active'"];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (platform && isValidPlatform(platform)) {
      conditions.push(`platform = $${paramIndex++}`);
      params.push(platform);
    }

    if (category) {
      conditions.push(`category = $${paramIndex++}`);
      params.push(category);
    }

    if (search) {
      conditions.push(`(name ILIKE $${paramIndex} OR name_en ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(`SELECT COUNT(*) FROM games ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT id, name, name_en, platform, cover_url, category, tags, description, release_year, publisher, play_count, favorite_count, status, created_at
       FROM games ${whereClause}
       ORDER BY play_count DESC, name ASC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, pageSizeNum, offset]
    );

    const response: PaginatedResponse<Game> = {
      items: result.rows,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
    };

    const apiResponse = createApiResponse(response);
    await cacheSet(cacheKey, JSON.stringify(apiResponse), 300);

    res.json(apiResponse);
  } catch (error) {
    console.error('Get games error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Failed to get games'));
  }
});

router.get('/platforms', (_req: Request, res: Response) => {
  const platforms = VALID_PLATFORMS.map((p) => ({
    id: p,
    label: PLATFORM_LABELS[p],
    core: PLATFORM_CORE_MAP[p],
    system: PLATFORM_SYSTEM_MAP[p],
    resolution: PLATFORM_NATIVE_RESOLUTION[p],
    targetFps: PLATFORM_TARGET_FPS[p],
    controls: PLATFORM_CONTROL_MAPPINGS[p],
    romExtensions: PLATFORM_ROM_EXTENSIONS[p],
  }));
  res.json(createApiResponse(platforms));
});

router.get('/recent', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT g.id, g.name, g.name_en, g.platform, g.cover_url, g.category, g.tags, g.description, g.release_year, g.publisher, g.play_count, g.favorite_count, g.status, g.created_at,
              r.last_played_at, r.platform as recent_platform
       FROM user_recent_games r
       JOIN games g ON r.game_id = g.id
       WHERE r.user_id = $1
       ORDER BY r.last_played_at DESC
       LIMIT 20`,
      [req.userId]
    );

    res.json(createApiResponse(result.rows));
  } catch (error) {
    console.error('Get recent games error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Failed to get recent games'));
  }
});

router.get('/favorites', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT g.id, g.name, g.name_en, g.platform, g.cover_url, g.category, g.tags, g.description, g.release_year, g.publisher, g.play_count, g.favorite_count, g.status, g.created_at,
              f.created_at as favorited_at
       FROM user_favorites f
       JOIN games g ON f.game_id = g.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.userId]
    );

    res.json(createApiResponse(result.rows));
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Failed to get favorites'));
  }
});

router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const cacheKey = `games:detail:${req.params.id}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const result = await query(
      'SELECT id, name, name_en, platform, cover_url, rom_url, rom_size, rom_md5, emulator_core, category, tags, description, release_year, publisher, play_count, favorite_count, status, created_at FROM games WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      res.status(HTTP_STATUS.NOT_FOUND).json(createErrorResponse('NOT_FOUND', 'Game not found'));
      return;
    }

    const apiResponse = createApiResponse(result.rows[0]);
    await cacheSet(cacheKey, JSON.stringify(apiResponse), 600);
    res.json(apiResponse);
  } catch (error) {
    console.error('Get game detail error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Failed to get game detail'));
  }
});

router.get('/:id/rom', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT rom_url, name, platform FROM games WHERE id = $1 AND status = $2', [req.params.id, 'active']);
    if (result.rows.length === 0) {
      res.status(HTTP_STATUS.NOT_FOUND).json(createErrorResponse('NOT_FOUND', 'Game not found'));
      return;
    }

    const game = result.rows[0];

    await query('UPDATE games SET play_count = play_count + 1 WHERE id = $1', [req.params.id]);

    await query(
      `INSERT INTO user_recent_games (user_id, game_id, platform, last_played_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, game_id) DO UPDATE SET last_played_at = NOW(), platform = $3`,
      [req.userId, req.params.id, game.platform]
    );

    res.json(createApiResponse({
      romUrl: game.rom_url,
      name: game.name,
      platform: game.platform,
      core: PLATFORM_CORE_MAP[game.platform as keyof typeof PLATFORM_CORE_MAP],
      system: PLATFORM_SYSTEM_MAP[game.platform as keyof typeof PLATFORM_SYSTEM_MAP],
      resolution: PLATFORM_NATIVE_RESOLUTION[game.platform as keyof typeof PLATFORM_NATIVE_RESOLUTION],
      controls: PLATFORM_CONTROL_MAPPINGS[game.platform as keyof typeof PLATFORM_CONTROL_MAPPINGS],
    }));
  } catch (error) {
    console.error('Get ROM error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Failed to get ROM'));
  }
});

router.post('/:id/favorite', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const gameResult = await query('SELECT id FROM games WHERE id = $1', [req.params.id]);
    if (gameResult.rows.length === 0) {
      res.status(HTTP_STATUS.NOT_FOUND).json(createErrorResponse('NOT_FOUND', 'Game not found'));
      return;
    }

    await query(
      'INSERT INTO user_favorites (user_id, game_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.userId, req.params.id]
    );

    await query('UPDATE games SET favorite_count = favorite_count + 1 WHERE id = $1', [req.params.id]);

    res.json(createApiResponse(null, 'Game added to favorites'));
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Failed to add favorite'));
  }
});

router.delete('/:id/favorite', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('DELETE FROM user_favorites WHERE user_id = $1 AND game_id = $2', [req.userId, req.params.id]);

    if ((result.rowCount ?? 0) > 0) {
      await query('UPDATE games SET favorite_count = GREATEST(favorite_count - 1, 0) WHERE id = $1', [req.params.id]);
    }

    res.json(createApiResponse(null, 'Game removed from favorites'));
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Failed to remove favorite'));
  }
});

export default router;
