import type { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';
import { pool } from '../config/db.js';
import type { UploadApiResponse } from 'cloudinary';
import argon2 from 'argon2';
import { tmdb } from './mediaControllers.js';

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw createHttpError(401, 'Unauthorized');

    res.status(200).json({
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      avatar_url: req.user.avatar_url,
      created_at: req.user.created_at,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // ! Add clearing out the previous image from cloudinary
  try {
    if (!req.file) {
      next(createHttpError(400, 'No file'));
      return;
    }

    const result = (await saveFileToCloudinary(
      req.file.buffer,
    )) as UploadApiResponse;
    console.log('CLOUDINARY RESULT:', result);

    const userData = await pool.query(
      `
        UPDATE users
        SET avatar_url = $1
        WHERE id = $2
        RETURNING id, username, email, avatar_url, created_at
      `,
      [result.secure_url, req.user!.id],
    );

    res.status(200).json({ user: userData.rows[0] });
  } catch (err) {
    console.error('updateUserAvatar failed:', err);
    next(err instanceof Error ? err : new Error(JSON.stringify(err)));
  }
};
export const updateUsername = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) throw createHttpError(401, 'Unauthorized');
    const { username } = req.body;
    const userData = await pool.query(
      `
        UPDATE users
        SET username = $1
        WHERE id = $2
        RETURNING id, username, email, avatar_url, created_at
      `,
      [username, req.user!.id],
    );

    res.status(200).json({ user: userData.rows[0] });
  } catch (err) {
    console.error('updateUsername failed:', err);
    next(err instanceof Error ? err : new Error(JSON.stringify(err)));
  }
};
export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw createHttpError(401, 'Unauthorized');
    }

    const { currentPassword, newPassword } = req.body;

    const userPasswordData = await pool.query(
      `
        SELECT password_hash
        FROM users
        WHERE id = $1
      `,
      [req.user.id],
    );

    const user = userPasswordData.rows[0];

    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    const isValidPassword = await argon2.verify(
      user.password_hash,
      currentPassword,
    );

    if (!isValidPassword) {
      throw createHttpError(401, 'Invalid credentials');
    }

    const newPasswordHash = await argon2.hash(newPassword);

    await pool.query(
      `
        UPDATE users
        SET password_hash = $1
        WHERE id = $2
      `,
      [newPasswordHash, req.user.id],
    );

    res.status(200).json({
      message: 'Password updated successfully',
    });
  } catch (err) {
    console.error('updatePassword failed:', err);
    next(err instanceof Error ? err : new Error(JSON.stringify(err)));
  }
};

// ? FAVORITES
export const getFavorites = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    throw createHttpError(401, 'Unauthorized');
  }

  try {
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
  } catch (err) {
    console.error('Fetching favorites failed:', err);
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
    const { id, type } = req.body;

    const endpoint = type === 'movie' ? `/movie/${id}` : `/tv/${id}`;

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
      [req.user.id, id, type, title, data.poster_path, releaseDate, genres],
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

    console.error('Adding favorite failed:', err);

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
    const { type, id } = req.params;

    const favoriteData = await pool.query(
      `
        DELETE FROM favorites
        WHERE user_id = $1
          AND media_type = $2
          AND tmdb_id = $3
        RETURNING id
      `,
      [req.user.id, type, id],
    );

    if (favoriteData.rowCount === 0) {
      throw createHttpError(404, 'Favorite not found');
    }

    res.status(204).send();
  } catch (err) {
    console.error('Removing favorite failed:', err);
    next(err instanceof Error ? err : new Error(JSON.stringify(err)));
  }
};

// ? RATINGS

export const getRating = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    throw createHttpError(401, 'Unauthorized');
  }
  try {
    const { type, id } = req.params;
    const ratingData = await pool.query(
      `
      SELECT id, tmdb_id, media_type, rating, created_at, updated_at
      FROM ratings
      WHERE user_id = $1 AND media_type = $2 AND tmdb_id = $3 `,
      [req.user.id, type, id],
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
    const { tmdbId, type, rating } = req.body;
    const ratingData = await pool.query(
      `
      INSERT INTO ratings ( user_id, tmdb_id, media_type, rating )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, tmdb_id, media_type)
      DO UPDATE SET rating = EXCLUDED.rating, updated_at = NOW()
      RETURNING id, tmdb_id, media_type, rating, created_at, updated_at `,
      [req.user.id, tmdbId, type, rating],
    );
    res.status(200).json({ rating: ratingData.rows[0] });
  } catch (err) {
    console.error('Saving rating failed:', err);
    next(err instanceof Error ? err : new Error(JSON.stringify(err)));
  }
};

// ? History

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
    const limit = 20;
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
    console.error('Fetching watch history failed:', err);
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
    const { tmdbId, type } = req.body;

    if (!Number.isInteger(tmdbId) || !['movie', 'tv'].includes(type)) {
      throw createHttpError(400, 'Invalid media');
    }

    const endpoint = type === 'movie' ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;

    const { data } = await tmdb.get(endpoint);

    const title = data.title ?? data.name;
    const releaseDate = data.release_date ?? data.first_air_date ?? null;

    const genres = data.genres?.map((genre: { id: number }) => genre.id) ?? [];

    const durationSeconds =
      type === 'movie' && data.runtime ? data.runtime * 60 : null;

    const historyData = await pool.query(
      `
        INSERT INTO watch_history (
          user_id,
          tmdb_id,
          media_type,
          title,
          poster_path,
          release_date,
          genres,
          duration_seconds,
          watched_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (user_id, tmdb_id, media_type)
        DO UPDATE SET
          title = EXCLUDED.title,
          poster_path = EXCLUDED.poster_path,
          release_date = EXCLUDED.release_date,
          genres = EXCLUDED.genres,
          duration_seconds = EXCLUDED.duration_seconds,
          watched_at = NOW()
        RETURNING
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
      `,
      [
        req.user.id,
        tmdbId,
        type,
        title,
        data.poster_path,
        releaseDate,
        genres,
        durationSeconds,
      ],
    );

    res.status(200).json({
      history: historyData.rows[0],
    });
  } catch (err) {
    console.error('Saving watch history failed:', err);
    next(err instanceof Error ? err : new Error(JSON.stringify(err)));
  }
};
