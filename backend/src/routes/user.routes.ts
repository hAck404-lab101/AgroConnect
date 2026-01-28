import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getMyProfile,
  updateProfile,
  uploadAvatar,
  uploadAvatarMulter,
  getUser,
} from '../controllers/user.controller';
import { apiRateLimit } from '../middleware/rateLimit.middleware';

const router = Router();

// Public route
router.get('/:id', apiRateLimit, getUser);

// Protected routes
router.use(authenticate);

router.get('/me/profile', getMyProfile);
router.patch('/me/profile', updateProfile);
router.post('/me/avatar', uploadAvatarMulter.single('avatar'), uploadAvatar);

export default router;
