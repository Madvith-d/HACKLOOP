const mongoose = require('mongoose');

const sessionSummarySchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  summaryText: {
    type: String,
    required: true,
  },
  embeddingRef: String,
  tags: [{
    type: String,
  }],
  importance: {
    type: Number,
    default: 0.5,
    min: 0,
    max: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
}, {
  timestamps: true,
  collection: 'session_summaries',
});

// Indexes
sessionSummarySchema.index({ userId: 1, createdAt: -1 });
sessionSummarySchema.index({ conversationId: 1 });

const SessionSummary = mongoose.model('SessionSummary', sessionSummarySchema);

module.exports = SessionSummary;
