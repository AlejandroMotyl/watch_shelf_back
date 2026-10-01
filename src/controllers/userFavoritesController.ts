import type { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { pool } from '../config/db.js';
import { tmdb } from './mediaControllers.js';
import { logger } from '../middleware/logger.js';

export const getFavorites = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    throw createHttpError(401, 'Unauthorized');
  }

  try {
    const getAll = req.query.all === 'true';

    if (getAll) {
      const favoritesData = await pool.query(
        `
          SELECT
            id,
            tmdb_id,
            media_type,
            title,
            poster_path,
            release_date,
            genres,
            created_at
          FROM favorites
          WHERE user_id = $1
          ORDER BY created_at DESC
        `,
        [req.user.id],
      );

      res.status(200).json({
        favorites: favoritesData.rows,
      });

      return;
    }

    const page = Math.max(Number(req.query.page) || 1, 1);

    const requestedLimit = Number(req.query.limit) || 12;

    const limit = Math.min(Math.max(requestedLimit, 1), 50);

    const offset = (page - 1) * limit;

    const favoritesData = await pool.query(
      `
        SELECT
          id,
          tmdb_id,
          media_type,
          title,
          poster_path,
          release_date,
          genres,
          created_at
        FROM favorites
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        OFFSET $3
      `,
      [req.user.id, limit, offset],
    );

    const countData = await pool.query(
      `
        SELECT COUNT(*)::int AS total
        FROM favorites
        WHERE user_id = $1
      `,
      [req.user.id],
    );

    const total = countData.rows[0].total;

    res.status(200).json({
      favorites: favoritesData.rows,
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    });
  } catch (err) {
    logger.error({ err }, 'Fetching favorites failed');

    next(err instanceof Error ? err : new Error(JSON.stringify(err)));
  }
};

export const addFavorite = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    throw createHttpError(401, 'Unauthorized');
  }

  try {
    const { tmdbId, media_type } = req.params;

    const endpoint =
      media_type === 'movie' ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;

    const { data } = await tmdb.get(endpoint);

    const genres = data.genres?.map((genre: { id: number }) => genre.id) ?? [];

    const title = data.title ?? data.name;
    const releaseDate = data.release_date ?? data.first_air_date ?? null;

    const favoriteData = await pool.query(
      `
        INSERT INTO favorites (
          user_id,
          tmdb_id,
          media_type,
          title,
          poster_path,
          release_date,
          genres
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          id,
          tmdb_id,
          media_type,
          title,
          poster_path,
          release_date,
          genres,
          created_at
      `,
      [
        req.user.id,
        tmdbId,
        media_type,
        title,
        data.poster_path,
        releaseDate,
        genres,
      ],
    );

    res.status(201).json({
      favorite: favoriteData.rows[0],
    });
  } catch (err) {
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      err.code === '23505'
    ) {
      next(createHttpError(409, 'Movie is already in favorites'));
      return;
    }

    logger.error({ err }, 'Adding favorite failed');

    next(err instanceof Error ? err : new Error(JSON.stringify(err)));
  }
};

export const removeFavorite = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    throw createHttpError(401, 'Unauthorized');
  }

  try {
    const { media_type, tmdbId } = req.params;

    const favoriteData = await pool.query(
      `
        DELETE FROM favorites
        WHERE user_id = $1
          AND media_type = $2
          AND tmdb_id = $3
        RETURNING id
      `,
      [req.user.id, media_type, tmdbId],
    );

    if (favoriteData.rowCount === 0) {
      throw createHttpError(404, 'Favorite not found');
    }

    res.status(204).send();
  } catch (err) {
    logger.error({ err }, 'Removing favorite failed');
    next(err instanceof Error ? err : new Error(JSON.stringify(err)));
  }
};
