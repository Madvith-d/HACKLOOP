const logger = require('../utils/logger');
const embeddings = require('../utils/embeddings');
const recommendations = require('./recommendations');
const db = require('../db');
const { createVectorStore } = require('../utils/vectorStore');
const therapistNotification = require('../utils/therapistNotification');

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
  logger.info('Node: Analyzing emotion', { userId: state.userId });
  
  const text = state.userMessage;
  
  const emotionalAnalysis = {
    text,
    timestamp: new Date().toISOString(),
    emotionScores: {
      sadness: extractEmotionScore(text, 'sad|depressed|down|miserable'),
      anxiety: extractEmotionScore(text, 'anxious|worried|nervous|stress'),
      anger: extractEmotionScore(text, 'angry|mad|furious|irritated'),
      fear: extractEmotionScore(text, 'scared|afraid|terrified|panic'),
      joy: extractEmotionScore(text, 'happy|joyful|excited|great'),
      hopelessness: extractEmotionScore(text, 'hopeless|helpless|worthless|useless')
    },
    sentiment: calculateSentiment(text),
    keywords: extractKeywords(text)
  };

  logger.debug('Emotional analysis:', emotionalAnalysis);

  return {
    ...state,
    emotionalAnalysis
  };
}

async function retrieveContextNode(state) {
  logger.info('Node: Retrieving context', { userId: state.userId });
  
  const store = await initVectorStore();
  
  const messageEmbedding = await embeddings.generateEmbedding(state.userMessage);
  
  const similarEntries = store.searchSimilar(state.userId, messageEmbedding, 5);
  
  let userHistory = {
    journalEntries: [],
    habits: [],
    recentEmotions: [],
    pastSessions: []
  };

  try {
    const journals = await db.query(
      'SELECT id, title, content, mood, created_at FROM journals WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [state.userId]
    );
    userHistory.journalEntries = journals.rows;

    const habits = await db.query(
      'SELECT id, name, frequency FROM habits WHERE user_id = $1 AND archived = false LIMIT 5',
      [state.userId]
    );
    userHistory.habits = habits.rows;

    const emotions = await db.query(
      'SELECT emotion, confidence, timestamp FROM emotions WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 10',
      [state.userId]
    );
    userHistory.recentEmotions = emotions.rows;
  } catch (error) {
    logger.error('Error retrieving user context:', error);
  }

  const contextualData = {
    similarVectorEntries: similarEntries,
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
  logger.info('Node: Generating response', { userId: state.userId });
  
  const response = generateResponse(state);

  return {
    ...state,
    response
  };
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
  const { recommendation, emotionalAnalysis } = state;
  let response = '';

  if (recommendation?.actions?.includes('ALERT_THERAPIST')) {
    response = '🚨 I notice you might be going through something very difficult. I\'ve alerted a therapist to check in with you. Please reach out if you need immediate support. Crisis resources are available 24/7.';
  } else if (recommendation?.actions?.includes('SUGGEST_THERAPY')) {
    response = '💙 I can see you\'re dealing with some heavy emotions right now. A therapy session might really help you work through these feelings. Would you like me to help you book a session with one of our therapists?';
  } else if (recommendation?.actions?.includes('SUGGEST_JOURNAL')) {
    const prompt = recommendations.generateJournalPrompt(emotionalAnalysis);
    response = `📝 It sounds like you have a lot on your mind. Writing about your feelings might help you process them. Here\'s a prompt to get started: "${prompt}"`;
  } else if (recommendation?.actions?.includes('SUGGEST_HABIT')) {
    const habit = recommendations.generateHabitSuggestion(emotionalAnalysis);
    response = `🌱 To help manage these feelings, I suggest starting a habit: ${habit.name}. ${habit.description}. Would you like me to create this habit for you?`;
  } else {
    response = '💭 Thank you for sharing. I\'m here to listen. Whether you want to journal, work on a habit, or talk to a therapist, I\'m here to support you.';
  }

  return response;
}

module.exports = {
  analyzeEmotionNode,
  retrieveContextNode,
  generateEmbeddingNode,
  recommendationNode,
  therapistAlertNode,
  responseGenerationNode
};
