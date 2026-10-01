import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { httpLogger, logger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import mediaRoutes from './routes/mediaRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import userReviewsRoutes from './routes/userReviewsRoutes.js';
import userRatingsRoutes from './routes/userRatingsRoutes.js';
import userHistoryRoutes from './routes/userHistoryRoutes.js';
import userFavoritesRoutes from './routes/userFavoritesRoutes.js';
import { errors } from 'celebrate';
import cookieParser from 'cookie-parser';
import { pool } from './config/db.js';
const app = express();
const PORT = process.env.PORT ?? 4000;

// ? Middleware

app.use(httpLogger);
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// ? Code
app.use(authRoutes);
app.use(userRoutes);
app.use(userReviewsRoutes);
app.use(userRatingsRoutes);
app.use(userHistoryRoutes);
app.use(userFavoritesRoutes);
app.use(mediaRoutes);

// ! error Middleware
app.use(notFoundHandler);
app.use(errors());
app.use(errorHandler);
// ? Server listen
const server = app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});

const shutdown = async () => {
  try {
    await pool.end();
    server.close(() => {
      process.exit(0);
    });
  } catch (error) {
    logger.error({ error }, 'Failed to shut down server');
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
