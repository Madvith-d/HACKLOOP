const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// Diagnostic endpoint to check therapist profile status
router.get('/diagnostic', authMiddleware, async (req, res) => {
    try {
        const results = {
            user: {
                id: req.user.id,
                role: req.user.role,
                email: req.user.email
            },
            therapistProfile: null,
            allTherapists: [],
            columnExists: false
        };

        // Check if user_id column exists in therapists table
        const columnCheck = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'therapists' AND column_name = 'user_id'
        `);
        results.columnExists = columnCheck.rows.length > 0;

        // Get all therapists
        const allTherapists = await db.query('SELECT id, name, user_id, specialty FROM therapists LIMIT 10');
        results.allTherapists = allTherapists.rows;

        // Try to find therapist profile for this user
        if (results.columnExists) {
            const profile = await db.query('SELECT * FROM therapists WHERE user_id = $1', [req.user.id]);
            results.therapistProfile = profile.rows[0] || null;
        }

        res.json(results);
    } catch (error) {
        console.error('Diagnostic error:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

// Helper endpoint to link current user to an existing therapist
router.post('/link-profile/:therapistId', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'therapist') {
            return res.status(403).json({ error: 'Only therapist accounts can be linked' });
        }

        const therapistId = req.params.therapistId;

        // Check if therapist exists
        const therapist = await db.query('SELECT * FROM therapists WHERE id = $1', [therapistId]);
        if (therapist.rows.length === 0) {
            return res.status(404).json({ error: 'Therapist not found' });
        }

        // Check if this therapist already has a user_id
        if (therapist.rows[0].user_id) {
            return res.status(400).json({ error: 'This therapist profile is already linked to another user' });
        }

        // Link the therapist to this user
        await db.query('UPDATE therapists SET user_id = $1 WHERE id = $2', [req.user.id, therapistId]);

        res.json({
            message: 'Profile linked successfully',
            therapist: therapist.rows[0],
            userId: req.user.id
        });
    } catch (error) {
        console.error('Error linking profile:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
