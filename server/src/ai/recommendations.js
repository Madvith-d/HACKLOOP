const logger = require('../utils/logger');

class RecommendationEngine {
  analyzeEmotionalState(text, emotionalAnalysis) {
    const keywords = this.extractEmotionalKeywords(text);
    const sentiment = emotionalAnalysis?.sentiment || this.analyzeSentiment(text);
    
    let recommendation = {
      actions: [],
      priority: 'low',
      reasoning: ''
    };

    const emotionScores = emotionalAnalysis?.emotionScores || {};
    const sadness = emotionScores.sadness || 0;
    const anxiety = emotionScores.anxiety || 0;
    const anger = emotionScores.anger || 0;
    const fear = emotionScores.fear || 0;

    if (sadness > 0.7 || sentiment < -0.7) {
      recommendation.actions.push('SUGGEST_JOURNAL');
      recommendation.reasoning = 'User shows signs of sadness, journaling could help process emotions';
    }

    if (anxiety > 0.6) {
      recommendation.actions.push('SUGGEST_HABIT');
      recommendation.reasoning = 'User shows anxiety, building calming habits might help';
    }

    if (this.detectCrisisIndicators(text, emotionalAnalysis)) {
      recommendation.actions.push('ALERT_THERAPIST');
      recommendation.priority = 'critical';
      recommendation.reasoning = 'User showing crisis indicators, therapist alert issued';
      recommendation.alertType = 'CRISIS';
    } else if (sadness > 0.8 || (anxiety > 0.7 && fear > 0.6)) {
      recommendation.actions.push('SUGGEST_THERAPY');
      recommendation.priority = 'high';
      recommendation.reasoning = 'User showing severe emotional distress, therapy session recommended';
    } else if (anxiety > 0.6 || sadness > 0.6) {
      recommendation.actions.push('SUGGEST_THERAPY');
      recommendation.priority = 'medium';
      recommendation.reasoning = 'User could benefit from professional support';
    }

    if (keywords.length > 0) {
      recommendation.keywords = keywords;
    }

    return recommendation;
  }

  extractEmotionalKeywords(text) {
    const emotionalKeywords = [
      'sad', 'depressed', 'anxious', 'worried', 'stressed', 'angry', 'frustrated',
      'lonely', 'hurt', 'scared', 'afraid', 'overwhelmed', 'helpless', 'hopeless',
      'suicidal', 'death', 'harm', 'pain', 'suffering', 'crisis', 'emergency'
    ];

    const lowerText = text.toLowerCase();
    return emotionalKeywords.filter(keyword => 
      lowerText.includes(keyword)
    );
  }

  analyzeSentiment(text) {
    const positiveWords = [
      'good', 'great', 'happy', 'love', 'wonderful', 'amazing', 'fantastic',
      'excellent', 'best', 'perfect', 'brilliant', 'joyful', 'blessed', 'grateful'
    ];
    
    const negativeWords = [
      'bad', 'terrible', 'hate', 'awful', 'horrible', 'worst', 'disgusting',
      'sad', 'depressed', 'anxious', 'scared', 'hurt', 'pain', 'suffering',
      'fail', 'failed', 'useless', 'worthless', 'stupid', 'idiotic'
    ];

    const lowerText = text.toLowerCase();
    let score = 0;

    for (const word of positiveWords) {
      if (lowerText.includes(word)) score += 1;
    }

    for (const word of negativeWords) {
      if (lowerText.includes(word)) score -= 2;
    }

    return score / (positiveWords.length + negativeWords.length);
  }

  detectCrisisIndicators(text, emotionalAnalysis) {
    const crisisKeywords = [
      'suicide', 'suicidal', 'kill myself', 'end my life', 'overdose',
      'self harm', 'self-harm', 'cut myself', 'harm myself', 'die',
      'death', 'gone', 'better off dead', 'no point in living'
    ];

    const lowerText = text.toLowerCase();
    
    for (const keyword of crisisKeywords) {
      if (lowerText.includes(keyword)) {
        logger.warn('Crisis indicator detected:', keyword);
        return true;
      }
    }

    const emotionScores = emotionalAnalysis?.emotionScores || {};
    if ((emotionScores.sadness || 0) > 0.85 && (emotionScores.hopelessness || 0) > 0.75) {
      logger.warn('Crisis indicator: extreme sadness and hopelessness detected');
      return true;
    }

    return false;
  }

  generateJournalPrompt(analysis) {
    const emotions = analysis.emotionScores || {};
    const prompts = [
      'How are you feeling right now? What triggered these emotions?',
      'What would help you feel better today?',
      'What are you grateful for, even if things feel hard?',
      'What do you need from yourself or others right now?',
      'What patterns do you notice in your feelings?'
    ];

    return prompts[Math.floor(Math.random() * prompts.length)];
  }

  generateHabitSuggestion(analysis) {
    const emotions = analysis.emotionScores || {};
    const suggestions = [
      {
        name: 'Morning Meditation',
        description: 'Start your day with 5-10 minutes of mindfulness',
        frequency: 'daily'
      },
      {
        name: 'Evening Walk',
        description: 'Take a short walk to clear your mind',
        frequency: 'daily'
      },
      {
        name: 'Gratitude Journal',
        description: 'Write down 3 things you are grateful for',
        frequency: 'daily'
      },
      {
        name: 'Deep Breathing',
        description: 'Practice deep breathing exercises when stressed',
        frequency: 'daily'
      },
      {
        name: 'Yoga Session',
        description: 'Gentle yoga for relaxation and flexibility',
        frequency: 'every_other_day'
      }
    ];

    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  getSuggestedTherapists(specialization) {
    const specializations = {
      'anxiety': 'Anxiety & Stress Management',
      'depression': 'Depression & Mood Disorders',
      'trauma': 'Trauma & PTSD',
      'relationship': 'Relationship Counseling',
      'general': 'General Mental Health'
    };

    return specializations[specialization] || specializations['general'];
  }
}

module.exports = new RecommendationEngine();
