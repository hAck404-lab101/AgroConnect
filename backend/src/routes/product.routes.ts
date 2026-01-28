import { Router } from 'express';
import { body } from 'express-validator';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  uploadProductImages,
  upload,
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { apiRateLimit } from '../middleware/rateLimit.middleware';

const router = Router();

// Public routes
router.get('/', apiRateLimit, getProducts);
router.get('/:id', apiRateLimit, getProduct);

// Protected routes (Farmer)
router.post(
  '/',
  authenticate,
  authorize('FARMER', 'SUPPLIER'),
  apiRateLimit,
  [
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('category').isIn(['CROPS', 'LIVESTOCK', 'INPUTS']),
    body('price').isFloat({ min: 0 }),
    body('quantity').isInt({ min: 1 }),
  ],
  validate,
  createProduct
);

router.get('/my/listings', authenticate, authorize('FARMER', 'SUPPLIER'), getMyProducts);

router.post(
  '/:productId/images',
  authenticate,
  authorize('FARMER', 'SUPPLIER'),
  upload.array('images', 5),
  uploadProductImages
);

router.patch(
  '/:id',
  authenticate,
  authorize('FARMER', 'SUPPLIER'),
  updateProduct
);

router.delete(
  '/:id',
  authenticate,
  authorize('FARMER', 'SUPPLIER'),
  deleteProduct
);

export default router;
