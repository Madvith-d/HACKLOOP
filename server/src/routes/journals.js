const express = require('express');
const Joi = require('joi');
const router = express.Router();

const journalController = require('../controllers/journalController');
const { authenticate, requireOnboarded } = require('../middleware/auth');
const { validateBody, validateParams, validateQuery, schemas } = require('../middleware/validate');
const { generalLimiter } = require('../middleware/rateLimiter');

// All routes require authentication and onboarding
router.use(authenticate);
router.use(requireOnboarded);

// Get journal statistics
router.get('/stats', journalController.getJournalStats);

// Get journal entries
router.get(
  '/',
  validateQuery(schemas.pagination.keys({
    moodTag: Joi.string().max(20),
    search: Joi.string().max(100)
  })),
  journalController.getJournals
);

// Create new journal entry
router.post(
  '/',
  generalLimiter,
  validateBody(schemas.journalCreate),
  journalController.createJournal
);

// Get specific journal entry
router.get(
  '/:id',
  validateParams({ id: schemas.objectId }),
  journalController.getJournal
);

// Update journal entry
router.put(
  '/:id',
  validateParams({ id: schemas.objectId }),
  validateBody(schemas.journalUpdate),
  journalController.updateJournal
);

// Delete journal entry
router.delete(
  '/:id',
  validateParams({ id: schemas.objectId }),
  journalController.deleteJournal
);

module.exports = router;
