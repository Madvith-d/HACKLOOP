
const WELLNESS_THRESHOLDS = {
    CRITICAL: 4.0,
    LOW: 5.5,
    MODERATE: 7.0,
    GOOD: 8.5
};

const HABIT_CATEGORIES = {
    SLEEP: 'sleep',
    EXERCISE: 'exercise',
    MEDITATION: 'meditation',
    SOCIAL: 'social_connection',
    NUTRITION: 'nutrition'
};

/**
 * Calculate overall wellness score from mood and energy data
 * @param {Array} moodData - Array of mood records with mood and energy values
 * @param {Number} days - Number of days to analyze (default: 7)
 * @returns {Object} Wellness score and analysis
 */
export function calculateWellnessScore(moodData, days = 7) {
    if (!moodData || moodData.length === 0) {
        return { score: 7.0, trend: 'neutral', dataPoints: 0 };
    }
    const recentData = moodData.slice(-days);
    const avgMood = recentData.reduce((sum, d) => sum + (d.mood || 0), 0) / recentData.length;
    const avgEnergy = recentData.reduce((sum, d) => sum + (d.energy || 0), 0) / recentData.length;
    const score = (avgMood * 0.6 + avgEnergy * 0.4);
    const firstHalf = recentData.slice(0, Math.floor(recentData.length / 2));
    const secondHalf = recentData.slice(Math.floor(recentData.length / 2));
    
    const avgFirst = firstHalf.reduce((sum, d) => sum + (d.mood || 0), 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, d) => sum + (d.mood || 0), 0) / secondHalf.length;
    
    let trend = 'neutral';
    if (avgSecond > avgFirst + 0.5) trend = 'improving';
    else if (avgSecond < avgFirst - 0.5) trend = 'declining';
    
    return {
        score: parseFloat(score.toFixed(1)),
        trend,
        dataPoints: recentData.length,
        avgMood: parseFloat(avgMood.toFixed(1)),
        avgEnergy: parseFloat(avgEnergy.toFixed(1))
    };
}

/**
 * Generate AI recommendations based on wellness score
 * @param {Object} wellnessData - Wellness score object from calculateWellnessScore
 * @param {Array} emotionHistory - Recent emotion records
 * @returns {Array} Array of recommendation objects
 */
export function generateRecommendations(wellnessData, emotionHistory = []) {
    const { score, trend } = wellnessData;
    const recommendations = [];
    if (score < WELLNESS_THRESHOLDS.CRITICAL) {
        recommendations.push({
            priority: 'critical',
            type: 'doctor_appointment',
            title: 'Schedule a Professional Consultation',
            message: `Your wellness score (${score}/10) indicates you may benefit from professional support. Consider booking an appointment with a mental health professional.`,
            action: 'book_appointment',
            actionText: 'Book Appointment',
            actionLink: '/therapists',
            icon: 'AlertCircle',
            color: '#ef4444'
        });
        
        recommendations.push({
            priority: 'high',
            type: 'crisis_support',
            title: 'Immediate Support Available',
            message: 'If you need immediate support, our crisis resources are available 24/7.',
            action: 'crisis_support',
            actionText: 'Get Support Now',
            actionLink: '/crisis-support',
            icon: 'Heart',
            color: '#f59e0b'
        });
    }
    
    // LOW: Suggest journaling and habit tracking
    if (score < WELLNESS_THRESHOLDS.LOW) {
        recommendations.push({
            priority: 'high',
            type: 'journaling',
            title: 'Start Daily Journaling',
            message: 'Your wellness score suggests journaling could help. Writing about your thoughts and feelings can improve mood and reduce stress.',
            action: 'start_journal',
            actionText: 'Start Journal Entry',
            actionLink: '/journal',
            icon: 'BookOpen',
            color: '#8b5cf6',
            habitSuggestions: [
                { habit: 'Morning reflection', frequency: 'daily' },
                { habit: 'Gratitude journaling', frequency: 'daily' },
                { habit: 'Evening review', frequency: 'daily' }
            ]
        });
        
        recommendations.push({
            priority: 'high',
            type: 'habit_tracking',
            title: 'Track Wellness Habits',
            message: 'Building healthy habits can improve your wellness. Start tracking sleep, exercise, and mindfulness practices.',
            action: 'track_habits',
            actionText: 'Set Up Habits',
            actionLink: '/habits',
            icon: 'CheckSquare',
            color: '#06b6d4',
            suggestedHabits: [
                HABIT_CATEGORIES.SLEEP,
                HABIT_CATEGORIES.EXERCISE,
                HABIT_CATEGORIES.MEDITATION
            ]
        });
    }
    
    // MODERATE: Suggest lighter interventions
    if (score >= WELLNESS_THRESHOLDS.LOW && score < WELLNESS_THRESHOLDS.MODERATE) {
        recommendations.push({
            priority: 'medium',
            type: 'journaling',
            title: 'Consider Regular Journaling',
            message: 'Journaling can help you process emotions and maintain momentum in your wellness journey.',
            action: 'start_journal',
            actionText: 'Start Journal',
            actionLink: '/journal',
            icon: 'BookOpen',
            color: '#8b5cf6'
        });
        
        recommendations.push({
            priority: 'medium',
            type: 'habit_tracking',
            title: 'Maintain Healthy Habits',
            message: 'Keep track of your wellness habits to maintain and improve your mental health.',
            action: 'track_habits',
            actionText: 'View Habits',
            actionLink: '/habits',
            icon: 'TrendingUp',
            color: '#10b981'
        });
    }
    if (trend === 'declining' && score < WELLNESS_THRESHOLDS.MODERATE) {
        recommendations.push({
            priority: 'high',
            type: 'check_in',
            title: 'Your Wellness is Declining',
            message: 'We notice your wellness score is trending down. Consider reaching out to your therapist or using our AI chat for support.',
            action: 'ai_chat',
            actionText: 'Chat with AI',
            actionLink: '/chat',
            icon: 'MessageCircle',
            color: '#6366f1'
        });
    }
    
    // IMPROVING TREND: Positive reinforcement
    if (trend === 'improving') {
        recommendations.push({
            priority: 'low',
            type: 'encouragement',
            title: 'Great Progress!',
            message: `Your wellness is improving! Keep up with your current practices. Your score is ${score}/10.`,
            action: 'view_analytics',
            actionText: 'View Progress',
            actionLink: '/analytics',
            icon: 'Award',
            color: '#10b981'
        });
    }
    
    return recommendations.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}

