import { Router } from 'express';
import { body } from 'express-validator';
import {
  createOrder,
  getMyOrders,
  getSellerOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
} from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { apiRateLimit } from '../middleware/rateLimit.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Buyer routes
router.post(
  '/',
  authorize('BUYER'),
  apiRateLimit,
  [
    body('items').isArray({ min: 1 }),
    body('items.*.productId').notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('deliveryAddress').trim().notEmpty(),
    body('deliveryCity').trim().notEmpty(),
    body('deliveryRegion').trim().notEmpty(),
  ],
  validate,
  createOrder
);

router.get('/my-orders', authorize('BUYER'), getMyOrders);
router.get('/:id', getOrder);
router.patch('/:id/cancel', authorize('BUYER'), cancelOrder);

// Seller routes
router.get('/seller/my-orders', authorize('FARMER', 'SUPPLIER'), getSellerOrders);
router.patch(
  '/:id/status',
  authorize('FARMER', 'SUPPLIER'),
  [body('status').isIn(['PENDING', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'])],
  validate,
  updateOrderStatus
);

export default router;
