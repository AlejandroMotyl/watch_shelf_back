import type { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { pool } from '../config/db.js';
import { tmdb } from './mediaControllers.js';

export const getReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    throw createHttpError(401, 'Unauthorized');
  }

  try {
    const { media_type, tmdbId } = req.params;

    const reviewData = await pool.query(
      `
        SELECT
          id,
          tmdb_id,
          media_type,
          review_content,
          created_at,
          updated_at
        FROM reviews
        WHERE user_id = $1
          AND tmdb_id = $2
          AND media_type = $3
      `,
      [req.user.id, tmdbId, media_type],
    );

    res.status(200).json({
      review: reviewData.rows[0] ?? null,
    });
  } catch (err) {
    console.error('Fetching review failed:', err);

    next(err instanceof Error ? err : new Error(JSON.stringify(err)));
  }
};

export const getReviews = async (
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

    const reviewsData = await pool.query(
      `
        SELECT
          r.id,
          r.tmdb_id,
          r.media_type,
          r.review_content,
          r.title,
          r.poster_path,
          r.release_date,
          r.genres,
          r.created_at,
          r.updated_at,

          rt.rating,

          EXISTS (
            SELECT 1
            FROM favorites f
            WHERE f.user_id = r.user_id
              AND f.tmdb_id = r.tmdb_id
              AND f.media_type = r.media_type
          ) AS is_favorite

        FROM reviews r

        LEFT JOIN ratings rt
          ON rt.user_id = r.user_id
          AND rt.tmdb_id = r.tmdb_id
          AND rt.media_type = r.media_type

        WHERE r.user_id = $1

        ORDER BY r.updated_at DESC

        LIMIT $2
        OFFSET $3
      `,
      [req.user.id, limit, offset],
    );

    const countData = await pool.query(
      `
        SELECT COUNT(*)::int AS total
        FROM reviews
        WHERE user_id = $1
      `,
      [req.user.id],
    );

    const total = countData.rows[0].total;

    res.status(200).json({
      reviews: reviewsData.rows,
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Fetching reviews failed:', err);

    next(err instanceof Error ? err : new Error(JSON.stringify(err)));
  }
};

export const saveReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    throw createHttpError(401, 'Unauthorized');
  }

  try {
    const { tmdbId, media_type, reviewContent } = req.body;

    const endpoint =
      media_type === 'movie' ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;

    const { data } = await tmdb.get(endpoint);

    const title = data.title ?? data.name;

    const releaseDate = data.release_date ?? data.first_air_date ?? null;

    const genres = data.genres?.map((genre: { id: number }) => genre.id) ?? [];

    if (!title) {
      throw createHttpError(404, 'Media not found');
    }

    const reviewData = await pool.query(
      `
        INSERT INTO reviews (
          user_id,
          tmdb_id,
          media_type,
          title,
          poster_path,
          release_date,
          genres,
          review_content
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8
        )

        ON CONFLICT (user_id, tmdb_id, media_type)

        DO UPDATE SET
          title = EXCLUDED.title,
          poster_path = EXCLUDED.poster_path,
          release_date = EXCLUDED.release_date,
          genres = EXCLUDED.genres,
          review_content = EXCLUDED.review_content,
          updated_at = NOW()

        RETURNING
          id,
          tmdb_id,
          media_type,
          title,
          poster_path,
          release_date,
          genres,
          review_content,
          created_at,
          updated_at
      `,
      [
        req.user.id,
        tmdbId,
        media_type,
        title,
        data.poster_path,
        releaseDate,
        genres,
        reviewContent,
      ],
    );

    res.status(200).json({
      review: reviewData.rows[0],
    });
  } catch (err) {
    console.error('Saving review failed:', err);

    next(err instanceof Error ? err : new Error(JSON.stringify(err)));
  }
};
