import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  getReview,
  getReviews,
  saveReview,
} from '../controllers/userReviewsController.js';
import { saveReviewSchema } from '../validations/reviewValidation.js';
import { celebrate } from 'celebrate';
import { mediaParamsSchema } from '../validations/mediaValidation.js';

const router = Router();

router.get(
  '/profile/reviews/:media_type/:tmdbId',
  authenticate,
  celebrate(mediaParamsSchema),
  getReview,
);
router.get('/profile/reviews', authenticate, getReviews);
router.post(
  '/profile/reviews',
  authenticate,
  celebrate(saveReviewSchema),
  saveReview,
);

export default router;
