const logger = require('../utils/logger');

class RecommendationEngine {
  analyzeEmotionalState(text, emotionalAnalysis) {
    const keywords = this.extractEmotionalKeywords(text);
    const sentiment = emotionalAnalysis?.sentiment || this.analyzeSentiment(text);

    // Default recommendation structure
    let recommendation = {
      actions: [], // Keep for backward compatibility if needed, or remove if fully migrating
      action: null, // New structured action
      priority: 'low',
      reasoning: ''
    };

    const emotionScores = emotionalAnalysis?.emotionScores || {};
    const sadness = emotionScores.sadness || 0;
    const anxiety = emotionScores.anxiety || 0;
    const anger = emotionScores.anger || 0;
    const fear = emotionScores.fear || 0;
    const hopelessness = emotionScores.hopelessness || 0;

    // PRIORITY 0: Conversational Intent Detection (check first!)
    const explicitIntent = this.detectExplicitIntent(text);
    if (explicitIntent) {
      logger.info('Explicit intent detected:', explicitIntent.type);
      return explicitIntent;
    }

    // Priority 1: Crisis Detection (Highest Priority)
    if (this.detectCrisisIndicators(text, emotionalAnalysis)) {
      recommendation.action = {
        type: 'alert_therapist',
        payload: {
          recommend: true,
          alertType: 'CRISIS',
          reason: 'Crisis indicators detected'
        }
      };
      recommendation.priority = 'critical';
      recommendation.reasoning = 'User showing crisis indicators, therapist alert issued';
      recommendation.actions.push('ALERT_THERAPIST'); // Backward compat

      if (keywords.length > 0) recommendation.keywords = keywords;
      return recommendation;
    }

    // Priority 2: High Distress -> Therapy Suggestion
    if (sadness > 0.8 || (anxiety > 0.7 && fear > 0.6) || hopelessness > 0.6) {
      recommendation.action = {
        type: 'suggest_therapy',
        payload: {
          reason: 'High emotional distress detected',
          specialization: anxiety > sadness ? 'anxiety' : 'depression'
        }
      };
      recommendation.priority = 'high';
      recommendation.reasoning = 'User showing severe emotional distress, therapy session recommended';
      recommendation.actions.push('SUGGEST_THERAPY'); // Backward compat

      if (keywords.length > 0) recommendation.keywords = keywords;
      return recommendation;
    }

    // Priority 3: Moderate Anxiety/Stress -> Habit Suggestion
    if (anxiety > 0.6 || fear > 0.5) {
      const habit = this.generateHabitSuggestion({ emotionScores });
      recommendation.action = {
        type: 'habit',
        payload: {
          habitName: habit.name,
          description: habit.description,
          frequency: habit.frequency,
          duration: '5-10 minutes'
        }
      };
      recommendation.priority = 'medium';
      recommendation.reasoning = 'User shows anxiety, building calming habits might help';
      recommendation.actions.push('SUGGEST_HABIT'); // Backward compat

      if (keywords.length > 0) recommendation.keywords = keywords;
      return recommendation;
    }

    // Priority 4: Sadness/Reflection -> Journal Suggestion
    if (sadness > 0.5 || sentiment < -0.5) {
      const prompt = this.generateJournalPrompt({ emotionScores });
      recommendation.action = {
        type: 'journal',
        payload: {
          prompt: prompt,
          category: 'Reflection'
        }
      };
      recommendation.priority = 'medium';
      recommendation.reasoning = 'User shows signs of sadness, journaling could help process emotions';
      recommendation.actions.push('SUGGEST_JOURNAL'); // Backward compat

      if (keywords.length > 0) recommendation.keywords = keywords;
      return recommendation;
    }

    // Default: No specific action, just chat
    if (keywords.length > 0) {
      recommendation.keywords = keywords;
    }

    return recommendation;
  }

  /**
   * Detect explicit user intents from conversational requests
   * e.g., "how do I journal?", "I want to talk to a therapist"
   */
  detectExplicitIntent(text) {
    const lowerText = text.toLowerCase();

    // Journal intent patterns
    const journalPatterns = [
      'journal', 'write', 'journaling', 'write down', 'write about',
      'start journaling', 'how to journal', 'help me write'
    ];

    for (const pattern of journalPatterns) {
      if (lowerText.includes(pattern)) {
        const prompt = this.generateJournalPrompt({});
        return {
          action: {
            type: 'open_journal',
            payload: {
              prompt: prompt,
              redirect: '/journal',
              category: 'User Initiated'
            }
          },
          actions: ['SUGGEST_JOURNAL'],
          priority: 'medium',
          reasoning: 'User explicitly requested journaling'
        };
      }
    }

    // Therapy intent patterns
    const therapyPatterns = [
      'therapist', 'therapy', 'counselor', 'counseling', 'talk to someone',
      'professional help', 'see a therapist', 'book a session', 'schedule therapy'
    ];

    for (const pattern of therapyPatterns) {
      if (lowerText.includes(pattern)) {
        return {
          action: {
            type: 'suggest_therapy',
            payload: {
              reason: 'User requested therapy',
              specialization: 'general',
              redirect: '/therapists'
            }
          },
          actions: ['SUGGEST_THERAPY'],
          priority: 'high',
          reasoning: 'User explicitly requested therapy'
        };
      }
    }

    // Habit/routine intent patterns
    const habitPatterns = [
      'habit', 'routine', 'build a habit', 'start a habit', 'exercise',
      'meditation', 'mindfulness', 'breathing', 'practice'
    ];

    for (const pattern of habitPatterns) {
      if (lowerText.includes(pattern)) {
        const habit = this.generateHabitSuggestion({});
        return {
          action: {
            type: 'suggest_habit',
            payload: {
              habitName: habit.name,
              description: habit.description,
              frequency: habit.frequency,
              duration: '5-10 minutes',
              redirect: '/habits'
            }
          },
          actions: ['SUGGEST_HABIT'],
          priority: 'medium',
          reasoning: 'User explicitly requested habit/routine guidance'
        };
      }
    }

    return null; // No explicit intent detected
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
