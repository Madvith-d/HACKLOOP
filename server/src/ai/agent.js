const logger = require('../utils/logger');
const AgentState = require('./state');
const {
  analyzeEmotionNode,
  retrieveContextNode,
  generateEmbeddingNode,
  recommendationNode,
  therapistAlertNode,
  responseGenerationNode
} = require('./nodes');

class EmpatheticChatAgent {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    logger.info('Initializing empathetic chat agent');
    this.initialized = true;
  }

  async processMessage(userId, message) {
    await this.initialize();
    
    logger.info('Processing message for user:', { userId, messageLength: message.length });

    let state = new AgentState({
      userId,
      userMessage: message,
      messages: []
    });

    try {
      // OPTIMIZATION: Run emotion analysis and context retrieval in parallel
      const [emotionState, contextState] = await Promise.all([
        analyzeEmotionNode(state),
        retrieveContextNode(state)
      ]);

      // Merge the results
      state = {
        ...state,
        emotionalAnalysis: emotionState.emotionalAnalysis,
        contextualData: contextState.contextualData
      };

      // Generate recommendation based on emotional analysis
      state = await recommendationNode(state);
      
      // Check for therapist alerts (fast operation)
      state = await therapistAlertNode(state);
      
      // Generate response using Gemini
      state = await responseGenerationNode(state);

      // OPTIMIZATION: Generate embeddings in background (non-blocking)
      // This doesn't need to delay the response to the user
      generateEmbeddingNode(state).catch(err => 
        logger.error('Background embedding generation failed:', err)
      );

      logger.info('Message processing completed successfully', {
        userId,
        recommendation: state.recommendation?.actions
      });

      return {
        response: state.response,
        recommendation: state.recommendation,
        emotionalAnalysis: state.emotionalAnalysis,
        context: state.contextualData,
        therapistAlert: state.therapistAlert
      };
    } catch (error) {
      logger.error('Error processing message:', error);
      return {
        response: 'I\'m here to support you. If you\'re in crisis, please reach out to emergency services or a crisis hotline.',
        recommendation: null,
        emotionalAnalysis: null,
        error: error.message
      };
    }
  }

  async streamMessage(userId, message, onChunk) {
    const result = await this.processMessage(userId, message);
    
    if (onChunk) {
      onChunk({
        type: 'thinking',
        data: `Analyzing your message...`
      });

      if (result.emotionalAnalysis) {
        onChunk({
          type: 'analysis',
          data: result.emotionalAnalysis
        });
      }

      if (result.context?.userHistory) {
        onChunk({
          type: 'context',
          data: result.context.userHistory
        });
      }

      if (result.recommendation) {
        onChunk({
          type: 'recommendation',
          data: result.recommendation
        });
      }

      onChunk({
        type: 'response',
        data: result.response
      });
    }

    return result;
  }

  getAgentDescription() {
    return {
      name: 'Empathetic Chat Agent',
      version: '2.0.0',
      description: 'An AI agent powered by Google Gemini and LangGraph that listens to users and provides personalized mental health support',
      aiModel: 'Google Gemini Pro',
      embeddingModel: 'Xenova/all-MiniLM-L6-v2 (local)',
      capabilities: [
        'AI-powered emotional analysis using Gemini',
        'Intelligent response generation with Gemini',
        'Context retrieval from user history',
        'Local vector embeddings for semantic search',
        'Personalized recommendations',
        'Therapist alerts for crisis situations'
      ],
      supportedActions: [
        'SUGGEST_JOURNAL',
        'SUGGEST_HABIT',
        'SUGGEST_THERAPY',
        'ALERT_THERAPIST'
      ]
    };
  }
}

module.exports = new EmpatheticChatAgent();
