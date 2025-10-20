const express = require('express');
const router = express.Router();

const conversationController = require('../controllers/conversationController');
const { authenticate, requireRole, verifyOwnership } = require('../middleware/auth');
const { validateBody, validateQuery, validateParams, schemas } = require('../middleware/validate');
const { generalLimiter } = require('../middleware/rateLimiter');

// All routes require authentication
router.use(authenticate);

// Create new conversation
router.post(
  '/',
  generalLimiter,
  validateBody(schemas.conversationCreate),
  conversationController.createConversation
);

// Get user's conversations
router.get(
  '/',
  validateQuery(schemas.pagination),
  conversationController.getConversations
);

// Get conversation statistics
router.get('/stats', conversationController.getConversationStats);

// Get conversations for therapist (therapist only)
router.get(
  '/therapist',
  requireRole('therapist'),
  validateQuery(schemas.pagination),
  conversationController.getTherapistConversations
);

// Get specific conversation
router.get(
  '/:id',
  validateParams({ id: schemas.objectId }),
  verifyOwnership('id'),
  conversationController.getConversation
);

// Close conversation
router.put(
  '/:id/close',
  validateParams({ id: schemas.objectId }),
  verifyOwnership('id'),
  conversationController.closeConversation
);

// Update conversation tags
router.put(
  '/:id/tags',
  validateParams({ id: schemas.objectId }),
  verifyOwnership('id'),
  validateBody(schemas.conversationTagsUpdate),
  conversationController.updateConversationTags
);

module.exports = router;
