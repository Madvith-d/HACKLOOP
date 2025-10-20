const Redis = require('ioredis');
const logger = require('../utils/logger');

let redis = null;

const initializeRedis = () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redis = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true, // Don't connect immediately
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 1000,
    });

    redis.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redis.on('error', (err) => {
      logger.warn('Redis connection error (continuing without Redis):', err.message);
      // Don't throw error, just log warning
    });

    redis.on('close', () => {
      logger.warn('Redis connection closed');
    });

    return redis;
  } catch (error) {
    logger.warn('Redis initialization failed (continuing without Redis):', error.message);
    return null;
  }
};

// Initialize Redis if not already initialized
if (!redis) {
  redis = initializeRedis();
}

module.exports = redis;