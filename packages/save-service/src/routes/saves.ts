import { Router, Response } from 'express';
import { query } from '../database';
import { cacheGet, cacheSet, cacheDel } from '../redis';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import {
  createApiResponse,
  createErrorResponse,
  isValidPlatform,
  CloudSave,
  CreateSaveRequest,
  HTTP_STATUS,
  MAX_SAVE_SLOTS,
  AUTO_SAVE_SLOT,
} from '@emu-matrix/shared';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const cacheKey = `saves:user:${req.userId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const result = await query(
      `SELECT id, user_id, game_id, platform, slot_id, save_name, screenshot_url, play_time, is_auto_save, created_at, updated_at
       FROM cloud_saves
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [req.userId]
    );

    const apiResponse = createApiResponse(result.rows);
    await cacheSet(cacheKey, JSON.stringify(apiResponse), 120);
    res.json(apiResponse);
  } catch (error) {
    console.error('Get saves error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Failed to get saves'));
  }
});

router.get('/:gameId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { platform } = req.query as { platform?: string };

  try {
    let sql = `SELECT id, user_id, game_id, platform, slot_id, save_name, screenshot_url, play_time, is_auto_save, created_at, updated_at
               FROM cloud_saves WHERE user_id = $1 AND game_id = $2`;
    const params: unknown[] = [req.userId, req.params.gameId];

    if (platform && isValidPlatform(platform)) {
      sql += ' AND platform = $3';
      params.push(platform);
    }

    sql += ' ORDER BY slot_id ASC';

    const result = await query(sql, params);
    res.json(createApiResponse(result.rows));
  } catch (error) {
    console.error('Get game saves error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Failed to get game saves'));
  }
});

router.get('/:gameId/:platform/:slotId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { gameId, platform, slotId } = req.params;

  if (!isValidPlatform(platform)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse('VALIDATION_ERROR', 'Invalid platform'));
    return;
  }

  const slot = parseInt(slotId, 10);
  if (isNaN(slot) || (slot !== AUTO_SAVE_SLOT && (slot < 1 || slot > MAX_SAVE_SLOTS))) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse('VALIDATION_ERROR', `Slot must be 0 (auto) or 1-${MAX_SAVE_SLOTS}`));
    return;
  }

  try {
    const cacheKey = `saves:data:${req.userId}:${gameId}:${platform}:${slotId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const result = await query(
      'SELECT * FROM cloud_saves WHERE user_id = $1 AND game_id = $2 AND platform = $3 AND slot_id = $4',
      [req.userId, gameId, platform, slot]
    );

    if (result.rows.length === 0) {
      res.status(HTTP_STATUS.NOT_FOUND).json(createErrorResponse('NOT_FOUND', 'Save not found'));
      return;
    }

    const save: CloudSave = result.rows[0];
    const apiResponse = createApiResponse(save);
    await cacheSet(cacheKey, JSON.stringify(apiResponse), 300);
    res.json(apiResponse);
  } catch (error) {
    console.error('Get save data error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Failed to get save data'));
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { game_id, platform, slot_id, save_name, save_data, screenshot_url, play_time, is_auto_save }: CreateSaveRequest = req.body;

  if (!game_id || !platform || !save_data || slot_id === undefined) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse('VALIDATION_ERROR', 'game_id, platform, slot_id, and save_data are required'));
    return;
  }

  if (!isValidPlatform(platform)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse('VALIDATION_ERROR', 'Invalid platform'));
    return;
  }

  if (slot_id !== AUTO_SAVE_SLOT && (slot_id < 1 || slot_id > MAX_SAVE_SLOTS)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse('VALIDATION_ERROR', `Slot must be 0 (auto) or 1-${MAX_SAVE_SLOTS}`));
    return;
  }

  try {
    const result = await query(
      `INSERT INTO cloud_saves (user_id, game_id, platform, slot_id, save_name, save_data, screenshot_url, play_time, is_auto_save)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id, game_id, platform, slot_id)
       DO UPDATE SET save_name = $5, save_data = $6, screenshot_url = $7, play_time = $8, is_auto_save = $9, updated_at = NOW()
       RETURNING id, user_id, game_id, platform, slot_id, save_name, screenshot_url, play_time, is_auto_save, created_at, updated_at`,
      [
        req.userId,
        game_id,
        platform,
        slot_id,
        save_name || null,
        save_data,
        screenshot_url || null,
        play_time || 0,
        is_auto_save ?? false,
      ]
    );

    await cacheDel(`saves:user:${req.userId}`);
    await cacheDel(`saves:data:${req.userId}:${game_id}:${platform}:${slot_id}`);

    res.status(HTTP_STATUS.CREATED).json(createApiResponse(result.rows[0], 'Save created successfully'));
  } catch (error) {
    console.error('Create save error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Failed to create save'));
  }
});

router.delete('/:saveId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('DELETE FROM cloud_saves WHERE id = $1 AND user_id = $2 RETURNING game_id, platform, slot_id', [req.params.saveId, req.userId]);

    if (result.rows.length === 0) {
      res.status(HTTP_STATUS.NOT_FOUND).json(createErrorResponse('NOT_FOUND', 'Save not found'));
      return;
    }

    const { game_id, platform, slot_id } = result.rows[0];
    await cacheDel(`saves:user:${req.userId}`);
    await cacheDel(`saves:data:${req.userId}:${game_id}:${platform}:${slot_id}`);

    res.json(createApiResponse(null, 'Save deleted successfully'));
  } catch (error) {
    console.error('Delete save error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Failed to delete save'));
  }
});

export default router;
