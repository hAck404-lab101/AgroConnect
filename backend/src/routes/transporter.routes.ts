import { Router } from 'express';
import { body } from 'express-validator';
import {
  createTransporterProfile,
  getTransporterProfile,
  addVehicle,
  getAvailableTransporters,
  calculateDeliveryFeeEndpoint,
} from '../controllers/transporter.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { apiRateLimit } from '../middleware/rateLimit.middleware';

const router = Router();

// Public routes
router.get('/available', apiRateLimit, getAvailableTransporters);
router.post('/calculate-fee', apiRateLimit, calculateDeliveryFeeEndpoint);

// Protected routes
router.use(authenticate);
router.use(authorize('TRANSPORTER'));

router.post(
  '/profile',
  [
    body('basePrice').isFloat({ min: 0 }),
    body('licenseNumber').optional().trim(),
  ],
  validate,
  createTransporterProfile
);

router.get('/profile', getTransporterProfile);

router.post(
  '/vehicles',
  [
    body('type').isIn(['truck', 'van', 'motorcycle']),
    body('plateNumber').trim().notEmpty(),
    body('capacity').isFloat({ min: 0 }),
  ],
  validate,
  addVehicle
);

export default router;
