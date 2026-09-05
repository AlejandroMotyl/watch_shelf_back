import type { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';

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
