const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  text: {
    type: String,
    required: true,
  },
  moodTags: [{
    type: String,
  }],
  embeddingRef: String,
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
}, {
  timestamps: true,
  collection: 'journals',
});

journalSchema.index({ userId: 1, createdAt: -1 });

const Journal = mongoose.model('Journal', journalSchema);

module.exports = Journal;
