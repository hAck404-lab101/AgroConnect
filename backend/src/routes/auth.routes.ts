import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  googleAuth,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
} from '../controllers/auth.controller';
import { authRateLimit } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// Register
router.post(
  '/register',
  authRateLimit,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('role').isIn(['FARMER', 'BUYER', 'TRANSPORTER', 'SUPPLIER']),
  ],
  validate,
  register
);

// Login
router.post(
  '/login',
  authRateLimit,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  login
);

// Google OAuth
router.post('/google', authRateLimit, googleAuth);

// Refresh token
router.post('/refresh', refreshToken);

// Forgot password
router.post(
  '/forgot-password',
  authRateLimit,
  [body('email').isEmail().normalizeEmail()],
  validate,
  forgotPassword
);

// Reset password
router.post(
  '/reset-password',
  authRateLimit,
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }),
  ],
  validate,
  resetPassword
);

// Verify email
router.post(
  '/verify-email',
  [body('token').notEmpty()],
  validate,
  verifyEmail
);

export default router;
