import type { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';
import { pool } from '../config/db.js';
import type { UploadApiResponse } from 'cloudinary';
import argon2 from 'argon2';

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
