const logger = require('../utils/logger');
const { Conversation, Message, User } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');

class ConversationController {
  /**
   * Create a new conversation
   * POST /api/conversations
   */
  createConversation = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { therapistId, tags = [] } = req.body;

    try {
      // Create new conversation
      const conversation = new Conversation({
        userId,
        therapistId: therapistId || null,
        status: 'active',
        tags,
        startedAt: new Date()
      });

      await conversation.save();

      logger.info('Conversation created', {
        conversationId: conversation._id,
        userId,
        therapistId
      });

      res.status(201).json({
        success: true,
        message: 'Conversation created successfully',
        data: {
          conversation: {
            id: conversation._id,
            userId: conversation.userId,
            therapistId: conversation.therapistId,
            status: conversation.status,
            tags: conversation.tags,
            startedAt: conversation.startedAt,
            createdAt: conversation.createdAt
          }
        }
      });

    } catch (error) {
      logger.error('Conversation creation error:', error);
      throw error;
    }
  });

  /**
   * Get user's conversations
   * GET /api/conversations
   */
  getConversations = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    try {
      // Build query
      const query = { userId };
      if (status) {
        query.status = status;
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      // Get conversations with pagination
      const conversations = await Conversation.find(query)
        .populate('therapistId', 'name email role')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count
      const total = await Conversation.countDocuments(query);

      // Get message counts for each conversation
      const conversationsWithStats = await Promise.all(
        conversations.map(async (conv) => {
          const messageCount = await Message.countDocuments({ 
            conversationId: conv._id 
          });
          
          const lastMessage = await Message.findOne({ 
            conversationId: conv._id 
          })
          .sort({ timestamp: -1 })
          .select('timestamp text role');

          return {
            id: conv._id,
            userId: conv.userId,
            therapistId: conv.therapistId,
            status: conv.status,
            tags: conv.tags,
            startedAt: conv.startedAt,
            endedAt: conv.endedAt,
            createdAt: conv.createdAt,
            messageCount,
            lastMessage: lastMessage ? {
              timestamp: lastMessage.timestamp,
              text: lastMessage.text.substring(0, 100),
              role: lastMessage.role
            } : null
          };
        })
      );

      res.json({
        success: true,
        data: {
          conversations: conversationsWithStats,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Get conversations error:', error);
      throw error;
    }
  });

  /**
   * Get conversation details
   * GET /api/conversations/:id
   */
  getConversation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const conversation = await Conversation.findOne({ 
        _id: id, 
        userId 
      }).populate('therapistId', 'name email role');

      if (!conversation) {
        return res.status(404).json({
          error: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found'
        });
      }

      // Get message count
      const messageCount = await Message.countDocuments({ 
        conversationId: conversation._id 
      });

      res.json({
        success: true,
        data: {
          conversation: {
            id: conversation._id,
            userId: conversation.userId,
            therapistId: conversation.therapistId,
            status: conversation.status,
            tags: conversation.tags,
            startedAt: conversation.startedAt,
            endedAt: conversation.endedAt,
            createdAt: conversation.createdAt,
            messageCount
          }
        }
      });

    } catch (error) {
      logger.error('Get conversation error:', error);
      throw error;
    }
  });

  /**
   * Close a conversation
   * PUT /api/conversations/:id/close
   */
  closeConversation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const conversation = await Conversation.findOne({ 
        _id: id, 
        userId 
      });

      if (!conversation) {
        return res.status(404).json({
          error: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found'
        });
      }

      if (conversation.status === 'closed') {
        return res.status(400).json({
          error: 'CONVERSATION_ALREADY_CLOSED',
          message: 'Conversation is already closed'
        });
      }

      // Update conversation status
      conversation.status = 'closed';
      conversation.endedAt = new Date();
      await conversation.save();

      logger.info('Conversation closed', {
        conversationId: conversation._id,
        userId
      });

      res.json({
        success: true,
        message: 'Conversation closed successfully',
        data: {
          conversation: {
            id: conversation._id,
            status: conversation.status,
            endedAt: conversation.endedAt
          }
        }
      });

    } catch (error) {
      logger.error('Close conversation error:', error);
      throw error;
    }
  });

  /**
   * Update conversation tags
   * PUT /api/conversations/:id/tags
   */
  updateConversationTags = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const { tags } = req.body;

    try {
      const conversation = await Conversation.findOne({ 
        _id: id, 
        userId 
      });

      if (!conversation) {
        return res.status(404).json({
          error: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found'
        });
      }

      // Update tags
      conversation.tags = tags || [];
      await conversation.save();

      logger.info('Conversation tags updated', {
        conversationId: conversation._id,
        userId,
        tags: conversation.tags
      });

      res.json({
        success: true,
        message: 'Conversation tags updated successfully',
        data: {
          conversation: {
            id: conversation._id,
            tags: conversation.tags
          }
        }
      });

    } catch (error) {
      logger.error('Update conversation tags error:', error);
      throw error;
    }
  });

  /**
   * Get conversation statistics
   * GET /api/conversations/stats
   */
  getConversationStats = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    try {
      const totalConversations = await Conversation.countDocuments({ userId });
      const activeConversations = await Conversation.countDocuments({ 
        userId, 
        status: 'active' 
      });
      const closedConversations = await Conversation.countDocuments({ 
        userId, 
        status: 'closed' 
      });

      // Get total messages across all conversations
      const totalMessages = await Message.countDocuments({ userId });

      // Get recent conversation activity (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentConversations = await Conversation.countDocuments({
        userId,
        createdAt: { $gte: thirtyDaysAgo }
      });

      res.json({
        success: true,
        data: {
          totalConversations,
          activeConversations,
          closedConversations,
          totalMessages,
          recentConversations,
          averageMessagesPerConversation: totalConversations > 0 
            ? Math.round(totalMessages / totalConversations) 
            : 0
        }
      });

    } catch (error) {
      logger.error('Get conversation stats error:', error);
      throw error;
    }
  });

  /**
   * Get conversations for therapist (therapist only)
   * GET /api/conversations/therapist
   */
  getTherapistConversations = asyncHandler(async (req, res) => {
    const therapistId = req.user.userId;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      userId 
    } = req.query;

    try {
      // Build query
      const query = { therapistId };
      if (status) {
        query.status = status;
      }
      if (userId) {
        query.userId = userId;
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get conversations with pagination
      const conversations = await Conversation.find(query)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count
      const total = await Conversation.countDocuments(query);

      // Get message counts and last messages
      const conversationsWithStats = await Promise.all(
        conversations.map(async (conv) => {
          const messageCount = await Message.countDocuments({ 
            conversationId: conv._id 
          });
          
          const lastMessage = await Message.findOne({ 
            conversationId: conv._id 
          })
          .sort({ timestamp: -1 })
          .select('timestamp text role');

          return {
            id: conv._id,
            userId: conv.userId,
            therapistId: conv.therapistId,
            status: conv.status,
            tags: conv.tags,
            startedAt: conv.startedAt,
            endedAt: conv.endedAt,
            createdAt: conv.createdAt,
            messageCount,
            lastMessage: lastMessage ? {
              timestamp: lastMessage.timestamp,
              text: lastMessage.text.substring(0, 100),
              role: lastMessage.role
            } : null
          };
        })
      );

      res.json({
        success: true,
        data: {
          conversations: conversationsWithStats,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Get therapist conversations error:', error);
      throw error;
    }
  });
}

module.exports = new ConversationController();
