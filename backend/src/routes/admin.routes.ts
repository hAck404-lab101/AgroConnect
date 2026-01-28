import { Router } from 'express';
import { body } from 'express-validator';
import {
  getUsers,
  updateUserRole,
  toggleUserSuspension,
  updateProductApproval,
  updateReviewApproval,
  getAllOrders,
  getAnalytics,
  getApiKeys,
  createApiKey,
  updateApiKey,
  getAdminLogs,
} from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('ADMIN'));

// User management
router.get('/users', getUsers);
router.patch('/users/:userId/role', [body('role').isIn(['FARMER', 'BUYER', 'TRANSPORTER', 'SUPPLIER', 'ADMIN'])], validate, updateUserRole);
router.patch('/users/:userId/suspend', [body('isSuspended').isBoolean()], validate, toggleUserSuspension);

// Product moderation
router.patch('/products/:productId/approve', [body('isApproved').isBoolean()], validate, updateProductApproval);

// Review moderation
router.patch('/reviews/:reviewId/approve', [body('isApproved').isBoolean()], validate, updateReviewApproval);

// Orders
router.get('/orders', getAllOrders);

// Analytics
router.get('/analytics', getAnalytics);

// API Key management
router.get('/api-keys', getApiKeys);
router.post('/api-keys', [
  body('name').trim().notEmpty(),
  body('service').trim().notEmpty(),
  body('keyType').isIn(['public', 'secret', 'api_key']),
  body('value').trim().notEmpty(),
], validate, createApiKey);
router.patch('/api-keys/:id', updateApiKey);

// Logs
router.get('/logs', getAdminLogs);

export default router;
