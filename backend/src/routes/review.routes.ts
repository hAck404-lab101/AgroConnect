import { Router } from 'express';
import { body } from 'express-validator';
import { createReview, getUserReviews } from '../controllers/review.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { apiRateLimit } from '../middleware/rateLimit.middleware';

const router = Router();

// Public route
router.get('/user/:userId', apiRateLimit, getUserReviews);

// Protected routes
router.use(authenticate);

router.post(
  '/',
  apiRateLimit,
  [
    body('revieweeId').notEmpty(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().trim(),
    body('orderId').optional(),
  ],
  validate,
  createReview
);

export default router;
