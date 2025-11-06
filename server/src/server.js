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
const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/therapists', therapistRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/emotions', emotionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/habits', habitRoutes);

const rooms = new Map();
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
        }
        rooms.get(roomId).add(userId);
        socket.to(roomId).emit('user-connected', userId);
        console.log(`User ${userId} joined room ${roomId}`);
    });

    socket.on('offer', (data) => {
        console.log('Relaying offer to room:', data.roomId);
        socket.to(data.roomId).emit('offer', data);
    });

    socket.on('answer', (data) => {
        console.log('Relaying answer to room:', data.roomId);
        socket.to(data.roomId).emit('answer', data);
    });

    socket.on('ice-candidate', (data) => {
        console.log('Relaying ICE candidate to room:', data.roomId);
        socket.to(data.roomId).emit('ice-candidate', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
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
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`\nMindMesh+ Backend Server`);
    console.log(`Running on http://localhost:${PORT}`);
    console.log(`WebRTC signaling active`);
    console.log(`Health check: http://localhost:${PORT}/health\n`);
});

module.exports = { app, io };
