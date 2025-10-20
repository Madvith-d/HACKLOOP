const express = require('express');
const router = express.Router();

const messageController = require('../controllers/messageController');
const { authenticate, requireOnboarded, verifyOwnership } = require('../middleware/auth');
const { validateBody, validateParams, schemas } = require('../middleware/validate');
const { messageLimiter } = require('../middleware/rateLimiter');

// All routes require authentication and onboarding
router.use(authenticate);
router.use(requireOnboarded);

// Send message and get AI response (Core RAG flow)
router.post(
  '/',
  messageLimiter,
  validateBody(schemas.messageCreate),
  messageController.sendMessage
);

// Get conversation messages
router.get(
  '/:conversationId',
  validateParams({ conversationId: schemas.objectId }),
  verifyOwnership('conversationId'),
  messageController.getMessages
);

module.exports = router;
