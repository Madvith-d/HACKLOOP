const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  therapistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'closed'],
    default: 'active',
    index: true,
  },
  tags: [{
    type: String,
  }],
  sessionSummaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SessionSummary',
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: Date,
}, {
  timestamps: true,
  collection: 'conversations',
});

// Indexes
conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ status: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
