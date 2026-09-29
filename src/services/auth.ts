import type { Response } from 'express';
import { pool } from '../config/db.js';
import { ONE_DAY, FIFTEEN_MINUTES } from '../constants/time.js';
import type { Session } from '../types/session.js';
import type { Pool, PoolClient } from 'pg';
import createHttpError from 'http-errors';

export const createSession = async (
  userId: number,
  client: PoolClient | Pool = pool,
): Promise<Session> => {
  const accessToken = crypto.randomUUID();
  const refreshToken = crypto.randomUUID();

  const session = await client.query(
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
// ! DELETE DEBUG
export const refreshSession = async (
  sessionId: string,
  refreshToken: string,
) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const debug = await client.query(
      `
        SELECT
          id,
          refresh_token,
          refresh_token_valid_until,
          refresh_token_valid_until > NOW() AS token_is_valid
        FROM sessions
        WHERE id = $1
      `,
      [sessionId],
    );

    console.log('REFRESH DEBUG:', {
      sessionId,
      found: debug.rowCount,
      session: debug.rows[0]
        ? {
            id: debug.rows[0].id,
            refreshTokenMatches: debug.rows[0].refresh_token === refreshToken,
            tokenIsValid: debug.rows[0].token_is_valid,
            validUntil: debug.rows[0].refresh_token_valid_until,
          }
        : null,
    });

    const result = await client.query(
      `
        DELETE FROM sessions
        WHERE id = $1
          AND refresh_token = $2
          AND refresh_token_valid_until > NOW()
        RETURNING user_id
      `,
      [sessionId, refreshToken],
    );

    if (result.rowCount !== 1) {
      throw createHttpError(401, 'Invalid or expired session');
    }

    const userId = result.rows[0].user_id;

    const newSession = await createSession(userId, client);

    await client.query('COMMIT');

    return newSession;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {}

    throw error;
  } finally {
    client.release();
  }
};
