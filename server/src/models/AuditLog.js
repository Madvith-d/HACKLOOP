const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  actorRole: {
    type: String,
    enum: ['user', 'therapist', 'admin', 'system'],
    required: true
  },
  targetCollection: {
    type: String,
    required: true,
    index: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['read', 'write', 'delete', 'export', 'update', 'create'],
    required: true
  },
  resourceType: {
    type: String,
    enum: ['message', 'conversation', 'user_profile', 'wellness_score', 'journal', 'habit', 'appointment', 'safety_flag', 'session_summary'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  reason: {
    type: String,
    maxlength: 500
  },
  ip: {
    type: String,
    maxlength: 45 // IPv6 max length
  },
  userAgent: {
    type: String,
    maxlength: 500
  },
  endpoint: {
    type: String,
    maxlength: 200
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  },
  statusCode: {
    type: Number,
    min: 100,
    max: 599
  },
  // For sensitive data access, store what was accessed
  accessedFields: {
    type: [String],
    default: []
  },
  // For data modifications, store before/after if sensitive
  dataChanges: {
    type: mongoose.Schema.Types.Mixed
  },
  // Compliance flags
  isSensitiveDataAccess: {
    type: Boolean,
    default: false
  },
  isEmergencyAccess: {
    type: Boolean,
    default: false
  },
  // For therapist accessing patient data
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  consentGiven: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
auditLogSchema.index({ actorId: 1, timestamp: -1 });
auditLogSchema.index({ targetCollection: 1, targetId: 1 });
auditLogSchema.index({ resourceType: 1, timestamp: -1 });
auditLogSchema.index({ isSensitiveDataAccess: 1, timestamp: -1 });
auditLogSchema.index({ patientId: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 }); // For time-based queries

// TTL index to automatically delete old logs after 7 years (GDPR compliance)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 220752000 }); // 7 years

// Virtual for age of log entry
auditLogSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.timestamp.getTime()) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to set sensitive data access flag
auditLogSchema.pre('save', function(next) {
  const sensitiveCollections = ['safety_flags', 'user_profiles', 'messages'];
  const sensitiveActions = ['read', 'export', 'delete'];
  
  if (sensitiveCollections.includes(this.targetCollection) && 
      sensitiveActions.includes(this.action)) {
    this.isSensitiveDataAccess = true;
  }
  
  next();
});

// Static method to log access
auditLogSchema.statics.logAccess = function(data) {
  return this.create({
    actorId: data.actorId,
    actorRole: data.actorRole,
    targetCollection: data.targetCollection,
    targetId: data.targetId,
    action: data.action,
    resourceType: data.resourceType,
    reason: data.reason,
    ip: data.ip,
    userAgent: data.userAgent,
    endpoint: data.endpoint,
    method: data.method,
    statusCode: data.statusCode,
    accessedFields: data.accessedFields,
    patientId: data.patientId,
    consentGiven: data.consentGiven
  });
};

// Static method to log data modification
auditLogSchema.statics.logModification = function(data) {
  return this.create({
    actorId: data.actorId,
    actorRole: data.actorRole,
    targetCollection: data.targetCollection,
    targetId: data.targetId,
    action: data.action,
    resourceType: data.resourceType,
    reason: data.reason,
    ip: data.ip,
    userAgent: data.userAgent,
    endpoint: data.endpoint,
    method: data.method,
    statusCode: data.statusCode,
    dataChanges: data.dataChanges,
    patientId: data.patientId,
    consentGiven: data.consentGiven
  });
};

// Static method to get audit trail for a resource
auditLogSchema.statics.getAuditTrail = function(targetCollection, targetId, limit = 100) {
  return this.find({
    targetCollection,
    targetId
  })
  .populate('actorId', 'name email role')
  .sort({ timestamp: -1 })
  .limit(limit);
};

// Static method to get sensitive data access for a user
auditLogSchema.statics.getSensitiveAccess = function(userId, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.find({
    patientId: userId,
    isSensitiveDataAccess: true,
    timestamp: { $gte: startDate }
  })
  .populate('actorId', 'name email role')
  .sort({ timestamp: -1 });
};

// Static method to get emergency access logs
auditLogSchema.statics.getEmergencyAccess = function(days = 7) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.find({
    isEmergencyAccess: true,
    timestamp: { $gte: startDate }
  })
  .populate('actorId', 'name email role')
  .populate('patientId', 'name email')
  .sort({ timestamp: -1 });
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
