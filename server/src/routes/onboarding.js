const express = require('express');
const router = express.Router();

const onboardingController = require('../controllers/onboardingController');
const { authenticate, requireOnboarded } = require('../middleware/auth');
const { validateBody, schemas } = require('../middleware/validate');
const { generalLimiter } = require('../middleware/rateLimiter');

// All routes require authentication
router.use(authenticate);

// Get onboarding schema
router.get('/schema', onboardingController.getOnboardingSchema);

// Get onboarding status
router.get('/status', onboardingController.getOnboardingStatus);

// Complete onboarding
router.post(
  '/complete',
  generalLimiter,
  validateBody(schemas.onboardingData),
  onboardingController.completeOnboarding
);

// Update onboarding profile
router.put(
  '/update',
  requireOnboarded,
  validateBody(schemas.onboardingUpdate),
  onboardingController.updateOnboarding
);

module.exports = router;
