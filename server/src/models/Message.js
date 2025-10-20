const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
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
  role: {
    type: String,
    enum: ['user', 'agent', 'therapist', 'system'],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  raw_text: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  cv_metrics: {
    stress_score: Number,
    fatigue: Number,
    blink_rate: Number,
    confidence: Number,
  },
  audio_metrics: {
    speech_rate: Number,
    volume: Number,
    pause_ratio: Number,
  },
  sentiment: {
    label: String,
    score: Number,
  },
  embeddingRef: String,
  isArchived: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  collection: 'messages',
});

// Indexes
messageSchema.index({ conversationId: 1, timestamp: 1 });
messageSchema.index({ userId: 1, timestamp: -1 });
messageSchema.index({ embeddingRef: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
