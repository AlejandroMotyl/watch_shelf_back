import type { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { pool } from '../config/db.js';

export const getRating = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    throw createHttpError(401, 'Unauthorized');
  }
  try {
    const { media_type, tmdbId } = req.params;
    const ratingData = await pool.query(
      `
      SELECT id, tmdb_id, media_type, rating, created_at, updated_at
      FROM ratings
      WHERE user_id = $1 AND media_type = $2 AND tmdb_id = $3 `,
      [req.user.id, media_type, tmdbId],
    );
    if (ratingData.rowCount === 0) {
      res.status(200).json({ rating: null });
      return;
    }
    res.status(200).json({ rating: ratingData.rows[0] });
  } catch (err) {
    console.error('Fetching rating failed:', err);
    next(err instanceof Error ? err : new Error(JSON.stringify(err)));
  }
};

export const saveRating = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    throw createHttpError(401, 'Unauthorized');
  }
  try {
    const { tmdbId, media_type, rating } = req.body;
    const ratingData = await pool.query(
      `
      INSERT INTO ratings ( user_id, tmdb_id, media_type, rating )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, tmdb_id, media_type)
      DO UPDATE SET rating = EXCLUDED.rating, updated_at = NOW()
      RETURNING id, tmdb_id, media_type, rating, created_at, updated_at `,
      [req.user.id, tmdbId, media_type, rating],
    );
    res.status(200).json({ rating: ratingData.rows[0] });
  } catch (err) {
    console.error('Saving rating failed:', err);
    next(err instanceof Error ? err : new Error(JSON.stringify(err)));
  }
};
