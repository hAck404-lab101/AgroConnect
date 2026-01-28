import { Router } from 'express';
import { body } from 'express-validator';
import {
  getConversations,
  getMessages,
  sendMessage,
} from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { apiRateLimit } from '../middleware/rateLimit.middleware';

const router = Router();

router.use(authenticate);

router.get('/conversations', getConversations);
router.get('/messages/:partnerId', getMessages);
router.post(
  '/send',
  apiRateLimit,
  [
    body('receiverId').notEmpty(),
    body('content').optional().trim(),
    body('imageUrl').optional().isURL(),
  ],
  validate,
  sendMessage
);

export default router;
