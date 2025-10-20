require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

const connectDB = require('./config/database');
const redis = require('./config/redis');
const logger = require('./utils/logger');

// Import middleware
const { errorHandler, notFound, handleValidationError } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const onboardingRoutes = require('./routes/onboarding');
const conversationRoutes = require('./routes/conversations');
const messageRoutes = require('./routes/messages');
const wellnessRoutes = require('./routes/wellness');
const journalRoutes = require('./routes/journals');
const habitRoutes = require('./routes/habits');

// Import services for initialization
const vectorDbService = require('./services/vectorDbService');

class MindMeshServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    
    this.port = process.env.PORT || 4000;
    this.isInitialized = false;
  }

  /**
   * Initialize the server
   */
  async initialize() {
    try {
      // Connect to databases
      await this.connectDatabases();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup Socket.IO
      this.setupSocketIO();
      
      // Setup error handling
      this.setupErrorHandling();
      
      // Initialize services
      await this.initializeServices();
      
      this.isInitialized = true;
      logger.info('Server initialized successfully');
      
    } catch (error) {
      logger.error('Server initialization failed:', error);
      throw error;
    }
  }

  /**
   * Connect to databases
   */
  async connectDatabases() {
    logger.info('Connecting to databases...');
    
    // Connect to MongoDB
    await connectDB();
    
    // Test Redis connection
    try {
      await redis.ping();
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.warn('Redis connection failed:', error.message);
    }
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Compression middleware
    this.app.use(compression());

    // Logging middleware
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined', {
        stream: {
          write: (message) => logger.info(message.trim())
        }
      }));
    }

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Trust proxy (for accurate IP addresses)
    this.app.set('trust proxy', 1);
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/healthz', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/onboarding', onboardingRoutes);
    this.app.use('/api/conversations', conversationRoutes);
    this.app.use('/api/messages', messageRoutes);
    this.app.use('/api/wellness', wellnessRoutes);
    this.app.use('/api/journals', journalRoutes);
    this.app.use('/api/habits', habitRoutes);

    // API documentation endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'MindMesh+ API',
        version: '1.0.0',
        description: 'Mental health and wellness platform API',
        endpoints: {
          auth: '/api/auth',
          onboarding: '/api/onboarding',
          conversations: '/api/conversations',
          messages: '/api/messages',
          wellness: '/api/wellness',
          journals: '/api/journals',
          habits: '/api/habits'
        },
        documentation: 'https://docs.mindmesh.com'
      });
    });

    // Catch-all for undefined routes
    this.app.use('*', notFound);
  }

  /**
   * Setup Socket.IO for WebRTC signaling
   */
  setupSocketIO() {
    this.io.on('connection', (socket) => {
      logger.info('Client connected', { socketId: socket.id });

      // Join video call room
      socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', userId);
        logger.info('User joined room', { roomId, userId, socketId: socket.id });
      });

      // Handle WebRTC signaling
      socket.on('offer', (data) => {
        socket.to(data.roomId).emit('offer', data);
      });

      socket.on('answer', (data) => {
        socket.to(data.roomId).emit('answer', data);
      });

      socket.on('ice-candidate', (data) => {
        socket.to(data.roomId).emit('ice-candidate', data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info('Client disconnected', { socketId: socket.id });
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error('Socket error:', { socketId: socket.id, error: error.message });
      });
    });

    // Handle Socket.IO server errors
    this.io.on('error', (error) => {
      logger.error('Socket.IO server error:', error);
    });
  }

  /**
   * Setup error handling middleware
   */
  setupErrorHandling() {
    // Validation error handler
    this.app.use(handleValidationError);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Initialize external services
   */
  async initializeServices() {
    logger.info('Initializing external services...');

    try {
      // Initialize Pinecone
      await vectorDbService.initialize();
      logger.info('Vector database service initialized');
    } catch (error) {
      logger.warn('Vector database initialization failed:', error.message);
      // Don't fail server startup if vector DB is unavailable
    }

    // Test other services
    try {
      const embeddingHealth = await require('./services/embeddingService').getHealth();
      logger.info('Embedding service status:', embeddingHealth.status);
    } catch (error) {
      logger.warn('Embedding service unavailable:', error.message);
    }

    try {
      const langGraphHealth = await require('./services/langGraphService').healthCheck();
      logger.info('LangGraph service status:', langGraphHealth.status);
    } catch (error) {
      logger.warn('LangGraph service unavailable:', error.message);
    }
  }

  /**
   * Start the server
   */
  async start() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      this.server.listen(this.port, () => {
        logger.info(`🚀 MindMesh+ Server running on port ${this.port}`);
        logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`🔗 API Base URL: http://localhost:${this.port}/api`);
        logger.info(`💚 Health Check: http://localhost:${this.port}/healthz`);
      });

      // Graceful shutdown handling
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      // Stop accepting new connections
      this.server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Close Socket.IO server
          this.io.close(() => {
            logger.info('Socket.IO server closed');
          });

          // Close database connections
          const mongoose = require('mongoose');
          await mongoose.connection.close();
          logger.info('MongoDB connection closed');

          // Close Redis connection
          redis.disconnect();
          logger.info('Redis connection closed');

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  /**
   * Get server instance
   */
  getServer() {
    return this.server;
  }

  /**
   * Get Socket.IO instance
   */
  getSocketIO() {
    return this.io;
  }
}

// Create and start server
const server = new MindMeshServer();

// Start server if this file is run directly
if (require.main === module) {
  server.start().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = server;
