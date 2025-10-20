const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['user', 'therapist', 'admin'],
    default: 'user',
    index: true,
  },
  onboarded: {
    type: Boolean,
    default: false,
  },
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserProfile',
  },
  lastActiveAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  collection: 'users',
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Update lastActiveAt on save
userSchema.pre('save', function(next) {
  this.lastActiveAt = new Date();
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;