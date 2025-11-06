const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.get('/my-emotions', authMiddleware, async (req, res) => {
    try {
        const emotions = (await db.query('select id, user_id as "userId", emotion, confidence, notes, context, timestamp from emotions where user_id=$1 order by timestamp desc', [req.user.id])).rows;
        res.json({ emotions });
    } catch (error) {
        console.error('Error fetching emotions:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { emotion, confidence, notes, context } = req.body;
        if (!emotion) return res.status(400).json({ error: 'Emotion is required' });
        const id = uuidv4();
        await db.query('insert into emotions (id, user_id, emotion, confidence, notes, context) values ($1,$2,$3,$4,$5,$6)', [
            id, req.user.id, emotion, confidence ?? null, notes || '', context || 'manual'
        ]);
        const row = (await db.query('select id, user_id as "userId", emotion, confidence, notes, context, timestamp from emotions where id=$1', [id])).rows[0];
        res.status(201).json({ emotion: row, message: 'Emotion recorded successfully' });
    } catch (error) {
        console.error('Error creating emotion:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/bulk', authMiddleware, async (req, res) => {
    try {
        const { emotions } = req.body;
        if (!emotions || !Array.isArray(emotions)) {
            return res.status(400).json({ error: 'Emotions array is required' });
        }
        let count = 0;
        for (const e of emotions) {
            if (!e || !e.emotion) continue;
            await db.query('insert into emotions (id, user_id, emotion, confidence, notes, context) values ($1,$2,$3,$4,$5,$6)', [
                uuidv4(), req.user.id, e.emotion, e.confidence ?? null, e.notes || '', e.context || 'manual'
            ]);
            count++;
        }
        res.status(201).json({ count, message: 'Emotions recorded successfully' });
    } catch (error) {
        console.error('Error creating emotions:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/analytics', authMiddleware, async (req, res) => {
    try {
        const rows = (await db.query('select emotion, confidence from emotions where user_id=$1', [req.user.id])).rows;
        const emotionCounts = {};
        let totalConfidence = 0;
        for (const e of rows) {
            emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
            totalConfidence += (Number(e.confidence) || 0);
        }
        const mostFrequent = Object.entries(emotionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        const avgConfidence = rows.length > 0 ? totalConfidence / rows.length : 0;
        const recentEmotions = (await db.query('select id, emotion, confidence, timestamp from emotions where user_id=$1 order by timestamp desc limit 10', [req.user.id])).rows;
        res.json({
            totalRecords: rows.length,
            emotionCounts,
            mostFrequentEmotions: mostFrequent.map(([emotion, count]) => ({ emotion, count, percentage: ((count / rows.length) * 100).toFixed(1) })),
            averageConfidence: avgConfidence.toFixed(2),
            recentEmotions
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
