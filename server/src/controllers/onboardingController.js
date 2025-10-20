const logger = require('../utils/logger');
const { User, UserProfile } = require('../models');
const embeddingService = require('../services/embeddingService');
const vectorDbService = require('../services/vectorDbService');
const { asyncHandler } = require('../middleware/errorHandler');

class OnboardingController {
  /**
   * Complete user onboarding
   * POST /api/onboarding/complete
   */
  completeOnboarding = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const onboardingData = req.body;

    try {
      // Check if user already onboarded
      const existingProfile = await UserProfile.findOne({ userId });
      if (existingProfile && existingProfile.onboarded) {
        return res.status(400).json({
          error: 'ALREADY_ONBOARDED',
          message: 'User has already completed onboarding'
        });
      }

      // Create or update user profile
      const profileData = {
        userId,
        version: 1,
        onboarded: true,
        demographics: onboardingData.demographics,
        likes: onboardingData.likes || [],
        dislikes: onboardingData.dislikes || [],
        mentalHealthHistory: onboardingData.mentalHealthHistory || {},
        baselineAssessments: onboardingData.baselineAssessments || {},
        preferences: onboardingData.preferences || {},
        emergencyContact: onboardingData.emergencyContact || {},
        consents: onboardingData.consents
      };

      let userProfile;
      if (existingProfile) {
        Object.assign(existingProfile, profileData);
        userProfile = await existingProfile.save();
      } else {
        userProfile = new UserProfile(profileData);
        await userProfile.save();
      }

      // Update user onboarded status
      await User.findByIdAndUpdate(userId, { 
        onboarded: true,
        onboardedAt: new Date()
      });

      // Create user fact embeddings if consent given
      if (onboardingData.consents?.storeLongTermMemory) {
        await this.createUserFactEmbeddings(userId, userProfile);
      }

      logger.info('Onboarding completed successfully', {
        userId,
        profileId: userProfile._id,
        consents: onboardingData.consents
      });

      res.status(201).json({
        success: true,
        message: 'Onboarding completed successfully',
        data: {
          profile: {
            id: userProfile._id,
            onboarded: userProfile.onboarded,
            demographics: userProfile.demographics,
            preferences: userProfile.preferences,
            consents: userProfile.consents
          }
        }
      });

    } catch (error) {
      logger.error('Onboarding completion error:', error);
      throw error;
    }
  });

  /**
   * Get onboarding status
   * GET /api/onboarding/status
   */
  getOnboardingStatus = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    try {
      const user = await User.findById(userId);
      const profile = await UserProfile.findOne({ userId });

      res.json({
        success: true,
        data: {
          onboarded: user?.onboarded || false,
          profile: profile ? {
            id: profile._id,
            onboarded: profile.onboarded,
            demographics: profile.demographics,
            preferences: profile.preferences,
            consents: profile.consents
          } : null
        }
      });

    } catch (error) {
      logger.error('Onboarding status error:', error);
      throw error;
    }
  });

  /**
   * Update onboarding profile
   * PUT /api/onboarding/update
   */
  updateOnboarding = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const updateData = req.body;

    try {
      const profile = await UserProfile.findOne({ userId });
      
      if (!profile) {
        return res.status(404).json({
          error: 'PROFILE_NOT_FOUND',
          message: 'User profile not found'
        });
      }

      // Update profile fields
      Object.assign(profile, updateData);
      await profile.save();

      // Update user fact embeddings if consent changed
      if (updateData.consents?.storeLongTermMemory && 
          !profile.consents?.storeLongTermMemory) {
        await this.createUserFactEmbeddings(userId, profile);
      } else if (!updateData.consents?.storeLongTermMemory && 
                 profile.consents?.storeLongTermMemory) {
        await this.deleteUserFactEmbeddings(userId);
      }

      logger.info('Onboarding profile updated', {
        userId,
        profileId: profile._id,
        updatedFields: Object.keys(updateData)
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          profile: {
            id: profile._id,
            onboarded: profile.onboarded,
            demographics: profile.demographics,
            preferences: profile.preferences,
            consents: profile.consents
          }
        }
      });

    } catch (error) {
      logger.error('Onboarding update error:', error);
      throw error;
    }
  });

  /**
   * Get onboarding form schema
   * GET /api/onboarding/schema
   */
  getOnboardingSchema = asyncHandler(async (req, res) => {
    const schema = {
      demographics: {
        dob: { type: 'date', required: true, label: 'Date of Birth' },
        gender: { 
          type: 'select', 
          required: true, 
          label: 'Gender',
          options: ['male', 'female', 'other', 'prefer_not_to_say']
        },
        location: { type: 'text', required: true, label: 'Location' },
        language: { type: 'select', required: false, label: 'Preferred Language', default: 'en' },
        timezone: { type: 'text', required: true, label: 'Timezone' }
      },
      mentalHealthHistory: {
        diagnoses: { type: 'multiselect', required: false, label: 'Mental Health Diagnoses' },
        medications: { type: 'array', required: false, label: 'Current Medications' },
        pastTherapies: { type: 'multiselect', required: false, label: 'Past Therapies' },
        hospitalizations: { type: 'array', required: false, label: 'Hospitalizations' }
      },
      preferences: {
        preferredTherapistGender: { 
          type: 'select', 
          required: false, 
          label: 'Preferred Therapist Gender',
          options: ['male', 'female', 'no_preference']
        },
        preferredSessionMode: { 
          type: 'select', 
          required: false, 
          label: 'Preferred Session Mode',
          options: ['video', 'audio', 'text']
        },
        preferredLanguages: { type: 'multiselect', required: false, label: 'Preferred Languages' },
        availableHours: { type: 'array', required: false, label: 'Available Hours' }
      },
      emergencyContact: {
        name: { type: 'text', required: true, label: 'Emergency Contact Name' },
        relationship: { type: 'text', required: true, label: 'Relationship' },
        phone: { type: 'tel', required: true, label: 'Phone Number' },
        consentToContact: { type: 'checkbox', required: false, label: 'Consent to Contact' }
      },
      consents: {
        storeLongTermMemory: { type: 'checkbox', required: false, label: 'Store Long-term Memory' },
        shareWithTherapist: { type: 'checkbox', required: false, label: 'Share with Therapist' },
        shareWithFamily: { type: 'checkbox', required: false, label: 'Share with Family' },
        allowDataForResearch: { type: 'checkbox', required: false, label: 'Allow Data for Research' },
        contactInEmergency: { type: 'checkbox', required: false, label: 'Contact in Emergency' }
      }
    };

    res.json({
      success: true,
      data: { schema }
    });
  });

  /**
   * Create user fact embeddings for vector memory
   */
  async createUserFactEmbeddings(userId, profile) {
    try {
      const facts = this.extractSafeFacts(profile);
      
      if (facts.length === 0) {
        logger.info('No safe facts to embed', { userId });
        return;
      }

      // Create embeddings for each fact
      const embeddings = await embeddingService.embedBatch(facts.map(fact => fact.text));
      
      // Prepare vectors for Pinecone
      const vectors = facts.map((fact, index) => 
        vectorDbService.createVector(
          `user_fact_${userId}_${fact.key}_${Date.now()}`,
          embeddings.embeddings[index],
          {
            userId: userId.toString(),
            type: 'user_fact',
            factKey: fact.key,
            factPreview: fact.text.substring(0, 100),
            privacy: 'public',
            importance: fact.importance,
            timestamp: new Date().toISOString()
          }
        )
      );

      // Upsert to Pinecone
      await vectorDbService.upsert(vectors);

      logger.info('User fact embeddings created', {
        userId,
        factCount: facts.length,
        embeddingCount: vectors.length
      });

    } catch (error) {
      logger.error('Failed to create user fact embeddings:', error);
      // Don't throw error - onboarding should succeed even if embeddings fail
    }
  }

  /**
   * Delete user fact embeddings
   */
  async deleteUserFactEmbeddings(userId) {
    try {
      await vectorDbService.deleteUserVectors(userId);
      
      logger.info('User fact embeddings deleted', { userId });
    } catch (error) {
      logger.error('Failed to delete user fact embeddings:', error);
    }
  }

  /**
   * Extract safe facts from profile for embedding
   */
  extractSafeFacts(profile) {
    const facts = [];

    // Likes and dislikes (safe, non-PII)
    if (profile.likes && profile.likes.length > 0) {
      facts.push({
        key: 'likes',
        text: `User likes: ${profile.likes.join(', ')}`,
        importance: 0.6
      });
    }

    if (profile.dislikes && profile.dislikes.length > 0) {
      facts.push({
        key: 'dislikes',
        text: `User dislikes: ${profile.dislikes.join(', ')}`,
        importance: 0.6
      });
    }

    // Session preferences
    if (profile.preferences?.preferredSessionMode) {
      facts.push({
        key: 'session_mode',
        text: `User prefers ${profile.preferences.preferredSessionMode} sessions`,
        importance: 0.7
      });
    }

    if (profile.preferences?.preferredLanguages && profile.preferences.preferredLanguages.length > 0) {
      facts.push({
        key: 'languages',
        text: `User speaks: ${profile.preferences.preferredLanguages.join(', ')}`,
        importance: 0.5
      });
    }

    // Non-sensitive mental health info
    if (profile.mentalHealthHistory?.diagnoses && profile.mentalHealthHistory.diagnoses.length > 0) {
      facts.push({
        key: 'diagnoses',
        text: `User has been diagnosed with: ${profile.mentalHealthHistory.diagnoses.join(', ')}`,
        importance: 0.8
      });
    }

    // Baseline assessments (non-sensitive)
    if (profile.baselineAssessments) {
      const assessments = [];
      if (profile.baselineAssessments.phq9Score) {
        assessments.push(`PHQ-9: ${this.getDepressionLevel(profile.baselineAssessments.phq9Score)}`);
      }
      if (profile.baselineAssessments.gad7Score) {
        assessments.push(`GAD-7: ${this.getAnxietyLevel(profile.baselineAssessments.gad7Score)}`);
      }
      
      if (assessments.length > 0) {
        facts.push({
          key: 'baseline_assessments',
          text: `Baseline assessments: ${assessments.join(', ')}`,
          importance: 0.7
        });
      }
    }

    return facts;
  }

  /**
   * Get depression level from PHQ-9 score
   */
  getDepressionLevel(score) {
    if (score <= 4) return 'minimal';
    if (score <= 9) return 'mild';
    if (score <= 14) return 'moderate';
    if (score <= 19) return 'moderately severe';
    return 'severe';
  }

  /**
   * Get anxiety level from GAD-7 score
   */
  getAnxietyLevel(score) {
    if (score <= 4) return 'minimal';
    if (score <= 9) return 'mild';
    if (score <= 14) return 'moderate';
    return 'severe';
  }
}

module.exports = new OnboardingController();
