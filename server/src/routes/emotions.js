const express = require('express');
const router = express.Router();
const dataStore = require('../utils/dataStore');
const authMiddleware = require('../middleware/auth');
router.get('/my-emotions', authMiddleware, (req, res) => {
    try {
        const emotions = dataStore.getUserEmotions(req.user.id);
        res.json({ emotions });
    } catch (error) {
        console.error('Error fetching emotions:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/', authMiddleware, (req, res) => {
    try {
        const { emotion, confidence, notes, context } = req.body;

        if (!emotion) {
            return res.status(400).json({ error: 'Emotion is required' });
        }

        const emotionRecord = dataStore.createEmotion({
            userId: req.user.id,
            emotion,
            confidence: confidence || 0,
            notes: notes || '',
            context: context || 'manual'
        });

        res.status(201).json({ 
            emotion: emotionRecord,
            message: 'Emotion recorded successfully'
        });
    } catch (error) {
        console.error('Error creating emotion:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/bulk', authMiddleware, (req, res) => {
    try {
        const { emotions } = req.body;

        if (!emotions || !Array.isArray(emotions)) {
            return res.status(400).json({ error: 'Emotions array is required' });
        }

        const createdEmotions = emotions.map(emotionData => {
            return dataStore.createEmotion({
                userId: req.user.id,
                ...emotionData
            });
        });

        res.status(201).json({ 
            emotions: createdEmotions,
            count: createdEmotions.length,
            message: 'Emotions recorded successfully'
        });
    } catch (error) {
        console.error('Error creating emotions:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/analytics', authMiddleware, (req, res) => {
    try {
        const emotions = dataStore.getUserEmotions(req.user.id);
        const emotionCounts = {};
        let totalConfidence = 0;

        emotions.forEach(e => {
            emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
            totalConfidence += (e.confidence || 0);
        });

        const mostFrequent = Object.entries(emotionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const avgConfidence = emotions.length > 0 ? totalConfidence / emotions.length : 0;

        res.json({
            totalRecords: emotions.length,
            emotionCounts,
            mostFrequentEmotions: mostFrequent.map(([emotion, count]) => ({
                emotion,
                count,
                percentage: ((count / emotions.length) * 100).toFixed(1)
            })),
            averageConfidence: avgConfidence.toFixed(2),
            recentEmotions: emotions.slice(0, 10)
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
