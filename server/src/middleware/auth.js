const firebaseAdmin = require('../config/firebase');
const logger = require('../utils/logger');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

/**
 * Middleware to authenticate Firebase ID tokens
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header' 
      });
    }

    const idToken = authHeader.split('Bearer ')[1];

        // Check if Firebase is initialized
        if (!firebaseAdmin.isInitialized()) {
          logger.warn('Firebase not initialized, skipping token verification in development mode');
          // Mock user for development
          req.user = {
            uid: 'dev-user-123',
            email: 'dev@example.com',
            emailVerified: true,
            role: 'user',
            userId: null,
            onboarded: false
          };
          return next();
        }

        // Verify the Firebase ID token
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    
    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      claims: decodedToken,
    };

    // Fetch user from database to get role
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (user) {
      req.user.role = user.role;
      req.user.userId = user._id;
      req.user.onboarded = user.onboarded;
    } else {
      // User exists in Firebase but not in our DB (shouldn't happen in normal flow)
      req.user.role = 'user';
      req.user.onboarded = false;
    }

    logger.info(`User authenticated: ${req.user.uid}`);
    next();

  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired'
      });
    }

    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Invalid authentication token'
    });
  }
};

/**
 * Middleware to require specific role
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.uid} with role ${req.user.role}`);
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Middleware to require onboarding completion
 */
const requireOnboarded = (req, res, next) => {
  if (!req.user.onboarded) {
    return res.status(403).json({
      error: 'ONBOARDING_REQUIRED',
      message: 'Please complete onboarding first'
    });
  }
  next();
};

/**
 * Middleware to verify user owns resource
 */
const verifyOwnership = (userIdParam = 'userId') => {
  return (req, res, next) => {
    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
    
    // Admins can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user is accessing their own resource
    if (resourceUserId && resourceUserId.toString() !== req.user.userId.toString()) {
      logger.warn(`Ownership verification failed for user ${req.user.uid}`);
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'You can only access your own resources'
      });
    }

    next();
  };
};

/**
 * Middleware to log sensitive data access
 */
const logSensitiveAccess = (resourceType, targetCollection) => {
  return async (req, res, next) => {
    try {
      // Log the access
      await AuditLog.logAccess({
        actorId: req.user.userId,
        actorRole: req.user.role,
        targetCollection,
        targetId: req.params.id || req.params.userId,
        action: req.method === 'GET' ? 'read' : req.method.toLowerCase(),
        resourceType,
        reason: 'API access',
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        method: req.method,
        statusCode: 200, // Will be updated after response
        isSensitiveDataAccess: true,
        patientId: req.params.userId || req.params.id
      });
      
      next();
    } catch (error) {
      logger.error('Failed to log sensitive access:', error);
      next(); // Don't block the request if logging fails
    }
  };
};

/**
 * Middleware for emergency access (therapist accessing patient data in crisis)
 */
const emergencyAccess = async (req, res, next) => {
  try {
    // Check if this is emergency access (e.g., safety flag triggered)
    const patientId = req.params.userId || req.params.id;
    
    if (patientId && req.user.role === 'therapist') {
      // Log emergency access
      await AuditLog.logAccess({
        actorId: req.user.userId,
        actorRole: req.user.role,
        targetCollection: 'users',
        targetId: patientId,
        action: 'read',
        resourceType: 'emergency_access',
        reason: 'Emergency access to patient data',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        method: req.method,
        isEmergencyAccess: true,
        patientId
      });
    }
    
    next();
  } catch (error) {
    logger.error('Failed to log emergency access:', error);
    next();
  }
};

module.exports = {
  authenticate,
  requireRole,
  requireOnboarded,
  verifyOwnership,
  logSensitiveAccess,
  emergencyAccess,
};