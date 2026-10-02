import pg from 'pg';
import { logger } from '../middleware/logger.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});
pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected PostgreSQL pool error');
});
