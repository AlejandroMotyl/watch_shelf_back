import type { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';
import { pool } from '../config/db.js';
import type { UploadApiResponse } from 'cloudinary';

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
