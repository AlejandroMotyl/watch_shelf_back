import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { getRating, saveRating } from '../controllers/userRatingsController.js';
import { celebrate } from 'celebrate';
import { saveRatingSchema } from '../validations/ratingValidation.js';
import { mediaParamsSchema } from '../validations/mediaValidation.js';

const router = Router();

router.post(
  '/profile/ratings',
  authenticate,
  celebrate(saveRatingSchema),
  saveRating,
);
router.get(
  '/profile/ratings/:media_type/:tmdbId',
  authenticate,
  celebrate(mediaParamsSchema),
  getRating,
);

export default router;
