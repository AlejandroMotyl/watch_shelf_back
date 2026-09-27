import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  getCurrentUser,
  updatePassword,
  updateUserAvatar,
  updateUsername,
} from '../controllers/userController.js';
import { upload } from '../middleware/multer.js';
import {
  updatePasswordSchema,
  updateUsernameSchema,
} from '../validations/authValidation.js';
import { celebrate } from 'celebrate';

const router = Router();

router.get('/profile', authenticate, getCurrentUser);
router.patch(
  '/profile',
  authenticate,
  upload.single('avatar'),
  updateUserAvatar,
);

router.patch(
  '/profile/username',
  authenticate,
  celebrate(updateUsernameSchema),
  updateUsername,
);
router.patch(
  '/profile/password',
  authenticate,
  celebrate(updatePasswordSchema),
  updatePassword,
);

export default router;
