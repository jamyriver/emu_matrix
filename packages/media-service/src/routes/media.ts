import { Router, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database';
import { cacheGet, cacheSet, cacheDel } from '../redis';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { uploadObject, deleteObject, getObjectUrl } from '../storage';
import { addTranscodeJob } from '../workers/recording-worker';
import {
  createApiResponse,
  createErrorResponse,
  isValidPlatform,
  CloudScreenshot,
  CloudRecording,
  CreateScreenshotRequest,
  CreateRecordingRequest,
  HTTP_STATUS,
} from '@emu-matrix/shared';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

const router = Router();

router.post('/screenshots', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  const { game_id, platform, is_public, description } = req.body;
  const file = req.file;

  if (!platform || !isValidPlatform(platform)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse('VALIDATION_ERROR', 'Valid platform is required'));
    return;
  }

  if (!file) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse('VALIDATION_ERROR', 'Screenshot file is required'));
    return;
  }

  try {
    const screenshotId = uuidv4();
    const objectName = `${platform}/screenshots/${req.userId}/${screenshotId}.png`;

    await uploadObject(objectName, file.buffer, 'image/png');

    const thumbnailObjectName = `${platform}/screenshots/${req.userId}/${screenshotId}_thumb.png`;

    await uploadObject(thumbnailObjectName, file.buffer, 'image/png');

    const screenshotUrl = getObjectUrl(objectName);
    const thumbnailUrl = getObjectUrl(thumbnailObjectName);

    const result = await query(
      `INSERT INTO cloud_screenshots (user_id, game_id, platform, screenshot_url, thumbnail_url, width, height, file_size, is_public, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, user_id, game_id, platform, screenshot_url, thumbnail_url, width, height, file_size, is_public, description, created_at`,
      [
        req.userId,
        game_id || null,
        platform,
        screenshotUrl,
        thumbnailUrl,
        req.body.width ? parseInt(req.body.width, 10) : null,
        req.body.height ? parseInt(req.body.height, 10) : null,
        file.size,
        is_public === 'true',
        description || null,
      ]
    );

    await cacheDel(`screenshots:user:${req.userId}`);

    res.status(HTTP_STATUS.CREATED).json(createApiResponse(result.rows[0], 'Screenshot uploaded'));
  } catch (error) {
    console.error('Upload screenshot error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Failed to upload screenshot'));
  }
});

