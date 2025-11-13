const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const logger = require('./logger');

class GeminiService {
  constructor() {
    this.model = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GOOGLE_GEMINI_API_KEY environment variable is not set');
      }

      this.model = new ChatGoogleGenerativeAI({
        modelName: 'gemini-pro',
        temperature: 0.7,
        maxOutputTokens: 1024,
        apiKey: apiKey
      });

      this.initialized = true;
      logger.info('Gemini model initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Gemini model:', error);
      throw error;
    }
  }

  async analyzeEmotion(text) {
    await this.initialize();
    
    const systemPrompt = `You are an expert emotional analysis AI. Analyze the user's message and extract emotional information.
Return a JSON object with this exact structure:
{
  "emotionScores": {
    "sadness": 0.0-1.0,
    "anxiety": 0.0-1.0,
    "anger": 0.0-1.0,
    "fear": 0.0-1.0,
    "joy": 0.0-1.0,
    "hopelessness": 0.0-1.0
  },
  "sentiment": -1.0 to 1.0,
  "keywords": ["keyword1", "keyword2", ...]
}

Be accurate and empathetic. Only return valid JSON.`;

    try {
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(`Analyze this message: "${text}"`)
      ];

      const response = await this.model.invoke(messages);
      const content = response.content;
      
      // Extract JSON from response (handle markdown code blocks if present)
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      }
      
      const analysis = JSON.parse(jsonStr);
      
      // Ensure all emotion scores are numbers between 0 and 1
      Object.keys(analysis.emotionScores || {}).forEach(key => {
        analysis.emotionScores[key] = Math.max(0, Math.min(1, parseFloat(analysis.emotionScores[key]) || 0));
      });
      
      analysis.sentiment = Math.max(-1, Math.min(1, parseFloat(analysis.sentiment) || 0));
      
      return {
        ...analysis,
        timestamp: new Date().toISOString(),
        text
      };
    } catch (error) {
      logger.error('Error analyzing emotion with Gemini:', error);
      // Fallback to basic analysis
      return this.fallbackEmotionAnalysis(text);
    }
  }

  async generateResponse(state) {
    await this.initialize();
    
    const { userMessage, emotionalAnalysis, contextualData, recommendation } = state;
    
    const systemPrompt = `You are an empathetic mental health support AI assistant. Your role is to:
1. Listen actively and validate the user's feelings
2. Provide supportive, non-judgmental responses
3. Offer helpful suggestions based on their emotional state
4. Be warm, understanding, and encouraging

Guidelines:
- Never diagnose or provide medical advice
- Always encourage professional help for serious concerns
- Use a warm, conversational tone
- Keep responses concise (2-4 sentences)
- Show empathy and understanding`;

    let contextInfo = '';
    if (contextualData?.userHistory) {
      const history = contextualData.userHistory;
      contextInfo = `\n\nUser Context:
- Recent journal entries: ${history.journalEntries?.length || 0}
- Active habits: ${history.habits?.length || 0}
- Recent emotions tracked: ${history.recentEmotions?.length || 0}`;
    }

    let recommendationInfo = '';
    if (recommendation?.actions?.length > 0) {
      recommendationInfo = `\n\nRecommended Actions: ${recommendation.actions.join(', ')}\nReasoning: ${recommendation.reasoning || ''}`;
    }

    const userPrompt = `User message: "${userMessage}"${contextInfo}${recommendationInfo}

Generate a supportive, empathetic response. Be genuine and helpful.`;

    try {
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt)
      ];

      const response = await this.model.invoke(messages);
      return response.content.trim();
    } catch (error) {
      logger.error('Error generating response with Gemini:', error);
      return this.fallbackResponse(state);
    }
  }

  fallbackEmotionAnalysis(text) {
    // Basic fallback emotion analysis
    const lowerText = text.toLowerCase();
    const emotionScores = {
      sadness: extractEmotionScore(lowerText, ['sad', 'depressed', 'down', 'miserable', 'unhappy']),
      anxiety: extractEmotionScore(lowerText, ['anxious', 'worried', 'nervous', 'stress', 'stressed']),
      anger: extractEmotionScore(lowerText, ['angry', 'mad', 'furious', 'irritated', 'frustrated']),
      fear: extractEmotionScore(lowerText, ['scared', 'afraid', 'terrified', 'panic', 'fearful']),
      joy: extractEmotionScore(lowerText, ['happy', 'joyful', 'excited', 'great', 'wonderful']),
      hopelessness: extractEmotionScore(lowerText, ['hopeless', 'helpless', 'worthless', 'useless', 'despair'])
    };

    const positiveWords = ['good', 'great', 'happy', 'love', 'wonderful'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'sad', 'depressed'];
    let sentiment = 0;
    positiveWords.forEach(w => { if (lowerText.includes(w)) sentiment += 0.2; });
    negativeWords.forEach(w => { if (lowerText.includes(w)) sentiment -= 0.2; });
    sentiment = Math.max(-1, Math.min(1, sentiment));

    return {
      emotionScores,
      sentiment,
      keywords: extractKeywords(text),
      timestamp: new Date().toISOString(),
      text
    };
  }

  fallbackResponse(state) {
    const { recommendation } = state;
    
    if (recommendation?.actions?.includes('ALERT_THERAPIST')) {
      return '🚨 I notice you might be going through something very difficult. I\'ve alerted a therapist to check in with you. Please reach out if you need immediate support. Crisis resources are available 24/7.';
    } else if (recommendation?.actions?.includes('SUGGEST_THERAPY')) {
      return '💙 I can see you\'re dealing with some heavy emotions right now. A therapy session might really help you work through these feelings. Would you like me to help you book a session with one of our therapists?';
    } else {
      return '💭 Thank you for sharing. I\'m here to listen and support you. Whether you want to journal, work on a habit, or talk to a therapist, I\'m here to help.';
    }
  }
}

function extractEmotionScore(text, keywords) {
  let count = 0;
  keywords.forEach(keyword => {
    if (text.includes(keyword)) count++;
  });
  return Math.min(count * 0.2, 1.0);
}

function extractKeywords(text) {
  const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !stopwords.has(w));
  return [...new Set(words)].slice(0, 10);
}

module.exports = new GeminiService();

