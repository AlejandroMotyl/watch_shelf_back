import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  addFavorite,
  getFavorites,
  removeFavorite,
} from '../controllers/userFavoritesController.js';
import { celebrate } from 'celebrate';
import { mediaParamsSchema } from '../validations/mediaValidation.js';

const router = Router();

router.get('/profile/favorites', authenticate, getFavorites);
router.post(
  '/profile/favorites/:media_type/:tmdbId',
  authenticate,
  celebrate(mediaParamsSchema),
  addFavorite,
);
router.delete(
  '/profile/favorites/:media_type/:tmdbId',
  authenticate,
  celebrate(mediaParamsSchema),
  removeFavorite,
);

export default router;
