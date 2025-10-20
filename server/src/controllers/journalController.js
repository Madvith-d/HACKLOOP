const logger = require('../utils/logger');
const { Journal } = require('../models');
const embeddingService = require('../services/embeddingService');
const vectorDbService = require('../services/vectorDbService');
const { asyncHandler } = require('../middleware/errorHandler');

class JournalController {
  /**
   * Create a new journal entry
   * POST /api/journals
   */
  createJournal = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { title, text, moodTags = [] } = req.body;

    try {
      // Create journal entry
      const journal = new Journal({
        userId,
        title: title.trim(),
        text: text.trim(),
        moodTags,
        createdAt: new Date()
      });

      await journal.save();

      // Create embedding for search functionality
      try {
        const embeddingResult = await embeddingService.embedWithRetry(`${title} ${text}`);
        
        const vectorId = `journal_${journal._id}_${Date.now()}`;
        const vector = vectorDbService.createVector(
          vectorId,
          embeddingResult.embedding,
          {
            userId: userId.toString(),
            type: 'journal_entry',
            mongoRef: `journals/${journal._id}`,
            timestamp: journal.createdAt.toISOString(),
            importance: 0.7,
            privacy: 'public'
          }
        );

        await vectorDbService.upsert([vector]);
        
        // Update journal with embedding reference
        journal.embeddingRef = vectorId;
        await journal.save();

      } catch (embeddingError) {
        logger.warn('Failed to create journal embedding:', embeddingError.message);
        // Don't fail the journal creation if embedding fails
      }

      logger.info('Journal entry created', {
        journalId: journal._id,
        userId,
        title: journal.title
      });

      res.status(201).json({
        success: true,
        message: 'Journal entry created successfully',
        data: {
          journal: {
            id: journal._id,
            title: journal.title,
            text: journal.text,
            moodTags: journal.moodTags,
            createdAt: journal.createdAt
          }
        }
      });

    } catch (error) {
      logger.error('Journal creation error:', error);
      throw error;
    }
  });

  /**
   * Get user's journal entries
   * GET /api/journals
   */
  getJournals = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      moodTag,
      search
    } = req.query;

    try {
      // Build query
      const query = { userId };
      
      if (moodTag) {
        query.moodTags = { $in: [moodTag] };
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      let journals;

      // If search query provided, use semantic search
      if (search && search.trim()) {
        journals = await this.searchJournals(userId, search.trim(), skip, parseInt(limit));
      } else {
        // Regular query
        journals = await Journal.find(query)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .select('title text moodTags createdAt');
      }

      // Get total count
      const total = await Journal.countDocuments(query);

      logger.info('Journals retrieved', {
        userId,
        count: journals.length,
        search: search || 'none'
      });

      res.json({
        success: true,
        data: {
          journals: journals.map(journal => ({
            id: journal._id,
            title: journal.title,
            text: journal.text,
            moodTags: journal.moodTags,
            createdAt: journal.createdAt
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Get journals error:', error);
      throw error;
    }
  });

  /**
   * Get specific journal entry
   * GET /api/journals/:id
   */
  getJournal = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const journal = await Journal.findOne({ _id: id, userId });

      if (!journal) {
        return res.status(404).json({
          error: 'JOURNAL_NOT_FOUND',
          message: 'Journal entry not found'
        });
      }

      res.json({
        success: true,
        data: {
          journal: {
            id: journal._id,
            title: journal.title,
            text: journal.text,
            moodTags: journal.moodTags,
            createdAt: journal.createdAt,
            updatedAt: journal.updatedAt
          }
        }
      });

    } catch (error) {
      logger.error('Get journal error:', error);
      throw error;
    }
  });

  /**
   * Update journal entry
   * PUT /api/journals/:id
   */
  updateJournal = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const { title, text, moodTags } = req.body;

    try {
      const journal = await Journal.findOne({ _id: id, userId });

      if (!journal) {
        return res.status(404).json({
          error: 'JOURNAL_NOT_FOUND',
          message: 'Journal entry not found'
        });
      }

      // Update fields
      if (title !== undefined) journal.title = title.trim();
      if (text !== undefined) journal.text = text.trim();
      if (moodTags !== undefined) journal.moodTags = moodTags;

      journal.updatedAt = new Date();
      await journal.save();

      // Update embedding if text changed
      if (title !== undefined || text !== undefined) {
        try {
          if (journal.embeddingRef) {
            // Delete old embedding
            await vectorDbService.delete([journal.embeddingRef]);
          }

          // Create new embedding
          const embeddingResult = await embeddingService.embedWithRetry(`${journal.title} ${journal.text}`);
          
          const vectorId = `journal_${journal._id}_${Date.now()}`;
          const vector = vectorDbService.createVector(
            vectorId,
            embeddingResult.embedding,
            {
              userId: userId.toString(),
              type: 'journal_entry',
              mongoRef: `journals/${journal._id}`,
              timestamp: journal.updatedAt.toISOString(),
              importance: 0.7,
              privacy: 'public'
            }
          );

          await vectorDbService.upsert([vector]);
          
          // Update journal with new embedding reference
          journal.embeddingRef = vectorId;
          await journal.save();

        } catch (embeddingError) {
          logger.warn('Failed to update journal embedding:', embeddingError.message);
        }
      }

      logger.info('Journal entry updated', {
        journalId: journal._id,
        userId
      });

      res.json({
        success: true,
        message: 'Journal entry updated successfully',
        data: {
          journal: {
            id: journal._id,
            title: journal.title,
            text: journal.text,
            moodTags: journal.moodTags,
            createdAt: journal.createdAt,
            updatedAt: journal.updatedAt
          }
        }
      });

    } catch (error) {
      logger.error('Update journal error:', error);
      throw error;
    }
  });

  /**
   * Delete journal entry
   * DELETE /api/journals/:id
   */
  deleteJournal = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      const journal = await Journal.findOne({ _id: id, userId });

      if (!journal) {
        return res.status(404).json({
          error: 'JOURNAL_NOT_FOUND',
          message: 'Journal entry not found'
        });
      }

      // Delete embedding if exists
      if (journal.embeddingRef) {
        try {
          await vectorDbService.delete([journal.embeddingRef]);
        } catch (embeddingError) {
          logger.warn('Failed to delete journal embedding:', embeddingError.message);
        }
      }

      // Delete journal entry
      await Journal.findByIdAndDelete(id);

      logger.info('Journal entry deleted', {
        journalId: journal._id,
        userId
      });

      res.json({
        success: true,
        message: 'Journal entry deleted successfully'
      });

    } catch (error) {
      logger.error('Delete journal error:', error);
      throw error;
    }
  });

  /**
   * Get journal statistics
   * GET /api/journals/stats
   */
  getJournalStats = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    try {
      const totalJournals = await Journal.countDocuments({ userId });

      // Get journals by month for the last 6 months
      const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
      const monthlyStats = await Journal.aggregate([
        {
          $match: {
            userId: userId,
            createdAt: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      // Get mood tag statistics
      const moodStats = await Journal.aggregate([
        { $match: { userId } },
        { $unwind: '$moodTags' },
        {
          $group: {
            _id: '$moodTags',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      // Get recent activity (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentActivity = await Journal.countDocuments({
        userId,
        createdAt: { $gte: thirtyDaysAgo }
      });

      res.json({
        success: true,
        data: {
          totalJournals,
          monthlyStats: monthlyStats.map(stat => ({
            year: stat._id.year,
            month: stat._id.month,
            count: stat.count
          })),
          moodStats: moodStats.map(stat => ({
            mood: stat._id,
            count: stat.count
          })),
          recentActivity,
          averagePerMonth: totalJournals > 0 ? Math.round(totalJournals / 6 * 10) / 10 : 0
        }
      });

    } catch (error) {
      logger.error('Get journal stats error:', error);
      throw error;
    }
  });

  /**
   * Search journals using semantic search
   */
  async searchJournals(userId, searchQuery, skip = 0, limit = 10) {
    try {
      // Create embedding for search query
      const queryEmbedding = await embeddingService.embedWithRetry(searchQuery);
      
      // Search in vector database
      const searchResults = await vectorDbService.searchUserMemories(
        userId,
        queryEmbedding.embedding,
        { topK: limit + skip, includeMetadata: true }
      );

      // Filter for journal entries only
      const journalMatches = searchResults.matches?.filter(
        match => match.metadata?.type === 'journal_entry'
      ) || [];

      // Get journal IDs from matches
      const journalIds = journalMatches
        .slice(skip, skip + limit)
        .map(match => {
          const mongoRef = match.metadata?.mongoRef;
          return mongoRef ? mongoRef.split('/')[1] : null;
        })
        .filter(id => id);

      // Fetch journals from MongoDB
      const journals = await Journal.find({
        _id: { $in: journalIds }
      })
      .select('title text moodTags createdAt');

      return journals;

    } catch (error) {
      logger.error('Journal search error:', error);
      // Fallback to regular text search
      return Journal.find({
        userId,
        $or: [
          { title: { $regex: searchQuery, $options: 'i' } },
          { text: { $regex: searchQuery, $options: 'i' } }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title text moodTags createdAt');
    }
  }
}

module.exports = new JournalController();
