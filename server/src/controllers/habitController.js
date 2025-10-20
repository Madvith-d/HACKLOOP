const logger = require('../utils/logger');
const { Habit } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');

class HabitController {
  /**
   * Create a new habit
   * POST /api/habits
   */
  createHabit = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { title, description, frequency, target, category, reminderTime } = req.body;

    try {
      // Create habit
      const habit = new Habit({
        userId,
        title: title.trim(),
        description: description?.trim() || '',
        frequency,
        target,
        category: category || 'general',
        reminderTime,
        progress: [],
        isActive: true,
        createdAt: new Date()
      });

      await habit.save();

      logger.info('Habit created', {
        habitId: habit._id,
        userId,
        title: habit.title,
        frequency: habit.frequency
      });

      res.status(201).json({
        success: true,
        message: 'Habit created successfully',
        data: {
          habit: {
            id: habit._id,
            title: habit.title,
            description: habit.description,
            frequency: habit.frequency,
            target: habit.target,
            category: habit.category,
            reminderTime: habit.reminderTime,
            isActive: habit.isActive,
            createdAt: habit.createdAt
          }
        }
      });

    } catch (error) {
      logger.error('Habit creation error:', error);
      throw error;
    }
  });

  /**
   * Get user's habits
   * GET /api/habits
   */
  getHabits = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { 
      page = 1, 
      limit = 10, 
      category, 
      isActive,
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    try {
      // Build query
      const query = { userId };
      
      if (category) {
        query.category = category;
      }
      
      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      // Get habits with pagination
      const habits = await Habit.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count
      const total = await Habit.countDocuments(query);

      // Calculate progress statistics for each habit
      const habitsWithStats = habits.map(habit => {
        const stats = this.calculateHabitStats(habit);
        return {
          id: habit._id,
          title: habit.title,
          description: habit.description,
          frequency: habit.frequency,
          target: habit.target,
          category: habit.category,
          reminderTime: habit.reminderTime,
          isActive: habit.isActive,
          createdAt: habit.createdAt,
          updatedAt: habit.updatedAt,
          statistics: stats
        };
      });

      logger.info('Habits retrieved', {
        userId,
        count: habits.length,
        category: category || 'all'
      });

      res.json({
        success: true,
        data: {
          habits: habitsWithStats,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Get habits error:', error);
      throw error;
    }
  });

  /**
   * Get specific habit
   * GET /api/habits/:id
   */
  getHabit = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const habit = await Habit.findOne({ _id: id, userId });

      if (!habit) {
        return res.status(404).json({
          error: 'HABIT_NOT_FOUND',
          message: 'Habit not found'
        });
      }

      const stats = this.calculateHabitStats(habit);

      res.json({
        success: true,
        data: {
          habit: {
            id: habit._id,
            title: habit.title,
            description: habit.description,
            frequency: habit.frequency,
            target: habit.target,
            category: habit.category,
            reminderTime: habit.reminderTime,
            isActive: habit.isActive,
            progress: habit.progress,
            createdAt: habit.createdAt,
            updatedAt: habit.updatedAt,
            statistics: stats
          }
        }
      });

    } catch (error) {
      logger.error('Get habit error:', error);
      throw error;
    }
  });

  /**
   * Update habit
   * PUT /api/habits/:id
   */
  updateHabit = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const { title, description, frequency, target, category, reminderTime, isActive } = req.body;

    try {
      const habit = await Habit.findOne({ _id: id, userId });

      if (!habit) {
        return res.status(404).json({
          error: 'HABIT_NOT_FOUND',
          message: 'Habit not found'
        });
      }

      // Update fields
      if (title !== undefined) habit.title = title.trim();
      if (description !== undefined) habit.description = description?.trim() || '';
      if (frequency !== undefined) habit.frequency = frequency;
      if (target !== undefined) habit.target = target;
      if (category !== undefined) habit.category = category;
      if (reminderTime !== undefined) habit.reminderTime = reminderTime;
      if (isActive !== undefined) habit.isActive = isActive;

      habit.updatedAt = new Date();
      await habit.save();

      logger.info('Habit updated', {
        habitId: habit._id,
        userId
      });

      res.json({
        success: true,
        message: 'Habit updated successfully',
        data: {
          habit: {
            id: habit._id,
            title: habit.title,
            description: habit.description,
            frequency: habit.frequency,
            target: habit.target,
            category: habit.category,
            reminderTime: habit.reminderTime,
            isActive: habit.isActive,
            updatedAt: habit.updatedAt
          }
        }
      });

    } catch (error) {
      logger.error('Update habit error:', error);
      throw error;
    }
  });

  /**
   * Log habit progress
   * POST /api/habits/:id/progress
   */
  logProgress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const { value, date, notes } = req.body;

    try {
      const habit = await Habit.findOne({ _id: id, userId });

      if (!habit) {
        return res.status(404).json({
          error: 'HABIT_NOT_FOUND',
          message: 'Habit not found'
        });
      }

      const progressDate = date ? new Date(date) : new Date();
      
      // Check if progress already exists for this date
      const existingProgressIndex = habit.progress.findIndex(
        p => p.date.toDateString() === progressDate.toDateString()
      );

      const progressEntry = {
        date: progressDate,
        value: Math.max(0, value), // Ensure non-negative
        notes: notes?.trim() || ''
      };

      if (existingProgressIndex >= 0) {
        // Update existing progress
        habit.progress[existingProgressIndex] = progressEntry;
      } else {
        // Add new progress
        habit.progress.push(progressEntry);
      }

      // Sort progress by date
      habit.progress.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      habit.updatedAt = new Date();
      await habit.save();

      logger.info('Habit progress logged', {
        habitId: habit._id,
        userId,
        value,
        date: progressDate
      });

      res.json({
        success: true,
        message: 'Progress logged successfully',
        data: {
          progress: progressEntry,
          habitId: habit._id
        }
      });

    } catch (error) {
      logger.error('Log habit progress error:', error);
      throw error;
    }
  });

  /**
   * Delete habit
   * DELETE /api/habits/:id
   */
  deleteHabit = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const habit = await Habit.findOne({ _id: id, userId });

      if (!habit) {
        return res.status(404).json({
          error: 'HABIT_NOT_FOUND',
          message: 'Habit not found'
        });
      }

      await Habit.findByIdAndDelete(id);

      logger.info('Habit deleted', {
        habitId: habit._id,
        userId
      });

      res.json({
        success: true,
        message: 'Habit deleted successfully'
      });

    } catch (error) {
      logger.error('Delete habit error:', error);
      throw error;
    }
  });

  /**
   * Get habit statistics
   * GET /api/habits/stats
   */
  getHabitStats = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    try {
      const totalHabits = await Habit.countDocuments({ userId });
      const activeHabits = await Habit.countDocuments({ userId, isActive: true });
      
      // Get habits by category
      const categoryStats = await Habit.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            activeCount: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            }
          }
        },
        { $sort: { count: -1 } }
      ]);

      // Get completion rates
      const habits = await Habit.find({ userId });
      const completionStats = habits.map(habit => {
        const stats = this.calculateHabitStats(habit);
        return {
          habitId: habit._id,
          title: habit.title,
          category: habit.category,
          completionRate: stats.completionRate,
          streak: stats.currentStreak
        };
      });

      // Get recent activity (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentProgress = habits.reduce((total, habit) => {
        const recentEntries = habit.progress.filter(
          p => new Date(p.date) >= thirtyDaysAgo
        );
        return total + recentEntries.length;
      }, 0);

      res.json({
        success: true,
        data: {
          totalHabits,
          activeHabits,
          categoryStats: categoryStats.map(stat => ({
            category: stat._id,
            total: stat.count,
            active: stat.activeCount
          })),
          completionStats,
          recentActivity: {
            progressEntries: recentProgress,
            days: 30
          },
          averageCompletionRate: completionStats.length > 0 
            ? Math.round(completionStats.reduce((sum, stat) => sum + stat.completionRate, 0) / completionStats.length)
            : 0
        }
      });

    } catch (error) {
      logger.error('Get habit stats error:', error);
      throw error;
    }
  });

  /**
   * Get habits by category
   * GET /api/habits/category/:category
   */
  getHabitsByCategory = asyncHandler(async (req, res) => {
    const { category } = req.params;
    const userId = req.user.userId;

    try {
      const habits = await Habit.find({ userId, category })
        .sort({ createdAt: -1 });

      const habitsWithStats = habits.map(habit => {
        const stats = this.calculateHabitStats(habit);
        return {
          id: habit._id,
          title: habit.title,
          description: habit.description,
          frequency: habit.frequency,
          target: habit.target,
          isActive: habit.isActive,
          createdAt: habit.createdAt,
          statistics: stats
        };
      });

      res.json({
        success: true,
        data: {
          category,
          habits: habitsWithStats,
          count: habits.length
        }
      });

    } catch (error) {
      logger.error('Get habits by category error:', error);
      throw error;
    }
  });

  /**
   * Calculate habit statistics
   */
  calculateHabitStats(habit) {
    const now = new Date();
    const progress = habit.progress || [];
    
    if (progress.length === 0) {
      return {
        totalEntries: 0,
        completionRate: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageValue: 0,
        targetAchievementRate: 0
      };
    }

    // Calculate completion rate based on frequency
    const totalEntries = progress.length;
    const daysSinceCreation = Math.ceil((now - habit.createdAt) / (1000 * 60 * 60 * 24));
    
    let expectedEntries = 0;
    switch (habit.frequency) {
      case 'daily':
        expectedEntries = daysSinceCreation;
        break;
      case 'weekly':
        expectedEntries = Math.ceil(daysSinceCreation / 7);
        break;
      default:
        expectedEntries = totalEntries; // Custom frequency
    }

    const completionRate = expectedEntries > 0 
      ? Math.round((totalEntries / expectedEntries) * 100) 
      : 0;

    // Calculate streaks
    const streaks = this.calculateStreaks(progress, habit.frequency);
    const currentStreak = streaks.current;
    const longestStreak = Math.max(...streaks.all);

    // Calculate average value
    const totalValue = progress.reduce((sum, entry) => sum + entry.value, 0);
    const averageValue = totalValue / totalEntries;

    // Calculate target achievement rate
    const targetAchievements = progress.filter(entry => entry.value >= habit.target).length;
    const targetAchievementRate = Math.round((targetAchievements / totalEntries) * 100);

    return {
      totalEntries,
      completionRate: Math.min(100, completionRate),
      currentStreak,
      longestStreak,
      averageValue: Math.round(averageValue * 100) / 100,
      targetAchievementRate
    };
  }

  /**
   * Calculate streaks for a habit
   */
  calculateStreaks(progress, frequency) {
    if (progress.length === 0) return { current: 0, all: [0] };

    const sortedProgress = progress.sort((a, b) => new Date(b.date) - new Date(a.date));
    const streaks = [];
    let currentStreak = 0;
    let maxStreak = 0;

    const now = new Date();
    let currentDate = new Date(now);
    
    // Calculate current streak
    for (let i = 0; i < sortedProgress.length; i++) {
      const entry = sortedProgress[i];
      const entryDate = new Date(entry.date);
      
      if (this.isConsecutiveDay(currentDate, entryDate, frequency)) {
        currentStreak++;
        currentDate = entryDate;
      } else {
        break;
      }
    }

    // Calculate all streaks
    let tempStreak = 0;
    for (let i = 0; i < sortedProgress.length - 1; i++) {
      const current = new Date(sortedProgress[i].date);
      const next = new Date(sortedProgress[i + 1].date);
      
      if (this.isConsecutiveDay(current, next, frequency)) {
        tempStreak++;
      } else {
        streaks.push(tempStreak + 1);
        tempStreak = 0;
      }
    }
    
    if (tempStreak > 0 || streaks.length === 0) {
      streaks.push(tempStreak + 1);
    }

    return {
      current: currentStreak,
      all: streaks.length > 0 ? streaks : [0]
    };
  }

  /**
   * Check if two dates are consecutive based on frequency
   */
  isConsecutiveDay(date1, date2, frequency) {
    const diffTime = Math.abs(date1 - date2);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    switch (frequency) {
      case 'daily':
        return diffDays <= 1;
      case 'weekly':
        return diffDays <= 7;
      default:
        return diffDays <= 1; // Default to daily
    }
  }
}

module.exports = new HabitController();
