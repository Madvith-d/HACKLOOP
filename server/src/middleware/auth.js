const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        logger.info('Auth middleware called', {
            path: req.path,
            hasAuthHeader: !!authHeader,
            authHeaderPrefix: authHeader?.substring(0, 20) + '...'
        });

        const token = authHeader?.replace('Bearer ', '');
        
        if (!token) {
            logger.warn('No token provided', { path: req.path });
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        logger.info('Token verified successfully', { userId: decoded.id, path: req.path });
        next();
    } catch (error) {
        logger.error('Token verification failed', { 
            error: error.message,
            path: req.path,
            errorName: error.name
        });
        return res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = authMiddleware;
