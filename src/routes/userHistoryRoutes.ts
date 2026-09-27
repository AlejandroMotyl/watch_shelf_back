import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  addWatchHistory,
  getWatchHistory,
  getWatchHistoryItem,
} from '../controllers/userHistoryController.js';
import { celebrate } from 'celebrate';
import { addWatchHistorySchema } from '../validations/historyValidation.js';
import { mediaParamsSchema } from '../validations/mediaValidation.js';

const router = Router();

router.get('/profile/history', authenticate, getWatchHistory);
router.get(
  '/profile/history/:media_type/:tmdbId',
  authenticate,
  celebrate(mediaParamsSchema),
  getWatchHistoryItem,
);
router.post(
  '/profile/history',
  authenticate,
  celebrate(addWatchHistorySchema),
  addWatchHistory,
);

export default router;
