# MindMesh+ Backend - File Generator Script
# Run this script to generate all remaining backend files

Write-Host "Generating MindMesh+ Backend Files..." -ForegroundColor Green

# Create WellnessScore Model
$wellnessScore = @'
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
'@

# Create Journal Model
$journal = @'
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
'@

# Create Habit Model
$habit = @'
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
'@

# Create Appointment Model
$appointment = @'
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  therapistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  startTime: {
    type: Date,
    required: true,
    index: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['scheduled', 'cancelled', 'completed', 'no_show'],
    default: 'scheduled',
    index: true,
  },
  videoRoomId: String,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
}, {
  timestamps: true,
  collection: 'appointments',
});

appointmentSchema.index({ therapistId: 1, startTime: 1 });
appointmentSchema.index({ userId: 1, startTime: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
'@

# Create SafetyFlag Model
$safetyFlag = @'
const mongoose = require('mongoose');

const safetyFlagSchema = new mongoose.Schema({
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
  flagType: {
    type: String,
    enum: ['suicidal_ideation', 'self_harm', 'violence', 'severe_distress'],
    required: true,
  },
  sourceMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  details: String,
  notified: {
    type: Boolean,
    default: false,
  },
  notifiedAt: Date,
  resolvedAt: Date,
}, {
  timestamps: true,
  collection: 'safety_flags',
});

safetyFlagSchema.index({ userId: 1, timestamp: -1 });
safetyFlagSchema.index({ notified: 1 });

const SafetyFlag = mongoose.model('SafetyFlag', safetyFlagSchema);

module.exports = SafetyFlag;
'@

# Create AuditLog Model
$auditLog = @'
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  actorRole: {
    type: String,
    enum: ['user', 'therapist', 'admin', 'system'],
  },
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE',
      'READ',
      'UPDATE',
      'DELETE',
      'LOGIN',
      'LOGOUT',
      'COMPLETE_ONBOARDING',
      'UPDATE_ROLE',
      'ACCESS_SENSITIVE_DATA',
      'EXPORT_DATA',
      'ERASURE_REQUEST',
    ],
    index: true,
  },
  targetCollection: {
    type: String,
    required: true,
  },
  targetId: mongoose.Schema.Types.ObjectId,
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true,
  },
  ip: String,
  userAgent: String,
  reason: String,
  details: mongoose.Schema.Types.Mixed,
}, {
  timestamps: false,
  collection: 'audit_logs',
});

// Compound indexes
auditLogSchema.index({ actorId: 1, timestamp: -1 });
auditLogSchema.index({ targetCollection: 1, targetId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

// TTL index - automatically delete logs older than 7 years
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 220898400 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
'@

# Write all model files
$wellnessScore | Out-File -FilePath "src\models\WellnessScore.js" -Encoding utf8
$journal | Out-File -FilePath "src\models\Journal.js" -Encoding utf8
$habit | Out-File -FilePath "src\models\Habit.js" -Encoding utf8
$appointment | Out-File -FilePath "src\models\Appointment.js" -Encoding utf8
$safetyFlag | Out-File -FilePath "src\models\SafetyFlag.js" -Encoding utf8
$auditLog | Out-File -FilePath "src\models\AuditLog.js" -Encoding utf8

Write-Host "✅ All models created successfully!" -ForegroundColor Green
Write-Host "Run 'npm run dev' to start the server" -ForegroundColor Cyan
'@
