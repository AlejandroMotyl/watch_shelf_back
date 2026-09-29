// src/middleware/authenticate.js

import createHttpError, { HttpError } from 'http-errors';
import type { NextFunction, Request, Response } from 'express';
import { pool } from '../config/db.js';
import { refreshSession, setSessionCookies } from '../services/auth.js';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { sessionId, accessToken, refreshToken } = req.cookies;

  const refreshAuthenticatedSession = async () => {
    if (!refreshToken) {
      throw createHttpError(401, 'Missing session credentials');
    }

    try {
      const newSession = await refreshSession(sessionId, refreshToken);

      setSessionCookies(res, newSession);

      return newSession;
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) {
        res.clearCookie('sessionId');
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
      }

      throw error;
    }
  };

  if (!sessionId) {
    throw createHttpError(401, 'Missing session credentials');
  }

  let session;

  if (accessToken) {
    const sessionInfo = await pool.query(
      `
        SELECT
          id,
          user_id,
          access_token,
          refresh_token,
          access_token_valid_until,
          refresh_token_valid_until
        FROM sessions
        WHERE id = $1
          AND access_token = $2
      `,
      [Number(sessionId), accessToken],
    );

    session = sessionInfo.rows[0];

    if (!session) {
      throw createHttpError(401, 'Session not found');
    }

    const isAccessTokenExpired = session.access_token_valid_until < new Date();

    if (isAccessTokenExpired) {
      session = await refreshAuthenticatedSession();
    }
  } else {
    session = await refreshAuthenticatedSession();
  }

  const userInfo = await pool.query(
    `
      SELECT
        id,
        email,
        username,
        avatar_url,
        created_at
      FROM users
      WHERE id = $1
    `,
    [session.user_id],
  );

  const user = userInfo.rows[0];

  if (!user) {
    throw createHttpError(401, 'User not found');
  }

  req.user = user;

  next();
};
