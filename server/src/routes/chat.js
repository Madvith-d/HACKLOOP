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

    const result = await agent.processMessage(userId, message);

    const chatId = uuidv4();
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

    res.json({
      success: true,
      chatId,
      response: result.response,
      recommendation: result.recommendation,
      emotionalAnalysis: result.emotionalAnalysis,
      therapistAlert: result.therapistAlert || false
    });
  } catch (error) {
    logger.error('Error processing chat message:', error);
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
    
    await db.query(`
      INSERT INTO chat_messages (id, user_id, user_message, agent_response, emotional_analysis, recommendation, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, now())
    `, [
      chatId,
      userId,
      message,
      finalChunk?.data || '',
      chunks.find(c => c.type === 'analysis')?.data ? JSON.stringify(chunks.find(c => c.type === 'analysis').data) : null,
      chunks.find(c => c.type === 'recommendation')?.data ? JSON.stringify(chunks.find(c => c.type === 'recommendation').data) : null
    ]);

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
