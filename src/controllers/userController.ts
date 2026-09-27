import type { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import {
  deleteFileFromCloudinary,
  saveFileToCloudinary,
} from '../utils/saveFileToCloudinary.js';
import { pool } from '../config/db.js';
import argon2 from 'argon2';
import { createSession, setSessionCookies } from '../services/auth.js';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';

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
  try {
    if (!req.file) {
      return next(createHttpError(400, 'No file uploaded'));
    }

    const allowedTypes = new Set([
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ]);

    const detectedType = await fileTypeFromBuffer(req.file.buffer);

    if (!detectedType || !allowedTypes.has(detectedType.mime)) {
      return next(
        createHttpError(
          400,
          'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
        ),
      );
    }

    const image = sharp(req.file.buffer, {
      limitInputPixels: 25_000_000,
    });

    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      return next(createHttpError(400, 'Invalid image'));
    }

    if (metadata.width > 5000 || metadata.height > 5000) {
      return next(createHttpError(400, 'Image dimensions are too large'));
    }

    const processedImage = await image
      .rotate()
      .resize(512, 512, {
        fit: 'cover',
      })
      .webp({
        quality: 85,
      })
      .toBuffer();

    const oldAvatarResult = await pool.query(
      `
        SELECT avatar_public_id
        FROM users
        WHERE id = $1
      `,
      [req.user!.id],
    );

    const oldAvatarPublicId = oldAvatarResult.rows[0]?.avatar_public_id ?? null;

    const result = await saveFileToCloudinary(processedImage);

    const userData = await pool.query(
      `
        UPDATE users
        SET
          avatar_url = $1,
          avatar_public_id = $2
        WHERE id = $3
        RETURNING
          id,
          username,
          email,
          avatar_url,
          created_at
      `,
      [result.secure_url, result.public_id, req.user!.id],
    );

    if (oldAvatarPublicId) {
      try {
        await deleteFileFromCloudinary(oldAvatarPublicId);
      } catch (deleteError) {
        console.error('Failed to delete previous avatar:', deleteError);
      }
    }

    return res.status(200).json({
      user: userData.rows[0],
    });
  } catch (err) {
    console.error('updateUserAvatar failed:', err);

    return next(
      err instanceof Error ? err : new Error('Failed to update avatar'),
    );
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
        SELECT id, password_hash
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

    await pool.query(
      `
      DELETE FROM sessions
      WHERE user_id = $1
    `,
      [user.id],
    );
    const newSession = await createSession(user.id);
    setSessionCookies(res, newSession);

    res.status(200).json({
      message: 'Password updated successfully',
    });
  } catch (err) {
    console.error('updatePassword failed:', err);
    next(err instanceof Error ? err : new Error(JSON.stringify(err)));
  }
};
