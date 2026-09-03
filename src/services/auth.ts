import type { Response } from 'express';
import { pool } from '../config/db.js';
import { ONE_DAY, FIFTEEN_MINUTES } from '../constants/time.js';
import type { Session } from '../types/session.js';

export const createSession = async (userId: number): Promise<Session> => {
  const accessToken = crypto.randomUUID();
  const refreshToken = crypto.randomUUID();

  const session = await pool.query(
    `
INSERT INTO sessions (
  user_id,
  access_token,
  refresh_token,
  access_token_valid_until,
  refresh_token_valid_until
)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
      `,
    [
      userId,
      accessToken,
      refreshToken,
      new Date(Date.now() + FIFTEEN_MINUTES),
      new Date(Date.now() + ONE_DAY),
    ],
  );
  return session.rows[0];
};

export const deleteSession = async (sessionId: number) => {
  const sessionDeletion = await pool.query(
    `
      DELETE FROM sessions
      WHERE id = $1
    `,
    [sessionId],
  );

  return sessionDeletion;
};
export const setSessionCookies = (res: Response, session: Session) => {
  res.cookie('accessToken', session.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: FIFTEEN_MINUTES,
  });

  res.cookie('refreshToken', session.refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ONE_DAY,
  });

  res.cookie('sessionId', session.id, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ONE_DAY,
  });
};
