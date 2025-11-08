const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

// Validation chains
const validateSignup = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('role')
        .optional()
        .isIn(['user', 'therapist', 'admin'])
        .withMessage('Role must be user, therapist, or admin'),
    handleValidationErrors
];

const validateLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    body('role')
        .optional()
        .isIn(['user', 'therapist', 'admin'])
        .withMessage('Role must be user, therapist, or admin'),
    handleValidationErrors
];

const validateJournalEntry = [
    body('title')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Title must be between 1 and 200 characters'),
    body('content')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Content is required'),
    body('mood')
        .optional()
        .isFloat({ min: 1, max: 10 })
        .withMessage('Mood must be between 1 and 10'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
    handleValidationErrors
];

const validateHabit = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Habit name must be between 1 and 100 characters'),
    body('frequency')
        .isIn(['daily', 'weekly', 'monthly'])
        .withMessage('Frequency must be daily, weekly, or monthly'),
    body('goal_per_week')
        .optional()
        .isInt({ min: 1, max: 7 })
        .withMessage('Goal per week must be between 1 and 7'),
    body('target_per_day')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Target per day must be at least 1'),
    handleValidationErrors
];

const validateBooking = [
    body('therapist_id')
        .isUUID()
        .withMessage('Valid therapist ID is required'),
    body('date')
        .isISO8601()
        .withMessage('Valid date is required'),
    body('time')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Time must be in HH:MM format'),
    handleValidationErrors
];

const validateEmotionEntry = [
    body('emotion')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Emotion must be between 1 and 50 characters'),
    body('confidence')
        .optional()
        .isFloat({ min: 0, max: 1 })
        .withMessage('Confidence must be between 0 and 1'),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Notes must be less than 500 characters'),
    handleValidationErrors
];

const validateUUID = [
    param('id')
        .isUUID()
        .withMessage('Valid UUID is required'),
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateSignup,
    validateLogin,
    validateJournalEntry,
    validateHabit,
    validateBooking,
    validateEmotionEntry,
    validateUUID
};