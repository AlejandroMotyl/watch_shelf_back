import type { Request, Response } from 'express';

import { pool } from '../config/db.js';

export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const result = await pool.query(
    `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, username, email, avatar_url, created_at
    `,
    [name, email, password],
  );

  res.status(201).json({
    user: result.rows[0],
  });
};
