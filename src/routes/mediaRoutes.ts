import { Router } from 'express';
import {
  getMediaById,
  getTrendingMedia,
  getMediaReviews,
  getMediaTrailerById,
} from '../controllers/mediaControllers.js';

const router = Router();

router.get('/trending/:media_type', getTrendingMedia);
router.get('/reviews/:media_type', getMediaReviews);
router.get('/:media_type/:tmdbId/trailer', getMediaTrailerById);

router.get('/:media_type/:tmdbId', getMediaById);

export default router;
