const logger = require('../utils/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId,
    timestamp: new Date().toISOString()
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: errors
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'INVALID_ID',
      message: 'Invalid ID format'
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      error: 'DUPLICATE_ENTRY',
      message: `${field} already exists`,
      field
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Invalid authentication token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'TOKEN_EXPIRED',
      message: 'Authentication token has expired'
    });
  }

  // Firebase auth errors
  if (err.code && err.code.startsWith('auth/')) {
    return res.status(401).json({
      error: 'FIREBASE_AUTH_ERROR',
      message: err.message
    });
  }

  // Rate limiting errors
  if (err.message && err.message.includes('Too many requests')) {
    return res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    });
  }

  // External service errors
  if (err.isAxiosError) {
    const statusCode = err.response?.status || 500;
    const message = err.response?.data?.message || 'External service error';
    
    logger.error('External service error:', {
      service: err.config?.url,
      status: statusCode,
      message
    });
    
    return res.status(502).json({
      error: 'EXTERNAL_SERVICE_ERROR',
      message: 'Service temporarily unavailable'
    });
  }

  // Pinecone errors
  if (err.message && err.message.includes('Pinecone')) {
    return res.status(502).json({
      error: 'VECTOR_DB_ERROR',
      message: 'Vector database service error'
    });
  }

  // LangGraph service errors
  if (err.message && err.message.includes('LangGraph')) {
    return res.status(502).json({
      error: 'AI_SERVICE_ERROR',
      message: 'AI service temporarily unavailable'
    });
  }

  // Default server error
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

/**
 * 404 handler for unmatched routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Async error wrapper to catch async errors in route handlers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error handler for Joi
 */
const handleValidationError = (err, req, res, next) => {
  if (err.isJoi) {
    const errors = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));
    
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: errors
    });
  }
  next(err);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  handleValidationError
};