router.get('/screenshots', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { platform, page = '1', pageSize = '20' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  const offset = (pageNum - 1) * pageSizeNum;

  try {
    let sql = 'SELECT id, user_id, game_id, platform, screenshot_url, thumbnail_url, width, height, file_size, is_public, description, created_at FROM cloud_screenshots WHERE user_id = $1';
    const params: unknown[] = [req.userId];

    if (platform && isValidPlatform(platform)) {
      sql += ' AND platform = $2';
      params.push(platform);
    }

    const countResult = await query(`SELECT COUNT(*) FROM cloud_screenshots WHERE user_id = $1${platform && isValidPlatform(platform) ? ' AND platform = $2' : ''}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const nextParamIndex = params.length + 1;
    sql += ` ORDER BY created_at DESC LIMIT $${nextParamIndex} OFFSET $${nextParamIndex + 1}`;
    params.push(pageSizeNum, offset);

    const result = await query(sql, params);

    res.json(createApiResponse({
      items: result.rows,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
    }));
  } catch (error) {
    console.error('Get screenshots error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Failed to get screenshots'));
  }
});

router.get('/screenshots/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, user_id, game_id, platform, screenshot_url, thumbnail_url, width, height, file_size, is_public, description, created_at FROM cloud_screenshots WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(HTTP_STATUS.NOT_FOUND).json(createErrorResponse('NOT_FOUND', 'Screenshot not found'));
      return;
    }

    res.json(createApiResponse(result.rows[0]));
  } catch (error) {
    console.error('Get screenshot error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Failed to get screenshot'));
  }
});

router.delete('/screenshots/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('DELETE FROM cloud_screenshots WHERE id = $1 AND user_id = $2 RETURNING screenshot_url', [req.params.id, req.userId]);

    if (result.rows.length === 0) {
      res.status(HTTP_STATUS.NOT_FOUND).json(createErrorResponse('NOT_FOUND', 'Screenshot not found'));
      return;
    }

    await cacheDel(`screenshots:user:${req.userId}`);
    res.json(createApiResponse(null, 'Screenshot deleted'));
  } catch (error) {
    console.error('Delete screenshot error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Failed to delete screenshot'));
  }
});

router.post('/recordings', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  const { game_id, platform, title, duration, is_public } = req.body;
  const file = req.file;

  if (!platform || !isValidPlatform(platform)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse('VALIDATION_ERROR', 'Valid platform is required'));
    return;
  }

  if (!file) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse('VALIDATION_ERROR', 'Recording file is required'));
    return;
  }

  try {
    const recordingId = uuidv4();
    const objectName = `${platform}/recordings/${req.userId}/${recordingId}.webm`;

    await uploadObject(objectName, file.buffer, 'video/webm');

    const videoUrl = getObjectUrl(objectName);

    const result = await query(
      `INSERT INTO cloud_recordings (user_id, game_id, platform, title, video_url, duration, file_size, status, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'processing', $8)
       RETURNING id, user_id, game_id, platform, title, video_url, thumbnail_url, duration, file_size, status, is_public, play_count, created_at`,
      [
        req.userId,
        game_id || null,
        platform,
        title || null,
        videoUrl,
        duration ? parseInt(duration, 10) : null,
        file.size,
        is_public === 'true',
      ]
    );

    await addTranscodeJob({
      recordingId: result.rows[0].id,
      videoUrl,
      platform,
    });

    await cacheDel(`recordings:user:${req.userId}`);

    res.status(HTTP_STATUS.CREATED).json(createApiResponse(result.rows[0], 'Recording uploaded and queued for processing'));
  } catch (error) {
    console.error('Upload recording error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Failed to upload recording'));
  }
});

router.get('/recordings', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { platform, page = '1', pageSize = '20' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  const offset = (pageNum - 1) * pageSizeNum;

  try {
    let sql = 'SELECT id, user_id, game_id, platform, title, video_url, thumbnail_url, duration, file_size, status, is_public, play_count, created_at FROM cloud_recordings WHERE user_id = $1';
    const params: unknown[] = [req.userId];

    if (platform && isValidPlatform(platform)) {
      sql += ' AND platform = $2';
      params.push(platform);
    }

    const countResult = await query(`SELECT COUNT(*) FROM cloud_recordings WHERE user_id = $1${platform && isValidPlatform(platform) ? ' AND platform = $2' : ''}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const nextParamIndex = params.length + 1;
    sql += ` ORDER BY created_at DESC LIMIT $${nextParamIndex} OFFSET $${nextParamIndex + 1}`;
    params.push(pageSizeNum, offset);

    const result = await query(sql, params);

    res.json(createApiResponse({
      items: result.rows,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
    }));
  } catch (error) {
    console.error('Get recordings error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Failed to get recordings'));
  }
});

router.get('/recordings/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, user_id, game_id, platform, title, video_url, thumbnail_url, duration, file_size, status, is_public, play_count, created_at FROM cloud_recordings WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(HTTP_STATUS.NOT_FOUND).json(createErrorResponse('NOT_FOUND', 'Recording not found'));
      return;
    }

    res.json(createApiResponse(result.rows[0]));
  } catch (error) {
    console.error('Get recording error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Failed to get recording'));
  }
});

router.delete('/recordings/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('DELETE FROM cloud_recordings WHERE id = $1 AND user_id = $2 RETURNING video_url', [req.params.id, req.userId]);

    if (result.rows.length === 0) {
      res.status(HTTP_STATUS.NOT_FOUND).json(createErrorResponse('NOT_FOUND', 'Recording not found'));
      return;
    }

    await cacheDel(`recordings:user:${req.userId}`);
    res.json(createApiResponse(null, 'Recording deleted'));
  } catch (error) {
    console.error('Delete recording error:', error);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json(createErrorResponse('INTERNAL_ERROR', 'Failed to delete recording'));
  }
});

export default router;
