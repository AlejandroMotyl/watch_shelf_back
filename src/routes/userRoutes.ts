import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  getCurrentUser,
  updatePassword,
  updateUserAvatar,
  updateUsername,
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
router.patch('/profile/username', authenticate, updateUsername);
router.patch('/profile/password', authenticate, updatePassword);
// router.get('/profile/reviews');
// router.get('/profile/favorites');
// router.get('/profile/history');
export default router;
