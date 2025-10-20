const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
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
  freq: {
    type: String,
    enum: ['daily', 'weekly', 'custom'],
    default: 'daily',
  },
  target: {
    type: Number,
    default: 1,
  },
  progress: [{
    date: {
      type: Date,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
}, {
  timestamps: true,
  collection: 'habits',
});

habitSchema.index({ userId: 1, isActive: 1 });

const Habit = mongoose.model('Habit', habitSchema);

module.exports = Habit;
