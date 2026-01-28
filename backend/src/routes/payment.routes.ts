import { Router } from 'express';
import { body } from 'express-validator';
import {
  initializePayment,
  verifyPayment,
  paystackWebhook,
  getPaymentHistory,
} from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { paymentRateLimit } from '../middleware/rateLimit.middleware';

const router = Router();

// Webhook (no auth required, uses signature verification)
router.post('/webhook/paystack', paystackWebhook);

// Verify payment (public, but should be called from frontend after redirect)
router.get('/verify/:reference', verifyPayment);

// Protected routes
router.use(authenticate);

router.post(
  '/initialize',
  authorize('BUYER'),
  paymentRateLimit,
  [
    body('orderId').notEmpty(),
    body('method').isIn(['CARD', 'MOBILE_MONEY_MTN', 'MOBILE_MONEY_VODAFONE', 'MOBILE_MONEY_AIRTELTIGO']),
  ],
  validate,
  initializePayment
);

router.get('/history', getPaymentHistory);

export default router;
