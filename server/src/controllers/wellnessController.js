const logger = require('../utils/logger');
const { WellnessScore, Message } = require('../models');
const langGraphService = require('../services/langGraphService');
const { asyncHandler } = require('../middleware/errorHandler');

class WellnessController {
  /**
   * Get user's wellness history
   * GET /api/wellness/:userId
   */
  getWellnessHistory = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user.userId;
    const { startDate, endDate, period = '30d' } = req.query;

    try {
      // Verify access (user can only access their own data, therapists can access patient data)
      if (userId !== currentUserId.toString() && req.user.role !== 'therapist' && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'You can only access your own wellness data'
        });
      }

      // Build date range
      let dateFilter = {};
      if (startDate && endDate) {
        dateFilter.timestamp = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      } else {
        // Use period if no specific dates provided
        const periodDays = this.getPeriodDays(period);
        const start = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
        dateFilter.timestamp = { $gte: start };
      }

      // Get wellness scores
      const wellnessScores = await WellnessScore.find({
        userId,
        ...dateFilter
      })
      .sort({ timestamp: 1 })
      .select('score components timestamp actionSuggested reasoning');

      // Calculate statistics
      const stats = this.calculateWellnessStats(wellnessScores);

      logger.info('Wellness history retrieved', {
        userId,
        period,
        scoresCount: wellnessScores.length,
        averageScore: stats.average
      });

      res.json({
        success: true,
        data: {
          wellnessScores: wellnessScores.map(score => ({
            id: score._id,
            score: score.score,
            components: score.components,
            timestamp: score.timestamp,
            actionSuggested: score.actionSuggested,
            reasoning: score.reasoning
          })),
          statistics: stats,
          period: {
            start: dateFilter.timestamp?.$gte || new Date(Date.now() - this.getPeriodDays(period) * 24 * 60 * 60 * 1000),
            end: dateFilter.timestamp?.$lte || new Date()
          }
        }
      });

    } catch (error) {
      logger.error('Get wellness history error:', error);
      throw error;
    }
  });

  /**
   * Get wellness trends analysis
   * GET /api/wellness/:userId/trends
   */
  getWellnessTrends = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user.userId;
    const { period = '30d' } = req.query;

    try {
      // Verify access
      if (userId !== currentUserId.toString() && req.user.role !== 'therapist' && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'You can only access your own wellness data'
        });
      }

      // Get wellness data for analysis
      const periodDays = this.getPeriodDays(period);
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
      
      const wellnessData = await WellnessScore.find({
        userId,
        timestamp: { $gte: startDate }
      })
      .sort({ timestamp: 1 })
      .select('score components timestamp actionSuggested');

      // Analyze trends using LangGraph service
      const trendAnalysis = await langGraphService.analyzeWellnessTrends(userId, wellnessData);

      // Calculate trend statistics
      const trends = this.calculateTrends(wellnessData);

      logger.info('Wellness trends analyzed', {
        userId,
        period,
        dataPoints: wellnessData.length,
        trend: trendAnalysis.trend
      });

      res.json({
        success: true,
        data: {
          trend: trendAnalysis.trend,
          riskLevel: trendAnalysis.riskLevel,
          insights: trendAnalysis.insights,
          recommendations: trendAnalysis.recommendations,
          alerts: trendAnalysis.alerts,
          statistics: trends,
          period: {
            start: startDate,
            end: new Date(),
            days: periodDays
          }
        }
      });

    } catch (error) {
      logger.error('Get wellness trends error:', error);
      throw error;
    }
  });

  /**
   * Get current wellness status
   * GET /api/wellness/:userId/current
   */
  getCurrentWellness = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    try {
      // Verify access
      if (userId !== currentUserId.toString() && req.user.role !== 'therapist' && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'You can only access your own wellness data'
        });
      }

      // Get most recent wellness score
      const latestScore = await WellnessScore.findOne({ userId })
        .sort({ timestamp: -1 })
        .select('score components timestamp actionSuggested reasoning');

      // Get recent trend (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentScores = await WellnessScore.find({
        userId,
        timestamp: { $gte: sevenDaysAgo }
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .select('score timestamp');

      // Calculate current status
      const currentStatus = this.calculateCurrentStatus(latestScore, recentScores);

      res.json({
        success: true,
        data: {
          current: latestScore ? {
            score: latestScore.score,
            components: latestScore.components,
            timestamp: latestScore.timestamp,
            actionSuggested: latestScore.actionSuggested,
            reasoning: latestScore.reasoning
          } : null,
          status: currentStatus,
          recentTrend: this.calculateRecentTrend(recentScores)
        }
      });

    } catch (error) {
      logger.error('Get current wellness error:', error);
      throw error;
    }
  });

  /**
   * Get wellness dashboard data
   * GET /api/wellness/:userId/dashboard
   */
  getWellnessDashboard = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    try {
      // Verify access
      if (userId !== currentUserId.toString() && req.user.role !== 'therapist' && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'You can only access your own wellness data'
        });
      }

      // Get data for different time periods
      const [weeklyData, monthlyData, recentScores] = await Promise.all([
        this.getWellnessDataForPeriod(userId, '7d'),
        this.getWellnessDataForPeriod(userId, '30d'),
        this.getWellnessDataForPeriod(userId, '7d', 5) // Last 5 scores
      ]);

      // Calculate dashboard metrics
      const dashboard = {
        current: recentScores.length > 0 ? recentScores[0] : null,
        weekly: this.calculatePeriodStats(weeklyData),
        monthly: this.calculatePeriodStats(monthlyData),
        trends: {
          weekly: this.calculateTrendDirection(weeklyData),
          monthly: this.calculateTrendDirection(monthlyData)
        },
        insights: this.generateDashboardInsights(weeklyData, monthlyData),
        recommendations: this.generateRecommendations(recentScores)
      };

      logger.info('Wellness dashboard generated', {
        userId,
        weeklyScores: weeklyData.length,
        monthlyScores: monthlyData.length
      });

      res.json({
        success: true,
        data: dashboard
      });

    } catch (error) {
      logger.error('Get wellness dashboard error:', error);
      throw error;
    }
  });

  /**
   * Helper: Get wellness data for a specific period
   */
  async getWellnessDataForPeriod(userId, period, limit = null) {
    const periodDays = this.getPeriodDays(period);
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
    
    let query = WellnessScore.find({
      userId,
      timestamp: { $gte: startDate }
    })
    .sort({ timestamp: -1 });

    if (limit) {
      query = query.limit(limit);
    }

    return query.select('score components timestamp actionSuggested');
  }

  /**
   * Helper: Calculate wellness statistics
   */
  calculateWellnessStats(scores) {
    if (scores.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        count: 0,
        trend: 'stable'
      };
    }

    const scoresArray = scores.map(s => s.score);
    const average = scoresArray.reduce((sum, score) => sum + score, 0) / scoresArray.length;
    const min = Math.min(...scoresArray);
    const max = Math.max(...scoresArray);

    // Calculate trend (comparing first half vs second half)
    const midPoint = Math.floor(scoresArray.length / 2);
    const firstHalf = scoresArray.slice(0, midPoint);
    const secondHalf = scoresArray.slice(midPoint);

    const firstHalfAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;

    let trend = 'stable';
    const difference = secondHalfAvg - firstHalfAvg;
    if (difference > 5) trend = 'improving';
    else if (difference < -5) trend = 'declining';

    return {
      average: Math.round(average * 100) / 100,
      min,
      max,
      count: scoresArray.length,
      trend
    };
  }

  /**
   * Helper: Calculate trend direction
   */
  calculateTrendDirection(scores) {
    if (scores.length < 2) return 'stable';

    const recent = scores.slice(0, 3).map(s => s.score);
    const older = scores.slice(-3).map(s => s.score);

    const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
    const olderAvg = older.reduce((sum, score) => sum + score, 0) / older.length;

    const difference = recentAvg - olderAvg;
    if (difference > 3) return 'improving';
    if (difference < -3) return 'declining';
    return 'stable';
  }

  /**
   * Helper: Calculate current status
   */
  calculateCurrentStatus(latestScore, recentScores) {
    if (!latestScore) {
      return {
        level: 'unknown',
        message: 'No wellness data available',
        color: 'gray'
      };
    }

    const score = latestScore.score;
    let level, message, color;

    if (score >= 80) {
      level = 'excellent';
      message = 'You\'re doing great!';
      color = 'green';
    } else if (score >= 60) {
      level = 'good';
      message = 'You\'re doing well';
      color = 'blue';
    } else if (score >= 40) {
      level = 'moderate';
      message = 'You might benefit from some support';
      color = 'yellow';
    } else if (score >= 20) {
      level = 'concerning';
      message = 'Consider reaching out for help';
      color = 'orange';
    } else {
      level = 'critical';
      message = 'Please seek immediate support';
      color = 'red';
    }

    return { level, message, color, score };
  }

  /**
   * Helper: Calculate recent trend
   */
  calculateRecentTrend(recentScores) {
    if (recentScores.length < 2) return 'stable';

    const trend = this.calculateTrendDirection(recentScores);
    const change = recentScores[0].score - recentScores[recentScores.length - 1].score;

    return {
      direction: trend,
      change: Math.round(change * 100) / 100,
      dataPoints: recentScores.length
    };
  }

  /**
   * Helper: Calculate period statistics
   */
  calculatePeriodStats(scores) {
    return {
      ...this.calculateWellnessStats(scores),
      dataPoints: scores.length,
      trend: this.calculateTrendDirection(scores)
    };
  }

  /**
   * Helper: Generate dashboard insights
   */
  generateDashboardInsights(weeklyData, monthlyData) {
    const insights = [];

    if (weeklyData.length > 0) {
      const weeklyAvg = weeklyData.reduce((sum, s) => sum + s.score, 0) / weeklyData.length;
      
      if (weeklyAvg < 40) {
        insights.push('Your wellness scores have been low this week. Consider reaching out for support.');
      } else if (weeklyAvg > 70) {
        insights.push('You\'ve been doing well this week! Keep up the good work.');
      }
    }

    if (monthlyData.length > 0) {
      const monthlyTrend = this.calculateTrendDirection(monthlyData);
      
      if (monthlyTrend === 'improving') {
        insights.push('Your wellness has been improving over the past month.');
      } else if (monthlyTrend === 'declining') {
        insights.push('Your wellness has been declining. Consider speaking with a professional.');
      }
    }

    return insights;
  }

  /**
   * Helper: Generate recommendations
   */
  generateRecommendations(recentScores) {
    const recommendations = [];

    if (recentScores.length === 0) {
      return ['Start tracking your wellness by having conversations with your AI companion.'];
    }

    const latestScore = recentScores[0];
    const avgScore = recentScores.reduce((sum, s) => sum + s.score, 0) / recentScores.length;

    if (avgScore < 40) {
      recommendations.push('Consider speaking with a mental health professional');
      recommendations.push('Try journaling to process your thoughts and feelings');
      recommendations.push('Practice mindfulness or meditation daily');
    } else if (avgScore < 60) {
      recommendations.push('Try incorporating daily exercise into your routine');
      recommendations.push('Maintain a regular sleep schedule');
      recommendations.push('Connect with friends and family regularly');
    } else {
      recommendations.push('Continue your current positive practices');
      recommendations.push('Consider helping others or volunteering');
    }

    return recommendations;
  }

  /**
   * Helper: Get period days from period string
   */
  getPeriodDays(period) {
    switch (period) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  }
}

module.exports = new WellnessController();
