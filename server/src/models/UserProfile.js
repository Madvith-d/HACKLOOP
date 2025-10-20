const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  version: {
    type: Number,
    default: 1,
  },
  onboarded: {
    type: Boolean,
    default: false,
  },
  demographics: {
    dob: Date,
    gender: String,
    location: String,
    language: {
      type: String,
      default: 'en',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
  },
  likes: [{
    type: String,
  }],
  dislikes: [{
    type: String,
  }],
  mental_health_history: {
    diagnoses: [{
      type: String,
    }],
    medications: [{
      name: String,
      dosage: String,
      notes: String,
    }],
    past_therapies: [{
      type: String,
    }],
    hospitalizations: [{
      type: String,
    }],
  },
  baseline_assessments: {
    phq9_score: Number,
    gad7_score: Number,
    sleep_quality_baseline: Number,
  },
  preferences: {
    preferred_therapist_gender: String,
    preferred_session_mode: {
      type: String,
      enum: ['video', 'audio', 'text'],
      default: 'video',
    },
    preferred_languages: [{
      type: String,
    }],
    available_hours: [{
      type: String,
    }],
  },
  emergency_contact: {
    name: String,
    relationship: String,
    phone: String,
    consent_to_contact: {
      type: Boolean,
      default: false,
    },
  },
  consents: {
    store_long_term_memory: {
      type: Boolean,
      default: false,
    },
    share_with_therapist: {
      type: Boolean,
      default: false,
    },
    share_with_family: {
      type: Boolean,
      default: false,
    },
    allow_data_for_research: {
      type: Boolean,
      default: false,
    },
    contact_in_emergency: {
      type: Boolean,
      default: false,
    },
  },
  privacy_flags: {
    sensitive_data_masked: {
      type: Boolean,
      default: false,
    },
    last_erasure_request: Date,
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
  collection: 'user_profiles',
});

// Indexes for therapist matching
userProfileSchema.index({ 'preferences.preferred_languages': 1 });
userProfileSchema.index({ 'preferences.preferred_therapist_gender': 1 });
userProfileSchema.index({ 'mental_health_history.diagnoses': 1 });
userProfileSchema.index({ 'demographics.location': 1 });

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

module.exports = UserProfile;
