const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Generic validation middleware factory
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Validation error:', {
        errors,
        endpoint: req.originalUrl,
        method: req.method,
        userId: req.user?.userId
      });

      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: errors
      });
    }

    // Replace the request property with the validated and sanitized value
    req[property] = value;
    next();
  };
};

/**
 * Common validation schemas
 */
const schemas = {
  // ObjectId validation
  objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  optionalObjectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // Date range
  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate'))
  }),

  // User signup
  userSignup: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
    name: Joi.string().min(2).max(50).required(),
    role: Joi.string().valid('user', 'therapist', 'admin').default('user')
  }),

  // User signin
  signin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Password reset
  passwordReset: Joi.object({
    email: Joi.string().email().required()
  }),

  // Profile update
  profileUpdate: Joi.object({
    name: Joi.string().min(2).max(50),
    role: Joi.string().valid('user', 'therapist', 'admin')
  }).min(1),

  // Onboarding data
  onboardingData: Joi.object({
    demographics: Joi.object({
      dob: Joi.date().max('now').required(),
      gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').required(),
      location: Joi.string().min(2).max(100).required(),
      language: Joi.string().length(2).default('en'),
      timezone: Joi.string().required()
    }),
    likes: Joi.array().items(Joi.string().max(50)).max(20),
    dislikes: Joi.array().items(Joi.string().max(50)).max(20),
    mentalHealthHistory: Joi.object({
      diagnoses: Joi.array().items(Joi.string().max(100)),
      medications: Joi.array().items(Joi.object({
        name: Joi.string().max(100).required(),
        dosage: Joi.string().max(50).required(),
        notes: Joi.string().max(200)
      })),
      pastTherapies: Joi.array().items(Joi.string().max(100)),
      hospitalizations: Joi.array().items(Joi.string().max(200))
    }),
    baselineAssessments: Joi.object({
      phq9Score: Joi.number().integer().min(0).max(27),
      gad7Score: Joi.number().integer().min(0).max(21),
      sleepQualityBaseline: Joi.number().min(0).max(1)
    }),
    preferences: Joi.object({
      preferredTherapistGender: Joi.string().valid('male', 'female', 'no_preference').default('no_preference'),
      preferredSessionMode: Joi.string().valid('video', 'audio', 'text').default('video'),
      preferredLanguages: Joi.array().items(Joi.string().length(2)).min(1),
      availableHours: Joi.array().items(Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/))
    }),
    emergencyContact: Joi.object({
      name: Joi.string().min(2).max(50).required(),
      relationship: Joi.string().max(50).required(),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
      consentToContact: Joi.boolean().default(false)
    }),
    consents: Joi.object({
      storeLongTermMemory: Joi.boolean().default(true),
      shareWithTherapist: Joi.boolean().default(false),
      shareWithFamily: Joi.boolean().default(false),
      allowDataForResearch: Joi.boolean().default(false),
      contactInEmergency: Joi.boolean().default(false)
    }).required()
  }),

  // Onboarding update
  onboardingUpdate: Joi.object({
    demographics: Joi.object({
      dob: Joi.date().max('now'),
      gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say'),
      location: Joi.string().min(2).max(100),
      language: Joi.string().length(2),
      timezone: Joi.string()
    }),
    likes: Joi.array().items(Joi.string().max(50)).max(20),
    dislikes: Joi.array().items(Joi.string().max(50)).max(20),
    mentalHealthHistory: Joi.object({
      diagnoses: Joi.array().items(Joi.string().max(100)),
      medications: Joi.array().items(Joi.object({
        name: Joi.string().max(100).required(),
        dosage: Joi.string().max(50).required(),
        notes: Joi.string().max(200)
      })),
      pastTherapies: Joi.array().items(Joi.string().max(100)),
      hospitalizations: Joi.array().items(Joi.string().max(200))
    }),
    baselineAssessments: Joi.object({
      phq9Score: Joi.number().integer().min(0).max(27),
      gad7Score: Joi.number().integer().min(0).max(21),
      sleepQualityBaseline: Joi.number().min(0).max(1)
    }),
    preferences: Joi.object({
      preferredTherapistGender: Joi.string().valid('male', 'female', 'no_preference'),
      preferredSessionMode: Joi.string().valid('video', 'audio', 'text'),
      preferredLanguages: Joi.array().items(Joi.string().length(2)),
      availableHours: Joi.array().items(Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/))
    }),
    emergencyContact: Joi.object({
      name: Joi.string().min(2).max(50),
      relationship: Joi.string().max(50),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
      consentToContact: Joi.boolean()
    }),
    consents: Joi.object({
      storeLongTermMemory: Joi.boolean(),
      shareWithTherapist: Joi.boolean(),
      shareWithFamily: Joi.boolean(),
      allowDataForResearch: Joi.boolean(),
      contactInEmergency: Joi.boolean()
    })
  }).min(1),

  // Message creation
  messageCreate: Joi.object({
    conversationId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    text: Joi.string().min(1).max(4000).required(),
    cvMetrics: Joi.object({
      stressScore: Joi.number().min(0).max(1),
      fatigue: Joi.number().min(0).max(1),
      blinkRate: Joi.number().min(0).max(1),
      confidence: Joi.number().min(0).max(1)
    }),
    audioMetrics: Joi.object({
      speechRate: Joi.number().min(0).max(300),
      cost: Joi.number().min(0).max(1),
      pauseRatio: Joi.number().min(0).max(1)
    })
  }),

  // Journal entry
  journalCreate: Joi.object({
    title: Joi.string().min(1).max(100).required(),
    text: Joi.string().min(1).max(10000).required(),
    moodTags: Joi.array().items(Joi.string().max(20)).max(10)
  }),

  journalUpdate: Joi.object({
    title: Joi.string().min(1).max(100),
    text: Joi.string().min(1).max(10000),
    moodTags: Joi.array().items(Joi.string().max(20)).max(10)
  }).min(1),

  // Habit tracking
  habitCreate: Joi.object({
    title: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500),
    frequency: Joi.string().valid('daily', 'weekly', 'custom').required(),
    target: Joi.number().min(1).max(365).required(),
    category: Joi.string().max(50),
    reminderTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  }),

  habitProgress: Joi.object({
    value: Joi.number().min(0).required(),
    date: Joi.date().iso().max('now'),
    notes: Joi.string().max(200)
  }),

  // Appointment booking
  appointmentCreate: Joi.object({
    therapistId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    startTime: Joi.date().iso().min('now').required(),
    endTime: Joi.date().iso().min(Joi.ref('startTime')).required(),
    type: Joi.string().valid('video', 'audio', 'in_person').default('video'),
    notes: Joi.string().max(500),
    urgency: Joi.string().valid('low', 'medium', 'high', 'emergency').default('medium')
  }),

  // Wellness score query
  wellnessQuery: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    period: Joi.string().valid('7d', '30d', '90d', '1y').default('30d')
  }),

  // CV metrics
  cvMetrics: Joi.object({
    stressScore: Joi.number().min(0).max(1).required(),
    fatigue: Joi.number().min(0).max(1),
    blinkRate: Joi.number().min(0).max(1),
    confidence: Joi.number().min(0).max(1).required(),
    timestamp: Joi.date().iso()
  }),

  // Audio metrics
  audioMetrics: Joi.object({
    speechRate: Joi.number().min(0).max(300),
    volume: Joi.number().min(0).max(1),
    pauseRatio: Joi.number().min(0).max(1),
    timestamp: Joi.date().iso()
  }),

  // Conversation creation
  conversationCreate: Joi.object({
    therapistId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
    tags: Joi.array().items(Joi.string().max(50)).max(10)
  }),

  // Conversation tags update
  conversationTagsUpdate: Joi.object({
    tags: Joi.array().items(Joi.string().max(50)).max(10).required()
  }),

  // Journal update
  journalUpdate: Joi.object({
    title: Joi.string().min(1).max(100),
    text: Joi.string().min(1).max(10000),
    moodTags: Joi.array().items(Joi.string().max(20)).max(10)
  }).min(1),

  // Habit update
  habitUpdate: Joi.object({
    title: Joi.string().min(1).max(100),
    description: Joi.string().max(500),
    frequency: Joi.string().valid('daily', 'weekly', 'custom'),
    target: Joi.number().min(1).max(365),
    category: Joi.string().max(50),
    reminderTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    isActive: Joi.boolean()
  }).min(1)
};

/**
 * Middleware to validate request body
 */
const validateBody = (schema) => validate(schema, 'body');

/**
 * Middleware to validate query parameters
 */
const validateQuery = (schema) => validate(schema, 'query');

/**
 * Middleware to validate URL parameters
 */
const validateParams = (schema) => validate(schema, 'params');

/**
 * Middleware to validate specific fields
 */
const validateField = (field, schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body[field]);
    
    if (error) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: `Invalid ${field}`,
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.body[field] = value;
    next();
  };
};

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateField,
  schemas
};
