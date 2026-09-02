import { Router } from 'express';
import {
  getMediaById,
  getTrendingMedia,
  getMediaReviews,
} from '../controllers/mediaControllers.js';

const router = Router();

router.get('/trending/:type', getTrendingMedia);
router.get('/reviews/:type', getMediaReviews);

router.get('/:type/:id', getMediaById);

export default router;
