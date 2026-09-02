import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { httpLogger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import mediaRoutes from './routes/mediaRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { errors } from 'celebrate';
const app = express();
const PORT = process.env.PORT ?? 4000;

// ? Middleware
app.use(httpLogger);
app.use(express.json());
app.use(cors());

// ? Code
app.use(authRoutes);
app.use(mediaRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ message: 'hello' });
});

// ! error Middleware
app.use(notFoundHandler);
app.use(errors());
app.use(errorHandler);
// ? Server listen
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
