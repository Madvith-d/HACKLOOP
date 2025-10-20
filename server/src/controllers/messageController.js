const logger = require('../utils/logger');
const { Message, Conversation, WellnessScore, SafetyFlag } = require('../models');
const embeddingService = require('../services/embeddingService');
const vectorDbService = require('../services/vectorDbService');
const langGraphService = require('../services/langGraphService');
const cvService = require('../services/cvService');
const { asyncHandler } = require('../middleware/errorHandler');

class MessageController {
  /**
   * Send message and get AI response (Core RAG Flow)
   * POST /api/messages
   */
  sendMessage = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { conversationId, text, cvMetrics, audioMetrics } = req.body;

    try {
      // 1. Validate conversation exists and user owns it
      const conversation = await Conversation.findOne({ 
        _id: conversationId, 
        userId 
      });

      if (!conversation) {
        return res.status(404).json({
          error: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found'
        });
      }

      // 2. Process CV metrics if provided
      let processedCVMetrics = null;
      if (cvMetrics) {
        processedCVMetrics = await cvService.processCVMetrics({
          userId,
          sessionId: conversationId,
          ...cvMetrics
        });
      }

      // 3. Save user message to MongoDB
      const userMessage = new Message({
        conversationId,
        userId,
        role: 'user',
        text: text.trim(),
        rawText: text.trim(),
        timestamp: new Date(),
        cvMetrics: processedCVMetrics?.metrics || cvMetrics || {},
        audioMetrics: audioMetrics || {},
        sentiment: await this.analyzeSentiment(text) // Basic sentiment analysis
      });

      await userMessage.save();

      // 4. Create embedding for the message
      const embeddingResult = await embeddingService.embedWithRetry(text);
      
      // 5. Upsert vector to Pinecone
      const vectorId = `msg_${userMessage._id}_${Date.now()}`;
      const vector = vectorDbService.createVector(
        vectorId,
        embeddingResult.embedding,
        {
          userId: userId.toString(),
          type: 'message_chunk',
          mongoRef: `messages/${userMessage._id}`,
          timestamp: userMessage.timestamp.toISOString(),
          importance: this.calculateImportance(processedCVMetrics, text),
          privacy: 'public'
        }
      );

      await vectorDbService.upsert([vector]);

      // 6. Fetch context for LangGraph
      const context = await this.buildContext(userId, conversationId, embeddingResult.embedding);

      // 7. Call LangGraph service
      const aiResponse = await langGraphService.processMessage({
        userId,
        conversationId,
        text,
        cvMetrics: processedCVMetrics,
        audioMetrics,
        context,
        recentMessages: context.recentMessages,
        wellnessHistory: context.wellnessHistory
      });

      // 8. Save AI response to MongoDB
      const agentMessage = new Message({
        conversationId,
        userId,
        role: 'agent',
        text: aiResponse.response,
        timestamp: new Date(),
        metadata: {
          wellnessScore: aiResponse.wellnessScore,
          action: aiResponse.action,
          confidence: aiResponse.confidence,
          reasoning: aiResponse.reasoning
        }
      });

      await agentMessage.save();

      // 9. Save wellness score
      const wellnessScore = new WellnessScore({
        userId,
        conversationId,
        timestamp: new Date(),
        score: aiResponse.wellnessScore,
        components: {
          cv: processedCVMetrics?.stressScore || 0.5,
          text: aiResponse.wellnessScore,
          audio: this.calculateAudioStress(audioMetrics)
        },
        actionSuggested: aiResponse.action,
        reasoning: aiResponse.reasoning
      });

      await wellnessScore.save();

      // 10. Handle safety flags if needed
      await this.checkAndCreateSafetyFlags(userId, text, aiResponse, userMessage._id);

      // 11. Handle suggested actions
      const actionResult = await this.handleSuggestedAction(
        userId, 
        aiResponse.action, 
        aiResponse.wellnessScore
      );

      logger.info('Message processed successfully', {
        userId,
        conversationId,
        messageId: userMessage._id,
        wellnessScore: aiResponse.wellnessScore,
        action: aiResponse.action
      });

      res.json({
        success: true,
        message: 'Message processed successfully',
        data: {
          userMessage: {
            id: userMessage._id,
            text: userMessage.text,
            timestamp: userMessage.timestamp
          },
          agentResponse: {
            id: agentMessage._id,
            text: agentMessage.text,
            timestamp: agentMessage.timestamp,
            wellnessScore: aiResponse.wellnessScore,
            action: aiResponse.action,
            confidence: aiResponse.confidence
          },
          wellnessScore: {
            score: wellnessScore.score,
            components: wellnessScore.components,
            actionSuggested: wellnessScore.actionSuggested
          },
          actionResult
        }
      });

    } catch (error) {
      logger.error('Message processing error:', error);
      throw error;
    }
  });

  /**
   * Get conversation messages
   * GET /api/messages/:conversationId
   */
  getMessages = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.userId;
    const { page = 1, limit = 50 } = req.query;

    try {
      // Verify conversation ownership
      const conversation = await Conversation.findOne({ 
        _id: conversationId, 
        userId 
      });

      if (!conversation) {
        return res.status(404).json({
          error: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found'
        });
      }

      // Get messages with pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const messages = await Message.find({ conversationId })
        .sort({ timestamp: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-rawText -cvMetrics -audioMetrics'); // Exclude sensitive data

      const total = await Message.countDocuments({ conversationId });

      res.json({
        success: true,
        data: {
          messages: messages.map(msg => ({
            id: msg._id,
            role: msg.role,
            text: msg.text,
            timestamp: msg.timestamp,
            metadata: msg.metadata || {}
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Get messages error:', error);
      throw error;
    }
  });

  /**
   * Build context for LangGraph (RAG implementation)
   */
  async buildContext(userId, conversationId, queryEmbedding) {
    try {
      // 1. Get recent messages (short-term context)
      const recentMessages = await Message.find({ conversationId })
        .sort({ timestamp: -1 })
        .limit(6)
        .select('role text timestamp metadata');

      // 2. Semantic search for relevant memories
      const semanticResults = await vectorDbService.searchUserMemories(
        userId,
        queryEmbedding,
        { topK: 8, includeMetadata: true }
      );

      // 3. Get wellness history (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const wellnessHistory = await WellnessScore.find({
        userId,
        timestamp: { $gte: thirtyDaysAgo }
      })
      .sort({ timestamp: -1 })
      .limit(20)
      .select('score components timestamp actionSuggested');

      // 4. Fetch canonical documents from MongoDB using vector results
      const relevantDocuments = await this.fetchRelevantDocuments(semanticResults);

      return {
        recentMessages: recentMessages.reverse(), // Chronological order
        semanticContext: relevantDocuments,
        wellnessHistory,
        queryEmbedding
      };

    } catch (error) {
      logger.error('Failed to build context:', error);
      
      // Return minimal context on error
      return {
        recentMessages: [],
        semanticContext: [],
        wellnessHistory: [],
        queryEmbedding
      };
    }
  }

  /**
   * Fetch relevant documents from MongoDB using vector search results
   */
  async fetchRelevantDocuments(semanticResults) {
    try {
      const documents = [];
      
      for (const match of semanticResults.matches || []) {
        const mongoRef = match.metadata?.mongoRef;
        if (!mongoRef) continue;

        try {
          // Parse mongoRef (format: "collection/id")
          const [collection, id] = mongoRef.split('/');
          
          let doc = null;
          switch (collection) {
            case 'messages':
              doc = await Message.findById(id).select('text timestamp role');
              break;
            case 'session_summaries':
              doc = await require('../models').SessionSummary.findById(id).select('summaryText timestamp');
              break;
            case 'user_profiles':
              // Only include safe profile facts
              doc = await require('../models').UserProfile.findById(id).select('likes dislikes preferences');
              break;
          }

          if (doc) {
            documents.push({
              type: collection,
              id: doc._id,
              content: doc.text || doc.summaryText || this.formatProfileFacts(doc),
              timestamp: doc.timestamp,
              similarity: match.score
            });
          }
        } catch (fetchError) {
          logger.warn('Failed to fetch document:', { mongoRef, error: fetchError.message });
        }
      }

      return documents;

    } catch (error) {
      logger.error('Failed to fetch relevant documents:', error);
      return [];
    }
  }

  /**
   * Format user profile facts for context
   */
  formatProfileFacts(profile) {
    const facts = [];
    
    if (profile.likes?.length > 0) {
      facts.push(`User likes: ${profile.likes.join(', ')}`);
    }
    
    if (profile.dislikes?.length > 0) {
      facts.push(`User dislikes: ${profile.dislikes.join(', ')}`);
    }
    
    if (profile.preferences?.preferredSessionMode) {
      facts.push(`Prefers ${profile.preferences.preferredSessionMode} sessions`);
    }

    return facts.join('. ');
  }

  /**
   * Analyze sentiment of text (basic implementation)
   */
  async analyzeSentiment(text) {
    try {
      // Basic keyword-based sentiment analysis
      const positiveWords = ['good', 'great', 'happy', 'excited', 'wonderful', 'amazing', 'love', 'like'];
      const negativeWords = ['bad', 'terrible', 'sad', 'angry', 'hate', 'awful', 'horrible', 'depressed', 'anxious'];
      
      const lowerText = text.toLowerCase();
      const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
      const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
      
      let sentiment = 'neutral';
      let score = 0;
      
      if (positiveCount > negativeCount) {
        sentiment = 'positive';
        score = 0.6 + (positiveCount * 0.1);
      } else if (negativeCount > positiveCount) {
        sentiment = 'negative';
        score = -0.6 - (negativeCount * 0.1);
      }
      
      return {
        label: sentiment,
        score: Math.max(-1, Math.min(1, score))
      };
    } catch (error) {
      logger.error('Sentiment analysis error:', error);
      return { label: 'neutral', score: 0 };
    }
  }

  /**
   * Calculate importance score for vector storage
   */
  calculateImportance(cvMetrics, text) {
    try {
      let importance = 0.5; // Base importance
      
      // Increase importance based on CV stress
      if (cvMetrics?.stressScore > 0.7) {
        importance += 0.3;
      }
      
      // Increase importance for longer, more detailed messages
      if (text.length > 100) {
        importance += 0.1;
      }
      
      // Increase importance for messages with emotional keywords
      const emotionalKeywords = ['help', 'crisis', 'suicide', 'hurt', 'pain', 'therapy', 'doctor'];
      const hasEmotionalContent = emotionalKeywords.some(keyword => 
        text.toLowerCase().includes(keyword)
      );
      
      if (hasEmotionalContent) {
        importance += 0.2;
      }
      
      return Math.max(0, Math.min(1, importance));
    } catch (error) {
      logger.error('Importance calculation error:', error);
      return 0.5;
    }
  }

  /**
   * Calculate audio stress from audio metrics
   */
  calculateAudioStress(audioMetrics) {
    if (!audioMetrics) return 0.5;
    
    try {
      const speechRate = audioMetrics.speechRate || 150; // Normal: 150 words/min
      const volume = audioMetrics.volume || 0.5;
      const pauseRatio = audioMetrics.pauseRatio || 0.2;
      
      // Higher speech rate = more stress
      const rateStress = Math.min(1, (speechRate - 100) / 100);
      
      // More pauses = more stress
      const pauseStress = pauseRatio;
      
      // Lower volume = potentially more stress
      const volumeStress = 1 - volume;
      
      return (rateStress + pauseStress + volumeStress) / 3;
    } catch (error) {
      logger.error('Audio stress calculation error:', error);
      return 0.5;
    }
  }

  /**
   * Check for safety flags and create them if needed
   */
  async checkAndCreateSafetyFlags(userId, text, aiResponse, messageId) {
    try {
      const safetyKeywords = {
        suicidal_ideation: ['suicide', 'kill myself', 'end it all', 'not worth living'],
        self_harm: ['hurt myself', 'cut myself', 'self harm', 'harm myself'],
        violence: ['hurt someone', 'kill someone', 'violence', 'attack']
      };
      
      const lowerText = text.toLowerCase();
      
      for (const [flagType, keywords] of Object.entries(safetyKeywords)) {
        const hasKeyword = keywords.some(keyword => lowerText.includes(keyword));
        
        if (hasKeyword) {
          const existingFlag = await SafetyFlag.findOne({
            userId,
            flagType,
            status: 'active'
          });
          
          if (!existingFlag) {
            const safetyFlag = new SafetyFlag({
              userId,
              flagType,
              sourceMessageId: messageId,
              details: `Safety keyword detected: ${keywords.find(k => lowerText.includes(k))}`,
              severity: flagType === 'suicidal_ideation' ? 'critical' : 'high',
              confidence: 0.8,
              status: 'active'
            });
            
            await safetyFlag.save();
            
            logger.warn('Safety flag created', {
              userId,
              flagType,
              messageId,
              severity: safetyFlag.severity
            });
          }
        }
      }
      
      // Also check if wellness score indicates crisis
      if (aiResponse.wellnessScore < 20) {
        const existingCrisisFlag = await SafetyFlag.findOne({
          userId,
          flagType: 'crisis',
          status: 'active'
        });
        
        if (!existingCrisisFlag) {
          const crisisFlag = new SafetyFlag({
            userId,
            flagType: 'crisis',
            sourceMessageId: messageId,
            details: `Extremely low wellness score: ${aiResponse.wellnessScore}`,
            severity: 'critical',
            confidence: 0.9,
            status: 'active'
          });
          
          await crisisFlag.save();
          
          logger.warn('Crisis flag created due to low wellness score', {
            userId,
            messageId,
            wellnessScore: aiResponse.wellnessScore
          });
        }
      }
      
    } catch (error) {
      logger.error('Safety flag check error:', error);
      // Don't throw - safety flag creation shouldn't block message processing
    }
  }

  /**
   * Handle suggested actions from AI
   */
  async handleSuggestedAction(userId, action, wellnessScore) {
    try {
      const actionResult = {
        action,
        handled: false,
        details: null
      };
      
      switch (action) {
        case 'suggest_journal':
          actionResult.handled = true;
          actionResult.details = {
            message: 'Consider journaling about your feelings',
            prompt: 'Would you like to start a journal entry?'
          };
          break;
          
        case 'suggest_habit':
          actionResult.handled = true;
          actionResult.details = {
            message: 'A healthy habit might help improve your mood',
            suggestions: ['Take a 10-minute walk', 'Practice deep breathing', 'Listen to calming music']
          };
          break;
          
        case 'book_therapist':
          actionResult.handled = true;
          actionResult.details = {
            message: 'It might be helpful to speak with a professional',
            prompt: 'Would you like to book a session with a therapist?'
          };
          break;
          
        case 'emergency_intervention':
          actionResult.handled = true;
          actionResult.details = {
            message: 'I\'m concerned about your safety',
            resources: [
              'National Suicide Prevention Lifeline: 988',
              'Crisis Text Line: Text HOME to 741741',
              'Emergency Services: 911'
            ]
          };
          break;
          
        default:
          actionResult.handled = false;
          actionResult.details = { message: 'Continue conversation' };
      }
      
      return actionResult;
      
    } catch (error) {
      logger.error('Action handling error:', error);
      return {
        action,
        handled: false,
        details: { message: 'Action could not be processed' }
      };
    }
  }
}

module.exports = new MessageController();
