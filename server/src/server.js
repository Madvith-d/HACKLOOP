require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const therapistRoutes = require('./routes/therapists');
const sessionRoutes = require('./routes/sessions');
const emotionRoutes = require('./routes/emotions');
const userRoutes = require('./routes/users');
const journalRoutes = require('./routes/journal');
const habitRoutes = require('./routes/habits');
const chatRoutes = require('./routes/chat');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const therapistNotification = require('./utils/therapistNotification');
const app = express();
const server = http.createServer(app);

// Initialize Postgres schema
(async () => {
    try {
        const db = require('./db');
        await db.init();
        logger.info('Postgres schema ready');
    } catch (e) {
        logger.error('DB init failed:', e);
    }
})();

const io = socketIo(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://192.168.31.72:5173'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

therapistNotification.setIoInstance(io);
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://192.168.31.72:5173'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
});

// Routes
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: require('../package.json').version
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/therapists', therapistRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/emotions', emotionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/therapist', require('./routes/therapistApplications'));

const rooms = new Map();
io.on('connection', (socket) => {
    logger.info('Client connected:', socket.id);
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
        }
        rooms.get(roomId).add(userId);
        socket.to(roomId).emit('user-connected', userId);
        logger.info(`User ${userId} joined room ${roomId}`);
    });

    socket.on('offer', (data) => {
        logger.debug('Relaying offer to room:', data.roomId);
        socket.to(data.roomId).emit('offer', data);
    });

    socket.on('answer', (data) => {
        logger.debug('Relaying answer to room:', data.roomId);
        socket.to(data.roomId).emit('answer', data);
    });

    socket.on('ice-candidate', (data) => {
        logger.debug('Relaying ICE candidate to room:', data.roomId);
        socket.to(data.roomId).emit('ice-candidate', data);
    });

    socket.on('disconnect', () => {
        logger.info('Client disconnected:', socket.id);
        rooms.forEach((users, roomId) => {
            if (users.has(socket.id)) {
                users.delete(socket.id);
                if (users.size === 0) {
                    rooms.delete(roomId);
                }
            }
        });
    });
});
// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => {
    logger.info(`MindMesh+ Backend Server running on http://localhost:${PORT}`);
    logger.info(`Network access: http://192.168.31.72:${PORT}`);
    logger.info('WebRTC signaling active');
    logger.info(`Health check: http://localhost:${PORT}/health`);
});

module.exports = { app, io };
