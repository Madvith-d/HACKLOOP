const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.get('/my-sessions', authMiddleware, async (req, res) => {
    try {
        const rows = (await db.query('select * from sessions where user_id=$1 or therapist_id=$1 order by coalesce(started_at, scheduled_date) desc', [req.user.id])).rows;
        res.json({ sessions: rows });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const row = (await db.query('select * from sessions where id=$1', [req.params.id])).rows[0];
        if (!row) return res.status(404).json({ error: 'Session not found' });
        if (row.user_id !== req.user.id && row.therapist_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json({ session: row });
    } catch (error) {
        console.error('Error fetching session:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.patch('/:id', authMiddleware, async (req, res) => {
    try {
        const current = (await db.query('select * from sessions where id=$1', [req.params.id])).rows[0];
        if (!current) return res.status(404).json({ error: 'Session not found' });
        if (current.user_id !== req.user.id && current.therapist_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
        const { emotionData, status, notes } = req.body;
        let emotionJson = current.emotion_data || [];
        if (Array.isArray(emotionData) && emotionData.length > 0) {
            emotionJson = [...emotionJson, ...emotionData];
        }
        const upd = await db.query('update sessions set emotion_data=$2::jsonb, status=coalesce($3,status), notes=coalesce($4,notes) where id=$1 returning *', [req.params.id, JSON.stringify(emotionJson), status || null, notes || null]);
        res.json({ session: upd.rows[0] });
    } catch (error) {
        console.error('Error updating session:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/:id/complete', authMiddleware, async (req, res) => {
    try {
        const current = (await db.query('select * from sessions where id=$1', [req.params.id])).rows[0];
        if (!current) return res.status(404).json({ error: 'Session not found' });
        if (current.user_id !== req.user.id && current.therapist_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
        const { emotionTimeline, videoCallData, notes } = req.body;
        let emotionJson = current.emotion_data || [];
        if (Array.isArray(emotionTimeline) && emotionTimeline.length > 0) {
            emotionJson = [...emotionJson, ...emotionTimeline];
        }
        const upd = await db.query('update sessions set status=$2, completed_at=now(), video_call_data=$3::jsonb, notes=coalesce($4,notes), duration=coalesce($5,duration), emotion_data=$6::jsonb where id=$1 returning *', [
            req.params.id,
            'completed',
            videoCallData ? JSON.stringify(videoCallData) : null,
            notes || null,
            (videoCallData && videoCallData.duration) ? videoCallData.duration : null,
            JSON.stringify(emotionJson)
        ]);
        res.json({ session: upd.rows[0], message: 'Session completed successfully' });
    } catch (error) {
        console.error('Error completing session:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { therapistId, patientId, roomId } = req.body;
        const id = uuidv4();
        const userId = patientId || req.user.id;
        const thId = therapistId || req.user.id;
        await db.query('insert into sessions (id, user_id, therapist_id, room_id, status, started_at) values ($1,$2,$3,$4,$5,now())', [
            id, userId, thId, roomId || `room-${Date.now()}`, 'active'
        ]);
        const row = (await db.query('select * from sessions where id=$1', [id])).rows[0];
        res.status(201).json({ session: row });
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add session notes (therapist only)
router.post('/:id/notes', authMiddleware, async (req, res) => {
    try {
        const { notes } = req.body;

        if (!notes) {
            return res.status(400).json({ error: 'Notes are required' });
        }

        const current = (await db.query('select * from sessions where id=$1', [req.params.id])).rows[0];
        if (!current) return res.status(404).json({ error: 'Session not found' });

        // Check if user is the therapist for this session
        if (current.therapist_id !== req.user.id && req.user.role !== 'therapist') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const updated = await db.query(
            'update sessions set notes = $1 where id = $2 returning *',
            [notes, req.params.id]
        );

        res.json({ session: updated.rows[0], message: 'Session notes saved' });
    } catch (error) {
        console.error('Error saving session notes:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get patient data for a session (therapist only)
router.get('/:id/patient-data', authMiddleware, async (req, res) => {
    try {
        const current = (await db.query('select * from sessions where id=$1', [req.params.id])).rows[0];
        if (!current) return res.status(404).json({ error: 'Session not found' });

        // Check if user is the therapist for this session
        if (current.therapist_id !== req.user.id && req.user.role !== 'therapist') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const patientId = current.user_id;

        // Get patient's recent emotions
        const emotions = await db.query(
            'select * from emotions where user_id = $1 order by timestamp desc limit 20',
            [patientId]
        );

        // Get patient's recent journal entries (only shared ones)
        const journals = await db.query(
            `select * from journals where user_id = $1 
             and (tags @> '"shared_with_therapist"' or tags @> '"shared"')
             order by created_at desc limit 10`,
            [patientId]
        );

        // Get patient's session history with this therapist
        const sessionHistory = await db.query(
            'select * from sessions where user_id = $1 and therapist_id = $2 order by completed_at desc limit 5',
            [patientId, current.therapist_id]
        );

        res.json({
            emotions: emotions.rows,
            journals: journals.rows,
            sessionHistory: sessionHistory.rows
        });
    } catch (error) {
        console.error('Error fetching patient data:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
