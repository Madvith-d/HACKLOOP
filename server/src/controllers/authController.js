const admin = require('../config/firebase');
const logger = require('../utils/logger');
const { User } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');

class AuthController {
  /**
   * Sign up a new user
   * POST /api/auth/signup
   */
  signup = asyncHandler(async (req, res) => {
    const { email, password, name, role = 'user' } = req.body;

    try {
      // Create user in Firebase Auth
      const firebaseUser = await admin.auth().createUser({
        email,
        password,
        displayName: name,
        emailVerified: false
      });

      // Create user in MongoDB
      const user = new User({
        firebaseUid: firebaseUser.uid,
        email,
        name,
        role,
        onboarded: false
      });

      await user.save();

      // Generate custom token for client
      const customToken = await admin.auth().createCustomToken(firebaseUid);

      logger.info('User signed up successfully', {
        userId: user._id,
        firebaseUid: firebaseUser.uid,
        email,
        role
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            onboarded: user.onboarded
          },
          customToken
        }
      });

    } catch (error) {
      logger.error('Signup error:', error);

      // Clean up Firebase user if MongoDB save fails
      if (firebaseUser?.uid) {
        try {
          await admin.auth().deleteUser(firebaseUser.uid);
        } catch (cleanupError) {
          logger.error('Failed to cleanup Firebase user:', cleanupError);
        }
      }

      if (error.code === 'auth/email-already-exists') {
        return res.status(400).json({
          error: 'EMAIL_EXISTS',
          message: 'An account with this email already exists'
        });
      }

      if (error.code === 'auth/invalid-email') {
        return res.status(400).json({
          error: 'INVALID_EMAIL',
          message: 'Invalid email format'
        });
      }

      if (error.code === 'auth/weak-password') {
        return res.status(400).json({
          error: 'WEAK_PASSWORD',
          message: 'Password is too weak'
        });
      }

      throw error;
    }
  });

  /**
   * Sign in existing user
   * POST /api/auth/signin
   */
  signin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    try {
      // Sign in with Firebase Auth
      const signInResult = await admin.auth().getUserByEmail(email);
      
      if (!signInResult) {
        return res.status(401).json({
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        });
      }

      // Get user from MongoDB
      const user = await User.findOne({ firebaseUid: signInResult.uid });
      
      if (!user) {
        return res.status(401).json({
          error: 'USER_NOT_FOUND',
          message: 'User account not found'
        });
      }

      // Generate custom token
      const customToken = await admin.auth().createCustomToken(signInResult.uid);

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      logger.info('User signed in successfully', {
        userId: user._id,
        firebaseUid: signInResult.uid,
        email
      });

      res.json({
        success: true,
        message: 'Sign in successful',
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            onboarded: user.onboarded,
            lastLoginAt: user.lastLoginAt
          },
          customToken
        }
      });

    } catch (error) {
      logger.error('Signin error:', error);

      if (error.code === 'auth/user-not-found') {
        return res.status(401).json({
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        });
      }

      throw error;
    }
  });

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  getMe = asyncHandler(async (req, res) => {
    const user = await User.findOne({ firebaseUid: req.user.uid })
      .select('-firebaseUid')
      .populate('profileId', 'onboarded demographics preferences consents');

    if (!user) {
      return res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'User profile not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          onboarded: user.onboarded,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          profile: user.profileId
        }
      }
    });
  });

  /**
   * Refresh authentication token
   * POST /api/auth/refresh
   */
  refresh = asyncHandler(async (req, res) => {
    const { uid } = req.user;

    try {
      // Generate new custom token
      const customToken = await admin.auth().createCustomToken(uid);

      logger.info('Token refreshed successfully', {
        firebaseUid: uid
      });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          customToken
        }
      });

    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  });

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  updateProfile = asyncHandler(async (req, res) => {
    const { name, role } = req.body;
    const userId = req.user.userId;

    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          error: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }

      // Update Firebase user if name changed
      if (name && name !== user.name) {
        await admin.auth().updateUser(req.user.uid, {
          displayName: name
        });
        user.name = name;
      }

      // Only admins can change roles
      if (role && req.user.role === 'admin' && role !== user.role) {
        user.role = role;
      }

      await user.save();

      logger.info('User profile updated', {
        userId: user._id,
        firebaseUid: req.user.uid,
        changes: { name, role }
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            onboarded: user.onboarded
          }
        }
      });

    } catch (error) {
      logger.error('Profile update error:', error);
      throw error;
    }
  });

  /**
   * Delete user account
   * DELETE /api/auth/account
   */
  deleteAccount = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const firebaseUid = req.user.uid;

    try {
      // Delete from MongoDB first
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          error: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }

      // TODO: Delete related data (conversations, messages, etc.)
      // This should be handled by a background job for data cleanup

      await User.findByIdAndDelete(userId);

      // Delete from Firebase Auth
      await admin.auth().deleteUser(firebaseUid);

      logger.info('User account deleted', {
        userId,
        firebaseUid
      });

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });

    } catch (error) {
      logger.error('Account deletion error:', error);
      throw error;
    }
  });

  /**
   * Send password reset email
   * POST /api/auth/password-reset
   */
  passwordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;

    try {
      // Generate password reset link
      const resetLink = await admin.auth().generatePasswordResetLink(email);

      // In a real application, you'd send this via email service
      logger.info('Password reset link generated', {
        email,
        resetLink
      });

      res.json({
        success: true,
        message: 'Password reset email sent',
        // Remove in production - only for development
        ...(process.env.NODE_ENV === 'development' && { resetLink })
      });

    } catch (error) {
      logger.error('Password reset error:', error);

      if (error.code === 'auth/user-not-found') {
        return res.status(404).json({
          error: 'USER_NOT_FOUND',
          message: 'No account found with this email'
        });
      }

      throw error;
    }
  });

  /**
   * Verify email address
   * POST /api/auth/verify-email
   */
  verifyEmail = asyncHandler(async (req, res) => {
    const { uid } = req.user;

    try {
      // Generate email verification link
      const verificationLink = await admin.auth().generateEmailVerificationLink(req.user.email);

      logger.info('Email verification link generated', {
        uid,
        email: req.user.email
      });

      res.json({
        success: true,
        message: 'Email verification link generated',
        // Remove in production - only for development
        ...(process.env.NODE_ENV === 'development' && { verificationLink })
      });

    } catch (error) {
      logger.error('Email verification error:', error);
      throw error;
    }
  });

  /**
   * Get user statistics (admin only)
   * GET /api/auth/stats
   */
  getStats = asyncHandler(async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const onboardedUsers = await User.countDocuments({ onboarded: true });
      const therapists = await User.countDocuments({ role: 'therapist' });
      const recentUsers = await User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });

      res.json({
        success: true,
        data: {
          totalUsers,
          onboardedUsers,
          therapists,
          recentUsers,
          onboardedPercentage: totalUsers > 0 ? Math.round((onboardedUsers / totalUsers) * 100) : 0
        }
      });

    } catch (error) {
      logger.error('Stats retrieval error:', error);
      throw error;
    }
  });
}

module.exports = new AuthController();
