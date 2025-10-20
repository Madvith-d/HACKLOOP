const mongoose = require('mongoose');

const safetyFlagSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  flagType: {
    type: String,
    enum: ['suicidal_ideation', 'self_harm', 'violence', 'crisis'],
    required: true
  },
  sourceMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true
  },
  details: {
    type: String,
    required: true,
    maxlength: 1000
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    required: true
  },
  notified: {
    type: Boolean,
    default: false
  },
  notifiedAt: {
    type: Date
  },
  therapistAlerted: {
    type: Boolean,
    default: false
  },
  emergencyContactNotified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'investigating', 'resolved', 'escalated'],
    default: 'active'
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    maxlength: 2000
  },
  // AI confidence score for the detection
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
safetyFlagSchema.index({ userId: 1, timestamp: -1 });
safetyFlagSchema.index({ flagType: 1, severity: 1 });
safetyFlagSchema.index({ status: 1, notified: 1 });

// Virtual for age of flag
safetyFlagSchema.virtual('ageInHours').get(function() {
  return Math.floor((Date.now() - this.timestamp.getTime()) / (1000 * 60 * 60));
});

// Pre-save middleware to set severity based on flag type
safetyFlagSchema.pre('save', function(next) {
  if (this.flagType === 'suicidal_ideation' && this.confidence > 0.8) {
    this.severity = 'critical';
  } else if (this.flagType === 'self_harm' && this.confidence > 0.7) {
    this.severity = 'high';
  } else if (this.confidence > 0.6) {
    this.severity = 'medium';
  } else {
    this.severity = 'low';
  }
  next();
});

// Instance method to mark as resolved
safetyFlagSchema.methods.markResolved = function(resolvedBy, notes) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolvedBy = resolvedBy;
  if (notes) {
    this.notes = notes;
  }
  return this.save();
};

// Static method to get active flags for user
safetyFlagSchema.statics.getActiveFlags = function(userId) {
  return this.find({
    userId,
    status: { $in: ['active', 'investigating'] }
  }).sort({ timestamp: -1 });
};

// Static method to get critical flags requiring immediate attention
safetyFlagSchema.statics.getCriticalFlags = function() {
  return this.find({
    severity: 'critical',
    status: 'active',
    notified: false
  }).sort({ timestamp: -1 });
};

module.exports = mongoose.model('SafetyFlag', safetyFlagSchema);
