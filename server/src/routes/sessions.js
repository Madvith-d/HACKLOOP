const express = require('express');
const router = express.Router();
const dataStore = require('../utils/dataStore');
const authMiddleware = require('../middleware/auth');

router.get('/my-sessions', authMiddleware, (req, res) => {
    try {
        const sessions = dataStore.getUserSessions(req.user.id);
        res.json({ sessions });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/:id', authMiddleware, (req, res) => {
    try {
        const session = dataStore.getSessionById(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        if (session.userId !== req.user.id && session.therapistId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({ session });
    } catch (error) {
        console.error('Error fetching session:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.patch('/:id', authMiddleware, (req, res) => {
    try {
        const session = dataStore.getSessionById(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        if (session.userId !== req.user.id && session.therapistId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const { emotionData, status, notes } = req.body;
        if (emotionData && Array.isArray(emotionData)) {
            dataStore.addEmotionDataToSession(req.params.id, emotionData);
        }
        const updates = {};
        if (status) updates.status = status;
        if (notes) updates.notes = notes;

        const updatedSession = dataStore.updateSession(req.params.id, updates);
        res.json({ session: updatedSession });
    } catch (error) {
        console.error('Error updating session:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/:id/complete', authMiddleware, (req, res) => {
    try {
        const session = dataStore.getSessionById(req.params.id);
        
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        if (session.userId !== req.user.id && session.therapistId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { emotionTimeline, videoCallData, notes } = req.body;
        if (emotionTimeline && Array.isArray(emotionTimeline)) {
            dataStore.addEmotionDataToSession(req.params.id, emotionTimeline);
        }
        const updatedSession = dataStore.updateSession(req.params.id, {
            status: 'completed',
            completedAt: new Date().toISOString(),
            videoCallData,
            notes,
            duration: videoCallData?.duration || 0
        });

        res.json({ 
            session: updatedSession,
            message: 'Session completed successfully'
        });
    } catch (error) {
        console.error('Error completing session:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/create', authMiddleware, (req, res) => {
    try {
        const { therapistId, patientId, roomId } = req.body;

        const session = dataStore.createSession({
            userId: patientId || req.user.id,
            therapistId: therapistId || req.user.id,
            roomId: roomId || `room-${Date.now()}`,
            status: 'active',
            startedAt: new Date().toISOString()
        });

        res.status(201).json({ session });
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
