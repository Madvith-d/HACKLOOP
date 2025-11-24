const logger = require('../utils/logger');
const embeddings = require('../utils/embeddings');
const recommendations = require('./recommendations');
const db = require('../db');
const { createVectorStore } = require('../utils/vectorStore');
const therapistNotification = require('../utils/therapistNotification');
const gemini = require('../utils/gemini');

let vectorStore = null;

async function initVectorStore() {
  if (!vectorStore) {
    vectorStore = createVectorStore();
    if (vectorStore.initialize) {
      await vectorStore.initialize();
    }
  }
  return vectorStore;
}

async function analyzeEmotionNode(state) {
  logger.info('Node: Analyzing emotion with Gemini', { userId: state.userId });

  try {
    // Use Gemini for intelligent emotion analysis
    const emotionalAnalysis = await gemini.analyzeEmotion(state.userMessage);
    logger.debug('Emotional analysis from Gemini:', emotionalAnalysis);

    return {
      ...state,
      emotionalAnalysis
    };
  } catch (error) {
    logger.error('Error in emotion analysis node:', error);
    // Fallback to basic analysis if Gemini fails
    const emotionalAnalysis = {
      text: state.userMessage,
      timestamp: new Date().toISOString(),
      emotionScores: {
        sadness: extractEmotionScore(state.userMessage, 'sad|depressed|down|miserable'),
        anxiety: extractEmotionScore(state.userMessage, 'anxious|worried|nervous|stress'),
        anger: extractEmotionScore(state.userMessage, 'angry|mad|furious|irritated'),
        fear: extractEmotionScore(state.userMessage, 'scared|afraid|terrified|panic'),
        joy: extractEmotionScore(state.userMessage, 'happy|joyful|excited|great'),
        hopelessness: extractEmotionScore(state.userMessage, 'hopeless|helpless|worthless|useless')
      },
      sentiment: calculateSentiment(state.userMessage),
      keywords: extractKeywords(state.userMessage)
    };

    return {
      ...state,
      emotionalAnalysis
    };
  }
}

async function retrieveContextNode(state) {
  logger.info('Node: Retrieving context', { userId: state.userId });

  let userHistory = {
    journalEntries: [],
    habits: [],
    recentEmotions: [],
    pastSessions: []
  };

  try {
    // OPTIMIZATION: Run all database queries in parallel
    const [journals, habits, emotions] = await Promise.all([
      db.query(
        'SELECT id, title, content, mood, created_at FROM journals WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
        [state.userId]
      ).catch(err => {
        logger.error('Error fetching journals:', err);
        return { rows: [] };
      }),
      db.query(
        'SELECT id, name, frequency FROM habits WHERE user_id = $1 AND archived = false LIMIT 5',
        [state.userId]
      ).catch(err => {
        logger.error('Error fetching habits:', err);
        return { rows: [] };
      }),
      db.query(
        'SELECT emotion, confidence, timestamp FROM emotions WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 10',
        [state.userId]
      ).catch(err => {
        logger.error('Error fetching emotions:', err);
        return { rows: [] };
      })
    ]);

    userHistory.journalEntries = journals.rows;
    userHistory.habits = habits.rows;
    userHistory.recentEmotions = emotions.rows;
  } catch (error) {
    logger.error('Error retrieving user context:', error);
  }

  // OPTIMIZATION: Run vector search in parallel with database queries (moved to background)
  // We'll generate embeddings later in background, so no need to search now
  const contextualData = {
    similarVectorEntries: [],
    userHistory,
    contextRetrievedAt: new Date().toISOString()
  };

  logger.debug('Context retrieved:', {
    journalCount: userHistory.journalEntries.length,
    habitCount: userHistory.habits.length
  });

  return {
    ...state,
    contextualData
  };
}

async function generateEmbeddingNode(state) {
  logger.info('Node: Generating embedding', { userId: state.userId });

  const store = await initVectorStore();

  const embedding = await embeddings.generateEmbedding(state.userMessage);

  const vectorData = {
    embedding,
    content: state.userMessage,
    type: 'chat_message',
    timestamp: new Date().toISOString(),
    emotionScores: state.emotionalAnalysis?.emotionScores || {},
    sentiment: state.emotionalAnalysis?.sentiment || 0
  };

  const saved = store.saveVector(state.userId, vectorData);
  logger.debug('Embedding saved:', { userId: state.userId, saved });

  return {
    ...state,
    embeddings: vectorData
  };
}

async function recommendationNode(state) {
  logger.info('Node: Generating recommendation', { userId: state.userId });

  const recommendation = recommendations.analyzeEmotionalState(
    state.userMessage,
    state.emotionalAnalysis
  );

  logger.info('Recommendation generated:', {
    userId: state.userId,
    actions: recommendation.actions,
    priority: recommendation.priority
  });

  return {
    ...state,
    recommendation
  };
}

async function therapistAlertNode(state) {
  logger.info('Node: Processing therapist alert', { userId: state.userId });

  if (!state.recommendation?.actions?.includes('ALERT_THERAPIST')) {
    logger.debug('No therapist alert needed');
    return state;
  }

  try {
    await therapistNotification.notifyTherapist(
      state.userId,
      state.recommendation.alertType || 'URGENT_HELP_NEEDED',
      {
        message: state.userMessage,
        emotionalAnalysis: state.emotionalAnalysis,
        timestamp: new Date().toISOString()
      }
    );

    logger.info('Therapist alert sent');

    return {
      ...state,
      therapistAlert: true
    };
  } catch (error) {
    logger.error('Error sending therapist alert:', error);
    return state;
  }
}

async function responseGenerationNode(state) {
  logger.info('Node: Generating response with Gemini', { userId: state.userId });

  try {
    // Use Gemini for intelligent, empathetic response generation
    const response = await gemini.generateResponse(state);
    logger.debug('Response generated by Gemini');

    return {
      ...state,
      response
    };
  } catch (error) {
    logger.error('Error in response generation node:', error);
    // Fallback to rule-based response if Gemini fails
    const response = generateResponse(state);

    return {
      ...state,
      response
    };
  }
}

function extractEmotionScore(text, pattern) {
  const regex = new RegExp(pattern, 'gi');
  const matches = text.match(regex) || [];
  const score = Math.min(matches.length * 0.2, 1.0);
  return Math.round(score * 100) / 100;
}

function calculateSentiment(text) {
  const positiveWords = ['good', 'great', 'happy', 'love', 'wonderful', 'excellent', 'blessed'];
  const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'sad', 'depressed', 'useless'];

  let score = 0;
  const lowerText = text.toLowerCase();

  for (const word of positiveWords) {
    if (lowerText.includes(word)) score++;
  }
  for (const word of negativeWords) {
    if (lowerText.includes(word)) score--;
  }

  return Math.max(-1, Math.min(1, score / 10));
}

function extractKeywords(text) {
  const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !stopwords.has(w));
  return [...new Set(words)].slice(0, 10);
}

function generateResponse(state) {
  // This function is no longer used - Gemini handles all responses
  // Keeping for backward compatibility but should not be called
  return 'I\'m here to support you. How can I help?';
}

module.exports = {
  analyzeEmotionNode,
  retrieveContextNode,
  generateEmbeddingNode,
  recommendationNode,
  therapistAlertNode,
  responseGenerationNode
};
