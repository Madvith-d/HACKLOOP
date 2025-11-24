const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const agent = require('../ai/agent');
const logger = require('../utils/logger');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// Add logging middleware to track all chat route requests
router.use((req, res, next) => {
  logger.info('Chat route request received', {
    method: req.method,
    path: req.path,
    fullUrl: req.originalUrl,
    hasAuth: !!req.headers.authorization,
    contentType: req.get('Content-Type'),
    body: req.body ? { messageLength: req.body.message?.length, hasMessage: !!req.body.message } : 'no body',
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

router.post('/message', authMiddleware, [
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 5000 }).withMessage('Message too long')
], async (req, res, next) => {
  // Set request timeout to 45 seconds for better reliability
  req.setTimeout(45000);

  try {
    logger.info('Chat message POST route handler executing', {
      userId: req.user?.id,
      messageLength: req.body?.message?.length,
      messagePreview: req.body?.message?.substring(0, 50)
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors in chat message', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const { message } = req.body;
    const userId = req.user.id;

    logger.info('Chat message received and validated', { userId, messageLength: message.length });

    // Create a timeout promise for the entire operation (30 seconds)
    // This should be sufficient now that initialization has proper timeout handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 30000);
    });

    const processingPromise = agent.processMessage(userId, message);
    const result = await Promise.race([processingPromise, timeoutPromise]);

    const chatId = uuidv4();
    let chatPersisted = false;

    try {
      await db.query(`
        INSERT INTO chat_messages (id, user_id, user_message, agent_response, emotional_analysis, recommendation, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, now())
      `, [
        chatId,
        userId,
        message,
        result.response,
        result.emotionalAnalysis ? JSON.stringify(result.emotionalAnalysis) : null,
        result.recommendation ? JSON.stringify(result.recommendation) : null
      ]);
      chatPersisted = true;
    } catch (dbError) {
      logger.warn('Failed to persist chat message', {
        userId,
        chatId,
        error: dbError.message
      });
    }

    const safeResponse = typeof result.response === 'string' && result.response.trim().length > 0
      ? result.response
      : '💭 Thank you for sharing. I\'m here to listen. Whether you want to journal, work on a habit, or talk to a therapist, I\'m here to support you.';

    res.json({
      success: true,
      chatId: chatPersisted ? chatId : null,
      response: safeResponse,
      recommendation: result.recommendation,
      action: result.recommendation?.action || null, // Explicitly send action
      emotionalAnalysis: result.emotionalAnalysis,
      therapistAlert: result.therapistAlert || false
    });
  } catch (error) {
    logger.error('Error processing chat message:', error);

    // If it's a timeout, return a quick fallback response
    if (error.message === 'Request timeout') {
      return res.json({
        success: true,
        chatId: null,
        response: '💭 Thank you for sharing. I\'m processing your message. How are you feeling right now?',
        recommendation: null,
        emotionalAnalysis: null,
        therapistAlert: false
      });
    }

    next(error);
  }
});

router.post('/stream', authMiddleware, [
  body('message').trim().notEmpty().withMessage('Message is required')
], async (req, res, next) => {
  try {
    logger.info('Chat /stream endpoint hit', {
      userId: req.user?.id,
      messageLength: req.body?.message?.length
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors in chat stream', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const { message } = req.body;
    const userId = req.user.id;

    res.setHeader('Content-Type', 'application/x-ndjson');

    const chunks = [];

    await agent.streamMessage(userId, message, (chunk) => {
      chunks.push(chunk);
      res.write(JSON.stringify(chunk) + '\n');
    });

    const chatId = uuidv4();
    const finalChunk = chunks[chunks.length - 1];
    const responseText = typeof finalChunk?.data === 'string' ? finalChunk.data : '';
    const analysisChunk = chunks.find(c => c.type === 'analysis');
    const recommendationChunk = chunks.find(c => c.type === 'recommendation');

    try {
      await db.query(`
        INSERT INTO chat_messages (id, user_id, user_message, agent_response, emotional_analysis, recommendation, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, now())
      `, [
        chatId,
        userId,
        message,
        responseText,
        analysisChunk?.data ? JSON.stringify(analysisChunk.data) : null,
        recommendationChunk?.data ? JSON.stringify(recommendationChunk.data) : null
      ]);
    } catch (dbError) {
      logger.warn('Failed to persist streamed chat message', {
        userId,
        chatId,
        error: dbError.message
      });
    }

    res.end();
  } catch (error) {
    logger.error('Error in stream:', error);
    res.write(JSON.stringify({ type: 'error', data: error.message }) + '\n');
    res.end();
  }
});

router.get('/history', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit || 20, 10), 100);
    const offset = parseInt(req.query.offset || 0, 10);

    const result = await db.query(`
      SELECT id, user_message, agent_response, emotional_analysis, recommendation, created_at
      FROM chat_messages
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    res.json({
      messages: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching chat history:', error);
    next(error);
  }
});

router.get('/agent-info', (req, res) => {
  res.json(agent.getAgentDescription());
});

// Test endpoint to verify connectivity (no auth required)
router.get('/test', (req, res) => {
  logger.info('Chat test endpoint hit', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    headers: req.headers
  });
  res.json({
    success: true,
    message: 'Chat API is reachable',
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

router.get('/analysis/:chatId', authMiddleware, async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const result = await db.query(`
      SELECT id, user_message, agent_response, emotional_analysis, recommendation, created_at
      FROM chat_messages
      WHERE id = $1 AND user_id = $2
    `, [chatId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chat message not found' });
    }

    res.json({
      chat: result.rows[0]
    });
  } catch (error) {
    logger.error('Error fetching chat analysis:', error);
    next(error);
  }
});

module.exports = router;
