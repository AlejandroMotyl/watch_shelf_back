import type { Request, Response } from 'express';
import argon2 from 'argon2';
import { pool } from '../config/db.js';
import createHttpError from 'http-errors';
import {
  createSession,
  deleteSession,
  setSessionCookies,
} from '../services/auth.js';
import type { User } from '../types/user.js';

export const registerUser = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  const passwordHash = await argon2.hash(password);
  try {
    const result = await pool.query(
      `
        INSERT INTO users (username, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, username, email, avatar_url, created_at
      `,
      [username, email, passwordHash],
    );

    const newUser: User = result.rows[0];

    const newSession = await createSession(newUser.id);
    setSessionCookies(res, newSession);
    res.status(201).json(newUser);
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === '23505'
    ) {
      if ('constraint' in error && error.constraint === 'users_email_key') {
        throw createHttpError(409, 'Email in use');
      }

      if ('constraint' in error && error.constraint === 'users_username_key') {
        throw createHttpError(409, 'Username already taken');
      }
    }

    throw error;
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await pool.query(
    `
    SELECT id, email,  username, avatar_url, password_hash, created_at
    FROM users
    WHERE email = $1
`,
    [email],
  );
  if (result.rows.length === 0) {
    throw createHttpError(401, 'Invalid credentials');
  }

  const user = result.rows[0];

  const isValidPassword = await argon2.verify(user.password_hash, password);
  if (!isValidPassword) {
    throw createHttpError(401, 'Invalid credentials');
  }

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
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
    },
  });
};

export const logoutUser = async (req: Request, res: Response) => {
  const { sessionId } = req.cookies;
  if (sessionId) {
    await deleteSession(sessionId);
  }

  res.clearCookie('sessionId');
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(204).send();
};

export const refreshUserSession = async (req: Request, res: Response) => {
  const { sessionId, refreshToken } = req.cookies;

  if (!sessionId || !refreshToken) {
    throw createHttpError(401, 'Missing session credentials');
  }

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
  WHERE id = $1 AND refresh_token = $2
  `,
    [sessionId, refreshToken],
  );

  const session = sessionInfo.rows[0];
  if (!session) {
    throw createHttpError(401, 'Session not found');
  }

  const isSessionTokenExpired = session.refresh_token_valid_until < new Date();

  if (isSessionTokenExpired) {
    await deleteSession(Number(sessionId));
    res.clearCookie('sessionId');
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    throw createHttpError(401, 'Session token expired');
  }

  await deleteSession(Number(sessionId));

  const newSession = await createSession(session.user_id);
  setSessionCookies(res, newSession);

  res.status(200).json({
    message: 'Session refreshed',
  });
};
