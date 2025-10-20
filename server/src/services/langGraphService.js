const axios = require('axios');
const logger = require('../utils/logger');

class LangGraphService {
  constructor() {
    this.baseUrl = process.env.LANGGRAPH_URL || 'http://localhost:5000';
    this.timeout = 60000; // 60 seconds for AI processing
    this.maxRetries = 3;
    this.apiKey = process.env.LANGGRAPH_API_KEY;
  }

  /**
   * Send message to LangGraph agent and get response
   */
  async processMessage(messageData) {
    try {
      const {
        userId,
        conversationId,
        text,
        cvMetrics,
        audioMetrics,
        context,
        recentMessages,
        wellnessHistory
      } = messageData;

      if (!text || typeof text !== 'string') {
        throw new Error('Text is required and must be a string');
      }

      const requestPayload = {
        userId: userId.toString(),
        conversationId: conversationId?.toString(),
        message: {
          text: text.trim(),
          timestamp: new Date().toISOString()
        },
        context: {
          cvMetrics: cvMetrics || {},
          audioMetrics: audioMetrics || {},
          recentMessages: recentMessages || [],
          wellnessHistory: wellnessHistory || [],
          ...context
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/agent/respond`,
        requestPayload,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
          }
        }
      );

      if (!response.data) {
        throw new Error('Invalid response from LangGraph service');
      }

      const result = response.data;

      // Validate response structure
      if (!result.response || typeof result.response !== 'string') {
        throw new Error('Invalid response format from LangGraph service');
      }

      logger.debug('LangGraph response received', {
        userId,
        conversationId,
        responseLength: result.response.length,
        wellnessScore: result.wellnessScore,
        action: result.action
      });

      return {
        response: result.response,
        wellnessScore: result.wellnessScore || 50, // Default neutral score
        action: result.action || 'continue_conversation',
        confidence: result.confidence || 0.8,
        reasoning: result.reasoning || '',
        metadata: result.metadata || {}
      };

    } catch (error) {
      logger.error('LangGraph service error:', {
        error: error.message,
        userId: messageData.userId,
        conversationId: messageData.conversationId
      });

      // Return fallback response on error
      return this.getFallbackResponse(messageData.text, error);
    }
  }

  /**
   * Generate session summary
   */
  async generateSessionSummary(sessionData) {
    try {
      const {
        conversationId,
        messages,
        wellnessScores,
        duration,
        startTime,
        endTime
      } = sessionData;

      const requestPayload = {
        conversationId: conversationId.toString(),
        messages: messages.map(msg => ({
          role: msg.role,
          text: msg.text,
          timestamp: msg.timestamp,
          wellnessScore: msg.wellnessScore
        })),
        session: {
          duration,
          startTime,
          endTime,
          wellnessScores: wellnessScores || []
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/agent/summarize`,
        requestPayload,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
          }
        }
      );

      if (!response.data) {
        throw new Error('Invalid response from LangGraph service');
      }

      const result = response.data;

      logger.debug('Session summary generated', {
        conversationId,
        summaryLength: result.summary?.length || 0,
        keyInsights: result.keyInsights?.length || 0
      });

      return {
        summary: result.summary || '',
        keyInsights: result.keyInsights || [],
        recommendations: result.recommendations || [],
        moodTrend: result.moodTrend || 'neutral',
        topics: result.topics || [],
        wellnessTrend: result.wellnessTrend || 'stable'
      };

    } catch (error) {
      logger.error('Failed to generate session summary:', error);
      
      // Return basic summary on error
      return this.getFallbackSummary(sessionData);
    }
  }

  /**
   * Analyze wellness trends
   */
  async analyzeWellnessTrends(userId, wellnessData) {
    try {
      const requestPayload = {
        userId: userId.toString(),
        wellnessData: wellnessData.map(score => ({
          score: score.score,
          timestamp: score.timestamp,
          components: score.components || {},
          actionSuggested: score.actionSuggested
        }))
      };

      const response = await axios.post(
        `${this.baseUrl}/agent/analyze-wellness`,
        requestPayload,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
          }
        }
      );

      if (!response.data) {
        throw new Error('Invalid response from LangGraph service');
      }

      const result = response.data;

      logger.debug('Wellness analysis completed', {
        userId,
        dataPoints: wellnessData.length,
        trend: result.trend,
        riskLevel: result.riskLevel
      });

      return {
        trend: result.trend || 'stable',
        riskLevel: result.riskLevel || 'low',
        insights: result.insights || [],
        recommendations: result.recommendations || [],
        alerts: result.alerts || [],
        period: result.period || '30d'
      };

    } catch (error) {
      logger.error('Failed to analyze wellness trends:', error);
      
      return {
        trend: 'unknown',
        riskLevel: 'low',
        insights: ['Unable to analyze trends at this time'],
        recommendations: ['Continue monitoring wellness patterns'],
        alerts: [],
        period: '30d'
      };
    }
  }

  /**
   * Generate therapist report
   */
  async generateTherapistReport(patientData) {
    try {
      const {
        userId,
        period,
        conversations,
        wellnessScores,
        journals,
        habits
      } = patientData;

      const requestPayload = {
        userId: userId.toString(),
        period,
        data: {
          conversations: conversations || [],
          wellnessScores: wellnessScores || [],
          journals: journals || [],
          habits: habits || []
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/agent/therapist-report`,
        requestPayload,
        {
          timeout: this.timeout * 2, // Longer timeout for reports
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
          }
        }
      );

      if (!response.data) {
        throw new Error('Invalid response from LangGraph service');
      }

      const result = response.data;

      logger.debug('Therapist report generated', {
        userId,
        period,
        reportLength: result.report?.length || 0
      });

      return {
        report: result.report || '',
        summary: result.summary || {},
        recommendations: result.recommendations || [],
        riskFactors: result.riskFactors || [],
        progressAreas: result.progressAreas || [],
        nextSteps: result.nextSteps || []
      };

    } catch (error) {
      logger.error('Failed to generate therapist report:', error);
      
      return {
        report: 'Unable to generate report at this time',
        summary: {},
        recommendations: ['Continue monitoring patient progress'],
        riskFactors: [],
        progressAreas: [],
        nextSteps: ['Schedule follow-up session']
      };
    }
  }

  /**
   * Get fallback response when LangGraph service is unavailable
   */
  getFallbackResponse(text, error) {
    logger.warn('Using fallback response due to LangGraph service error:', error.message);

    // Simple keyword-based responses
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('sad') || lowerText.includes('depressed') || lowerText.includes('down')) {
      return {
        response: "I understand you're feeling down. Remember that it's okay to feel this way. Would you like to talk about what's bothering you, or would you prefer to try a calming activity?",
        wellnessScore: 30,
        action: 'suggest_journal',
        confidence: 0.6,
        reasoning: 'Fallback response for negative emotions',
        metadata: { fallback: true }
      };
    }
    
    if (lowerText.includes('anxious') || lowerText.includes('worried') || lowerText.includes('nervous')) {
      return {
        response: "I can sense you're feeling anxious. Let's try some breathing exercises together. Inhale slowly for 4 counts, hold for 4, and exhale for 4. Would you like to try this with me?",
        wellnessScore: 35,
        action: 'suggest_breathing',
        confidence: 0.6,
        reasoning: 'Fallback response for anxiety',
        metadata: { fallback: true }
      };
    }
    
    if (lowerText.includes('stressed') || lowerText.includes('overwhelmed')) {
      return {
        response: "It sounds like you're feeling stressed. Let's break this down into smaller, manageable steps. What's one small thing you can do right now to help yourself feel better?",
        wellnessScore: 40,
        action: 'suggest_habit',
        confidence: 0.6,
        reasoning: 'Fallback response for stress',
        metadata: { fallback: true }
      };
    }

    // Default empathetic response
    return {
      response: "Thank you for sharing that with me. I'm here to listen and support you. How are you feeling right now?",
      wellnessScore: 50,
      action: 'continue_conversation',
      confidence: 0.5,
      reasoning: 'Default fallback response',
      metadata: { fallback: true }
    };
  }

  /**
   * Get fallback summary when LangGraph service is unavailable
   */
  getFallbackSummary(sessionData) {
    const { messages, wellnessScores } = sessionData;
    
    const messageCount = messages.length;
    const avgWellnessScore = wellnessScores?.length > 0 
      ? wellnessScores.reduce((sum, score) => sum + score.score, 0) / wellnessScores.length 
      : 50;

    return {
      summary: `Session included ${messageCount} messages with an average wellness score of ${Math.round(avgWellnessScore)}. The conversation covered various topics and the user engaged actively.`,
      keyInsights: ['User engaged in conversation', 'Wellness monitoring active'],
      recommendations: ['Continue regular check-ins', 'Monitor wellness patterns'],
      moodTrend: avgWellnessScore > 60 ? 'positive' : avgWellnessScore < 40 ? 'negative' : 'neutral',
      topics: ['general conversation'],
      wellnessTrend: 'stable'
    };
  }

  /**
   * Health check for LangGraph service
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 10000,
        headers: {
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });

      return {
        status: 'healthy',
        ...response.data
      };
    } catch (error) {
      logger.error('LangGraph service health check failed:', error.message);
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Retry mechanism for failed requests
   */
  async withRetry(operation, maxRetries = this.maxRetries) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        logger.warn(`LangGraph service attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Process message with retry logic
   */
  async processMessageWithRetry(messageData) {
    return this.withRetry(async () => {
      return this.processMessage(messageData);
    });
  }
}

module.exports = new LangGraphService();
