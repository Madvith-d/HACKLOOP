const admin = require('firebase-admin');
const logger = require('../utils/logger');
const dotenv = require('dotenv');
dotenv.config();
let firebaseInitialized = false;

// Initialize Firebase Admin SDK
try {
  // Check if required environment variables are present
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    logger.warn('Firebase environment variables not set. Firebase Admin SDK will not be initialized.');
    logger.warn('Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  } else {
    // Validate that the private key looks like a proper PEM key
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    
    // Check if it's a valid PEM formatted key
    if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----') || !privateKey.endsWith('-----END PRIVATE KEY-----\n')) {
      throw new Error('Invalid PEM formatted private key. Please ensure FIREBASE_PRIVATE_KEY is a valid service account private key.');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    
    firebaseInitialized = true;
    logger.info('Firebase Admin SDK initialized successfully');
  }
} catch (error) {
  logger.error('Failed to initialize Firebase Admin SDK:', error);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    logger.warn('Continuing without Firebase in development mode');
  }
}

// Export admin with initialization check
const firebaseAdmin = {
  ...admin,
  isInitialized: () => firebaseInitialized,
  requireAuth: () => {
    if (!firebaseInitialized) {
      throw new Error('Firebase Admin SDK not initialized. Please check your environment variables.');
    }
    return admin;
  }
};

module.exports = firebaseAdmin;