/**
 * Analyze emotion patterns for specific insights
 * @param {Array} emotionHistory - Recent emotion records
 * @returns {Object} Pattern analysis
 */
export function analyzeEmotionPatterns(emotionHistory) {
    if (!emotionHistory || emotionHistory.length < 3) {
        return { patterns: [], insights: [] };
    }
    
    const emotionCounts = {};
    const timePatterns = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    
    emotionHistory.forEach(record => {
        const emotion = record.emotion || record.dominantEmotion;
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        if (record.timestamp) {
            const hour = new Date(record.timestamp).getHours();
            if (hour < 12) timePatterns.morning++;
            else if (hour < 17) timePatterns.afternoon++;
            else if (hour < 21) timePatterns.evening++;
            else timePatterns.night++;
        }
    });
    
    const dominantEmotion = Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])[0];
    
    const mostActiveTime = Object.entries(timePatterns)
        .sort((a, b) => b[1] - a[1])[0];
    
    return {
        patterns: [
            { type: 'dominant_emotion', value: dominantEmotion?.[0], count: dominantEmotion?.[1] },
            { type: 'most_active_time', value: mostActiveTime?.[0], count: mostActiveTime?.[1] }
        ],
        emotionCounts,
        timePatterns
    };
}

/**
 * Get personalized wellness tips based on score and patterns
 * @param {Object} wellnessData - Wellness score object
 * @param {Object} patterns - Emotion pattern analysis
 * @returns {Array} Personalized tips
 */
export function getPersonalizedTips(wellnessData, patterns) {
    const tips = [];
    const { score } = wellnessData;
    
    if (score < WELLNESS_THRESHOLDS.LOW) {
        tips.push('Practice deep breathing for 5 minutes when feeling overwhelmed');
        tips.push('Reach out to a friend or loved one today');
        tips.push('Take a short walk outside to boost mood and energy');
    }
    
    if (patterns.emotionCounts?.['anxious'] > 3) {
        tips.push('Try the 5-4-3-2-1 grounding technique for anxiety');
        tips.push('Limit caffeine intake, especially in the afternoon');
    }
    
    if (patterns.emotionCounts?.['sad'] > 3) {
        tips.push('Schedule activities that bring you joy');
        tips.push('Consider talking to someone you trust about how you feel');
    }
    
    if (patterns.timePatterns?.night > patterns.timePatterns?.morning) {
        tips.push('Consider checking in earlier in the day when energy is higher');
    }
    
    return tips.slice(0, 3);
}

export default {
    calculateWellnessScore,
    generateRecommendations,
    analyzeEmotionPatterns,
    getPersonalizedTips,
    WELLNESS_THRESHOLDS,
    HABIT_CATEGORIES
};
