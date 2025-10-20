const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validateBody, schemas } = require('../middleware/validate');
const { authLimiter, roleBasedLimiter } = require('../middleware/rateLimiter');

// Public routes (no authentication required)
router.post(
  '/signup',
  authLimiter,
  validateBody(schemas.userSignup),
  authController.signup
);

router.post(
  '/signin',
  authLimiter,
  validateBody(schemas.signin),
  authController.signin
);

router.post(
  '/password-reset',
  authLimiter,
  validateBody(schemas.passwordReset),
  authController.passwordReset
);

// Protected routes (authentication required)
router.use(authenticate);

router.get('/me', authController.getMe);

router.post('/refresh', authController.refresh);

router.put(
  '/profile',
  validateBody(schemas.profileUpdate),
  authController.updateProfile
);

router.post('/verify-email', authController.verifyEmail);

router.delete('/account', authController.deleteAccount);

// Admin only routes
router.get(
  '/stats',
  requireRole('admin'),
  authController.getStats
);

module.exports = router;
