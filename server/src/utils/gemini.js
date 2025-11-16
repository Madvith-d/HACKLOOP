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
    
    // Prevent multiple simultaneous initialization attempts
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        let apiKey = process.env.GOOGLE_GEMINI_API_KEY;
        if (!apiKey) {
          logger.warn('⚠️ GOOGLE_GEMINI_API_KEY not set, will use fallback responses');
          logger.warn('To use Gemini AI, set GOOGLE_GEMINI_API_KEY in your .env file');
          this.initialized = true;
          return;
        }

        // Remove quotes if present (common .env file issue)
        apiKey = apiKey.trim().replace(/^["']|["']$/g, '');

        logger.info('Initializing Gemini model...', { apiKeyLength: apiKey.length, apiKeyPrefix: apiKey.substring(0, 10) + '...' });
        this.model = new ChatGoogleGenerativeAI({
          modelName: 'gemini-pro',
          temperature: 0.7,
          maxOutputTokens: 1024, // Increased for better quality responses
          apiKey: apiKey
        });

        // Test the model with a simple call to verify it works
        // Add timeout to prevent hanging if API is unreachable
        try {
          const testMessage = [new SystemMessage('Hello')];
          const testTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Initialization test timeout after 5s')), 5000);
          });
          
          const testResult = await Promise.race([
            this.model.invoke(testMessage),
            testTimeout
          ]);
          
          if (testResult && testResult.content) {
            logger.info('✅ Gemini model initialized and tested successfully');
          } else {
            throw new Error('Test returned empty result');
          }
        } catch (testError) {
          logger.error('❌ Gemini model initialization test failed:', {
            error: testError.message,
            stack: testError.stack,
            name: testError.name
          });
          logger.warn('Will use fallback responses. Check your API key and network connection.');
          logger.warn('The system will still process messages with intelligent fallback responses.');
          this.model = null; // Clear model if test fails
        }

        this.initialized = true;
      } catch (error) {
        logger.error('❌ Failed to initialize Gemini model:', error.message);
        logger.error('Will use fallback responses instead');
        this.model = null;
        this.initialized = true; // Mark as initialized to use fallback
      }
    })();

    return this.initPromise;
  }

  async analyzeEmotion(text) {
    await this.initialize();
    
    // If no model available, use fallback immediately
    if (!this.model) {
      logger.info('No Gemini model available, using fallback emotion analysis');
      return this.fallbackEmotionAnalysis(text);
    }
    
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

      // Increased timeout to 10 seconds for more reliable responses
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve(null), 10000);
      });

      const analysisPromise = this.model.invoke(messages);
      const response = await Promise.race([analysisPromise, timeoutPromise]);
      
      // If timeout occurred, use fallback
      if (!response) {
        logger.warn('Emotion analysis timed out after 10s, using fallback');
        return this.fallbackEmotionAnalysis(text);
      }

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
    
    // If no model available, use fallback immediately
    if (!this.model) {
      logger.info('No Gemini model available, using intelligent fallback response', {
        hasEmotionalAnalysis: !!state.emotionalAnalysis,
        hasRecommendation: !!state.recommendation,
        userMessage: state.userMessage?.substring(0, 50)
      });
      return this.fallbackResponse(state);
    }

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

    // OPTIMIZATION: Reduce context information to minimize tokens
    let contextInfo = '';
    if (contextualData?.userHistory) {
      const history = contextualData.userHistory;
      const hasData = (history.journalEntries?.length || 0) > 0 || 
                      (history.habits?.length || 0) > 0 || 
                      (history.recentEmotions?.length || 0) > 0;
      if (hasData) {
        contextInfo = `\n\nUser has ${history.journalEntries?.length || 0} journals, ${history.habits?.length || 0} habits, ${history.recentEmotions?.length || 0} recent emotions.`;
      }
    }

    let recommendationInfo = '';
    if (recommendation?.actions?.length > 0) {
      recommendationInfo = `\n\nSuggested: ${recommendation.actions.join(', ')}`;
    }

    const userPrompt = `User: "${userMessage}"${contextInfo}${recommendationInfo}

Respond with empathy and support (2-4 sentences).`;

    try {
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt)
      ];

      // Increased timeout to 15 seconds for more reliable responses
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve(null), 15000);
      });

      const responsePromise = this.model.invoke(messages);
      const response = await Promise.race([responsePromise, timeoutPromise]);
      
      // If timeout occurred, use fallback
      if (!response) {
        logger.warn('Response generation timed out after 15s, using fallback');
        return this.fallbackResponse(state);
      }

      const responseText = response.content.trim();
      
      // Validate response is not empty
      if (!responseText || responseText.length === 0) {
        logger.warn('Gemini returned empty response, using fallback');
        return this.fallbackResponse(state);
      }

      logger.info('Gemini response generated successfully', { length: responseText.length });
      return responseText;
    } catch (error) {
      logger.error('Error generating response with Gemini:', {
        error: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 200)
      });
      logger.info('Falling back to intelligent response based on emotional analysis');
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
    const { recommendation, emotionalAnalysis, userMessage } = state;
    const lowerMessage = userMessage?.toLowerCase() || '';
    
    logger.info('Generating fallback response', {
      hasRecommendation: !!recommendation,
      recommendationActions: recommendation?.actions,
      hasEmotionalAnalysis: !!emotionalAnalysis,
      emotionScores: emotionalAnalysis?.emotionScores,
      messagePreview: userMessage?.substring(0, 50)
    });
    
    // Therapist alert cases
    if (recommendation?.actions?.includes('ALERT_THERAPIST')) {
      return '🚨 I notice you might be going through something very difficult. I\'ve alerted a therapist to check in with you. Please reach out if you need immediate support. Crisis resources are available 24/7.';
    } 
    
    // Suggest therapy for heavy emotions
    if (recommendation?.actions?.includes('SUGGEST_THERAPY')) {
      return '💙 I can see you\'re dealing with some heavy emotions right now. A therapy session might really help you work through these feelings. Would you like me to help you book a session with one of our therapists?';
    }
    
    // Suggest journaling
    if (recommendation?.actions?.includes('SUGGEST_JOURNAL')) {
      return '📝 It sounds like you have a lot on your mind. Writing in your journal might help you process these feelings. Sometimes putting our thoughts on paper can bring clarity. Would you like to open your journal?';
    }
    
    // Suggest habits
    if (recommendation?.actions?.includes('SUGGEST_HABIT')) {
      return '🌱 Building positive habits can really help with managing these feelings. Have you considered starting a mindfulness or exercise routine? I can help you track habits that support your wellbeing.';
    }
    
    // Context-aware responses based on emotional analysis
    if (emotionalAnalysis?.emotionScores) {
      const emotions = emotionalAnalysis.emotionScores;
      
      if (emotions.anxiety > 0.5 || lowerMessage.includes('anxious') || lowerMessage.includes('anxiety') || lowerMessage.includes('worried')) {
        return '💙 I understand that anxiety can feel overwhelming. Let\'s take a moment together - try taking a slow, deep breath. Remember, these feelings are temporary, and you\'re not alone in this. What helps you feel most grounded?';
      }
      
      if (emotions.sadness > 0.5 || lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down')) {
        return '💜 I hear you, and your feelings are completely valid. It\'s okay to feel sad sometimes. I\'m here with you. Is there something specific weighing on your mind that you\'d like to talk about?';
      }
      
      if (emotions.anger > 0.5 || lowerMessage.includes('angry') || lowerMessage.includes('frustrated') || lowerMessage.includes('mad')) {
        return '🧡 It sounds like you\'re feeling frustrated, and that\'s understandable. Anger often tells us something important. Would you like to talk about what\'s bothering you? Sometimes expressing it can help.';
      }
      
      if (emotions.fear > 0.5 || lowerMessage.includes('scared') || lowerMessage.includes('afraid') || lowerMessage.includes('fear')) {
        return '💚 Fear can be really difficult to sit with. You\'re brave for acknowledging it. Remember that you\'re safe right now. Can you tell me more about what\'s making you feel this way?';
      }
      
      if (emotions.joy > 0.5 || lowerMessage.includes('happy') || lowerMessage.includes('good') || lowerMessage.includes('great')) {
        return '✨ That\'s wonderful to hear! I\'m so glad you\'re feeling good. What\'s been bringing you joy lately? Celebrating the good moments is so important.';
      }
      
      if (emotions.hopelessness > 0.5 || lowerMessage.includes('hopeless') || lowerMessage.includes('worthless')) {
        return '💛 I\'m really glad you reached out. When we feel hopeless, it can seem like things won\'t get better - but they can and do. You matter, and your feelings are important. Let\'s work through this together. Have you talked to a therapist about these feelings?';
      }
    }
    
    // Generic but warm fallback
    return '💭 Thank you for sharing that with me. I\'m here to listen and support you. Your feelings are valid, and it takes courage to express them. How else can I help you today?';
  }
}

function extractEmotionScore(text, keywords) {
  let count = 0;
  let maxScore = 0;
  keywords.forEach(keyword => {
    if (text.includes(keyword)) {
      count++;
      // If a strong keyword is found, give it a higher base score
      if (keyword.length > 5 || ['depressed', 'anxious', 'furious', 'terrified', 'hopeless'].includes(keyword)) {
        maxScore = Math.max(maxScore, 0.6);
      }
    }
  });
  // Use the higher of: keyword count score or strong keyword base score
  return Math.max(Math.min(count * 0.3, 1.0), maxScore);
}

function extractKeywords(text) {
  const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !stopwords.has(w));
  return [...new Set(words)].slice(0, 10);
}

module.exports = new GeminiService();




