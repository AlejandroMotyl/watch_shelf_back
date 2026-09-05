import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { getCurrentUser } from '../controllers/userController.js';

const router = Router();

router.get('/profile', authenticate, getCurrentUser);
// router.get('/profile/reviews');
// router.get('/profile/favorites');
// router.get('/profile/history');
export default router;
