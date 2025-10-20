const express = require('express');
const Joi = require('joi');
const router = express.Router();

const habitController = require('../controllers/habitController');
const { authenticate, requireOnboarded } = require('../middleware/auth');
const { validateBody, validateParams, validateQuery, schemas } = require('../middleware/validate');
const { generalLimiter } = require('../middleware/rateLimiter');

// All routes require authentication and onboarding
router.use(authenticate);
router.use(requireOnboarded);

// Get habit statistics
router.get('/stats', habitController.getHabitStats);

// Get habits by category
router.get(
  '/category/:category',
  validateParams({ category: Joi.string().max(50) }),
  habitController.getHabitsByCategory
);

// Get user's habits
router.get(
  '/',
  validateQuery(schemas.pagination.keys({
    category: Joi.string().max(50),
    isActive: Joi.boolean()
  })),
  habitController.getHabits
);

// Create new habit
router.post(
  '/',
  generalLimiter,
  validateBody(schemas.habitCreate),
  habitController.createHabit
);

// Get specific habit
router.get(
  '/:id',
  validateParams({ id: schemas.objectId }),
  habitController.getHabit
);

// Update habit
router.put(
  '/:id',
  validateParams({ id: schemas.objectId }),
  validateBody(schemas.habitUpdate),
  habitController.updateHabit
);

// Log habit progress
router.post(
  '/:id/progress',
  validateParams({ id: schemas.objectId }),
  validateBody(schemas.habitProgress),
  habitController.logProgress
);

// Delete habit
router.delete(
  '/:id',
  validateParams({ id: schemas.objectId }),
  habitController.deleteHabit
);

module.exports = router;
