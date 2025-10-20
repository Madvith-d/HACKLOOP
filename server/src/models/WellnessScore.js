const mongoose = require('mongoose');

const wellnessScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  components: {
    cv: Number,
    text: Number,
    sleep: Number,
  },
  actionSuggested: {
    type: String,
    enum: ['none', 'journal', 'breathing', 'habit', 'book_therapist'],
    default: 'none',
  },
  reasoning: String,
}, {
  timestamps: true,
  collection: 'wellness_scores',
});

wellnessScoreSchema.index({ userId: 1, timestamp: -1 });
wellnessScoreSchema.index({ userId: 1, score: -1 });

const WellnessScore = mongoose.model('WellnessScore', wellnessScoreSchema);

module.exports = WellnessScore;
