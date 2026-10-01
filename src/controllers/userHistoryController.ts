import type { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import { pool } from '../config/db.js';
import { tmdb } from './mediaControllers.js';
import { logger } from '../middleware/logger.js';

export const getWatchHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    throw createHttpError(401, 'Unauthorized');
  }

  try {
    const page = Math.max(Number(req.query.page) || 1, 1);

    const requestedLimit = Number(req.query.limit) || 12;

    const limit = Math.min(Math.max(requestedLimit, 1), 50);
    const offset = (page - 1) * limit;

    const historyData = await pool.query(
      `
        SELECT
          id,
          tmdb_id,
          media_type,
          title,
          poster_path,
          release_date,
          genres,
          progress_seconds,
          duration_seconds,
          watched_at
        FROM watch_history
        WHERE user_id = $1
        ORDER BY watched_at DESC
        LIMIT $2
        OFFSET $3
      `,
      [req.user.id, limit, offset],
    );

    const countData = await pool.query(
      `
        SELECT COUNT(*)::int AS total
        FROM watch_history
        WHERE user_id = $1
      `,
      [req.user.id],
    );

    const total = countData.rows[0].total;

    res.status(200).json({
      history: historyData.rows,
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    });
  } catch (err) {
    logger.error({ err }, 'Fetching watch history failed');
    next(err instanceof Error ? err : new Error(JSON.stringify(err)));
  }
};

export const getWatchHistoryItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    throw createHttpError(401, 'Unauthorized');
  }

  try {
    const { media_type, tmdbId } = req.params;

    const historyData = await pool.query(
      `
        SELECT
          id,
          tmdb_id,
          media_type,
          title,
          poster_path,
          release_date,
          genres,
          progress_seconds,
          duration_seconds,
          watched_at
        FROM watch_history
        WHERE user_id = $1
          AND tmdb_id = $2
          AND media_type = $3
      `,
      [req.user.id, tmdbId, media_type],
    );

    res.status(200).json({
      history: historyData.rows[0] ?? null,
    });
  } catch (err) {
    logger.error({ err }, 'Fetching watch history item failed');

    next(err instanceof Error ? err : new Error(JSON.stringify(err)));
  }
};

export const addWatchHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    throw createHttpError(401, 'Unauthorized');
  }
  try {
    const {
      tmdbId,
      media_type,
      progressSeconds = 0,
      durationSeconds = null,
    } = req.body;

    const endpoint =
      media_type === 'movie' ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
    const { data } = await tmdb.get(endpoint);
    const title = data.title ?? data.name;
    const releaseDate = data.release_date ?? data.first_air_date ?? null;
    const genres = data.genres?.map((genre: { id: number }) => genre.id) ?? [];
    const historyData = await pool.query(
      `
      INSERT INTO watch_history ( user_id, tmdb_id, media_type, title, poster_path, release_date, genres, progress_seconds, duration_seconds, watched_at )
       VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() )
       ON CONFLICT (user_id, tmdb_id, media_type)
       DO UPDATE SET title = EXCLUDED.title, poster_path = EXCLUDED.poster_path, release_date = EXCLUDED.release_date, genres = EXCLUDED.genres, progress_seconds = EXCLUDED.progress_seconds, duration_seconds = EXCLUDED.duration_seconds, watched_at = NOW()
       RETURNING id, tmdb_id, media_type, title, poster_path, release_date, genres, progress_seconds, duration_seconds, watched_at `,
      [
        req.user.id,
        tmdbId,
        media_type,
        title,
        data.poster_path,
        releaseDate,
        genres,
        progressSeconds,
        durationSeconds,
      ],
    );
    res.status(200).json({ history: historyData.rows[0] });
  } catch (err) {
    logger.error({ err }, 'Saving watch history failed');
    next(err instanceof Error ? err : new Error(JSON.stringify(err)));
  }
};
