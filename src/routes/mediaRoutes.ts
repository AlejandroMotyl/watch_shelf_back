import { Router } from 'express';
import {
  getMediaById,
  getTrendingMedia,
  getMediaReviews,
  getMediaTrailerById,
} from '../controllers/mediaControllers.js';

const router = Router();

router.get('/trending/:type', getTrendingMedia);
router.get('/reviews/:type', getMediaReviews);
router.get('/:type/:id/trailer', getMediaTrailerById);

router.get('/:type/:id', getMediaById);

export default router;
