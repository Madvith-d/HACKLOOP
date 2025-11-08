/**
 * Wellness Score Calculation Utility
 * Calculates wellness score from emotion analytics and user activity data
 */

/**
 * Calculate wellness score from emotion analytics
 * @param {Object} analytics - Emotion analytics data from API
 * @param {Array} recentEmotions - Recent emotion records
 * @param {Array} journalEntries - Recent journal entries
 * @param {Array} habits - User habits with completion data
 * @returns {Object} Wellness score data
 */
export function calculateWellnessScore(analytics = {}, recentEmotions = [], journalEntries = [], habits = []) {
    let score = 50; // Base score (neutral)
    
    // Factor 1: Recent Emotion Scores (40% weight)
    if (recentEmotions.length > 0) {
        const recentScores = recentEmotions.slice(0, 10); // Last 10 emotions
        let emotionScore = 0;
        let count = 0;
        
        recentScores.forEach(emotion => {
            const emotionData = typeof emotion.emotional_analysis === 'string' 
                ? JSON.parse(emotion.emotional_analysis) 
                : emotion.emotional_analysis;
            
            if (emotionData?.emotionScores) {
                const scores = emotionData.emotionScores;
                // Positive emotions increase score, negative decrease
                const positive = (scores.joy || 0) * 20;
                const negative = ((scores.sadness || 0) + (scores.anxiety || 0) + (scores.anger || 0) + (scores.fear || 0) + (scores.hopelessness || 0)) * 10;
                const sentiment = emotionData.sentiment || 0;
                
                emotionScore += positive - negative + (sentiment * 15);
                count++;
            }
        });
        
        if (count > 0) {
            const avgEmotionScore = emotionScore / count;
            score += avgEmotionScore * 0.4;
        }
    }
    
    // Factor 2: Emotion Analytics Trends (30% weight)
    if (analytics && Object.keys(analytics).length > 0) {
        // Check for positive trends in analytics
        if (analytics.averageSentiment) {
            score += analytics.averageSentiment * 15 * 0.3;
        }
        
        // Check emotion distribution
        if (analytics.emotionDistribution) {
            const positiveEmotions = (analytics.emotionDistribution.joy || 0) + 
                                    (analytics.emotionDistribution.calm || 0);
            const totalEmotions = Object.values(analytics.emotionDistribution).reduce((a, b) => a + b, 0);
            
            if (totalEmotions > 0) {
                const positiveRatio = positiveEmotions / totalEmotions;
                score += (positiveRatio - 0.5) * 20 * 0.3;
            }
        }
    }
    
    // Factor 3: Journal Activity (15% weight)
    const journalCount = journalEntries.length;
    const journalScore = Math.min(journalCount * 2, 15); // Max 15 points for journaling
    score += journalScore * 0.15;
    
    // Factor 4: Habit Completion (15% weight)
    if (habits.length > 0) {
        const activeHabits = habits.filter(h => !h.archived);
        if (activeHabits.length > 0) {
            // Calculate completion rate (simplified - would need actual completion data)
            const completionRate = activeHabits.reduce((sum, habit) => {
                // If habit has completion data, use it; otherwise assume 50%
                return sum + (habit.completionRate || 0.5);
            }, 0) / activeHabits.length;
            
            score += completionRate * 15 * 0.15;
        }
    }
    
    // Normalize score to 0-100 range
    score = Math.max(0, Math.min(100, score));
    
    // Determine wellness level
    let level = 'neutral';
    let color = '#667eea';
    
    if (score >= 80) {
        level = 'excellent';
        color = '#10b981'; // green
    } else if (score >= 65) {
        level = 'good';
        color = '#3b82f6'; // blue
    } else if (score >= 50) {
        level = 'fair';
        color = '#f59e0b'; // yellow
    } else if (score >= 35) {
        level = 'poor';
        color = '#ef4444'; // red
    } else {
        level = 'critical';
        color = '#dc2626'; // dark red
    }
    
    return {
        score: Math.round(score),
        level,
        color,
        scoreOutOf10: (score / 10).toFixed(1),
    };
}

/**
 * Calculate wellness trends over time
 * @param {Array} historicalData - Array of historical wellness data points
 * @returns {Object} Trend analysis
 */
export function calculateWellnessTrend(historicalData = []) {
    if (historicalData.length < 2) {
        return {
            trend: 'stable',
            change: 0,
            percentage: 0,
        };
    }
    
    const recent = historicalData.slice(-7); // Last 7 days
    const previous = historicalData.slice(-14, -7); // Previous 7 days
    
    const recentAvg = recent.reduce((sum, d) => sum + d.score, 0) / recent.length;
    const previousAvg = previous.length > 0 
        ? previous.reduce((sum, d) => sum + d.score, 0) / previous.length 
        : recentAvg;
    
    const change = recentAvg - previousAvg;
    const percentage = previousAvg > 0 ? (change / previousAvg) * 100 : 0;
    
    let trend = 'stable';
    if (change > 5) trend = 'improving';
    else if (change < -5) trend = 'declining';
    
    return {
        trend,
        change: Math.round(change),
        percentage: Math.round(percentage),
    };
}

/**
 * Get wellness insights based on score and trends
 * @param {Object} wellnessData - Current wellness data
 * @param {Object} trendData - Trend analysis
 * @returns {Array} Array of insight objects
 */
export function getWellnessInsights(wellnessData, trendData) {
    const insights = [];
    
    if (wellnessData.score < 50) {
        insights.push({
            type: 'warning',
            message: 'Your wellness score is below average. Consider speaking with a therapist or using our AI chat for support.',
            action: 'Get Support',
        });
    }
    
    if (trendData.trend === 'declining') {
        insights.push({
            type: 'alert',
            message: `Your wellness has declined by ${Math.abs(trendData.percentage)}% this week.`,
            action: 'View Analytics',
        });
    } else if (trendData.trend === 'improving') {
        insights.push({
            type: 'success',
            message: `Great progress! Your wellness has improved by ${trendData.percentage}% this week.`,
            action: 'Keep Going',
        });
    }
    
    if (wellnessData.score >= 80) {
        insights.push({
            type: 'success',
            message: 'Excellent! You\'re maintaining great mental wellness.',
            action: 'Continue',
        });
    }
    
    return insights;
}

export default {
    calculateWellnessScore,
    calculateWellnessTrend,
    getWellnessInsights,
};

