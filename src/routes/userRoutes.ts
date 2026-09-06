import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  getCurrentUser,
  updateUserAvatar,
} from '../controllers/userController.js';
import { upload } from '../middleware/multer.js';

const router = Router();

router.get('/profile', authenticate, getCurrentUser);
router.patch(
  '/profile',
  authenticate,
  upload.single('avatar'),
  updateUserAvatar,
);
// router.get('/profile/reviews');
// router.get('/profile/favorites');
// router.get('/profile/history');
export default router;
