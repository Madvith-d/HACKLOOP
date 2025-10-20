const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Create a rate limiter with custom options
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded:', {
        ip: req.ip,
        endpoint: req.originalUrl,
        userAgent: req.get('User-Agent'),
        userId: req.user?.userId
      });
      
      res.status(429).json(defaultOptions.message);
    },
    skip: (req) => {
      // Skip rate limiting for authenticated users with higher limits
      return req.user?.role === 'admin';
    }
  };

  return rateLimit({ ...defaultOptions, ...options });
};

/**
 * General API rate limiter
 */
const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per 15 minutes
});

/**
 * Strict rate limiter for sensitive endpoints
 */
const strictLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20 // 20 requests per 15 minutes
});

/**
 * Authentication rate limiter
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: {
    error: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts, please try again later'
  },
  skipSuccessfulRequests: true // Don't count successful requests
});

/**
 * Message sending rate limiter
 */
const messageLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  message: {
    error: 'MESSAGE_RATE_LIMIT_EXCEEDED',
    message: 'Too many messages sent, please slow down'
  }
});

/**
 * File upload rate limiter
 */
const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: {
    error: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    message: 'Too many file uploads, please try again later'
  }
});

/**
 * Password reset rate limiter
 */
const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: {
    error: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
    message: 'Too many password reset attempts, please try again later'
  }
});

/**
 * Wellness score update rate limiter
 */
const wellnessUpdateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 wellness updates per minute
  message: {
    error: 'WELLNESS_UPDATE_RATE_LIMIT_EXCEEDED',
    message: 'Too many wellness score updates, please slow down'
  }
});

/**
 * Dynamic rate limiter based on user role
 */
const roleBasedLimiter = (req, res, next) => {
  let limiter;
  
  switch (req.user?.role) {
    case 'admin':
      limiter = createRateLimiter({
        windowMs: 15 * 60 * 1000,
        max: 1000 // Very high limit for admins
      });
      break;
    case 'therapist':
      limiter = createRateLimiter({
        windowMs: 15 * 60 * 1000,
        max: 300 // Higher limit for therapists
      });
      break;
    case 'user':
    default:
      limiter = generalLimiter;
      break;
  }
  
  limiter(req, res, next);
};

/**
 * Custom rate limiter for specific endpoints
 */
const createCustomLimiter = (windowMs, max, message) => {
  return createRateLimiter({
    windowMs,
    max,
    message: {
      error: 'CUSTOM_RATE_LIMIT_EXCEEDED',
      message: message || 'Rate limit exceeded for this endpoint'
    }
  });
};

/**
 * Rate limiter that uses user ID instead of IP for authenticated users
 */
const userBasedLimiter = createRateLimiter({
  keyGenerator: (req) => {
    return req.user?.userId || req.ip;
  },
  windowMs: 15 * 60 * 1000,
  max: 200
});

module.exports = {
  createRateLimiter,
  generalLimiter,
  strictLimiter,
  authLimiter,
  messageLimiter,
  uploadLimiter,
  passwordResetLimiter,
  wellnessUpdateLimiter,
  roleBasedLimiter,
  createCustomLimiter,
  userBasedLimiter
};
