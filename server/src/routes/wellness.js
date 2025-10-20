const express = require('express');
const router = express.Router();
const Joi = require('joi');

const wellnessController = require('../controllers/wellnessController');
const { authenticate, requireOnboarded } = require('../middleware/auth');
const { validateParams, validateQuery, schemas } = require('../middleware/validate');

// All routes require authentication and onboarding
router.use(authenticate);
router.use(requireOnboarded);

// Get wellness history
router.get(
  '/:userId',
  validateParams({ userId: schemas.objectId }),
  validateQuery(schemas.wellnessQuery),
  wellnessController.getWellnessHistory
);

// Get wellness trends analysis
router.get(
  '/:userId/trends',
  validateParams({ userId: schemas.objectId }),
  validateQuery(Joi.object({
    period: Joi.string().valid('7d', '30d', '90d', '1y').default('30d')
  })),
  wellnessController.getWellnessTrends
);

// Get current wellness status
router.get(
  '/:userId/current',
  validateParams({ userId: schemas.objectId }),
  wellnessController.getCurrentWellness
);

// Get wellness dashboard data
router.get(
  '/:userId/dashboard',
  validateParams({ userId: schemas.objectId }),
  wellnessController.getWellnessDashboard
);

module.exports = router;
