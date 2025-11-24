const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
    try {
        const therapists = (await db.query('select id, name, specialty, rating, reviews, experience, location, avatar, price, available from therapists order by name asc')).rows;
        res.json({ therapists });
    } catch (error) {
        console.error('Error fetching therapists:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const therapist = (await db.query('select id, name, specialty, rating, reviews, experience, location, avatar, price, available from therapists where id=$1', [req.params.id])).rows[0];
        if (!therapist) {
            return res.status(404).json({ error: 'Therapist not found' });
        }
        res.json({ therapist });
    } catch (error) {
        console.error('Error fetching therapist:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/:id/book', authMiddleware, async (req, res) => {
    try {
        const { date, time } = req.body;
        const therapistId = req.params.id;
        if (!date || !time) {
            return res.status(400).json({ error: 'Missing date or time' });
        }
        const therapist = (await db.query('select id, name, price from therapists where id=$1', [therapistId])).rows[0];
        if (!therapist) return res.status(404).json({ error: 'Therapist not found' });

        const bookingId = uuidv4();
        await db.query('insert into bookings (id, user_id, therapist_id, therapist_name, date, time, price, status) values ($1,$2,$3,$4,$5,$6,$7,$8)', [
            bookingId, req.user.id, therapistId, therapist.name, date, time, therapist.price, 'confirmed'
        ]);

        const sessionId = uuidv4();
        await db.query('insert into sessions (id, booking_id, user_id, therapist_id, therapist_name, status, scheduled_date, scheduled_time) values ($1,$2,$3,$4,$5,$6,$7,$8)', [
            sessionId, bookingId, req.user.id, therapistId, therapist.name, 'scheduled', date, time
        ]);

        const booking = (await db.query('select * from bookings where id=$1', [bookingId])).rows[0];
        const session = (await db.query('select * from sessions where id=$1', [sessionId])).rows[0];
        res.status(201).json({ booking, session, message: 'Session booked successfully' });
    } catch (error) {
        console.error('Error booking session:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:id/bookings', authMiddleware, async (req, res) => {
    try {
        const therapistId = req.params.id;
        if (req.user.role !== 'therapist' && req.user.id !== therapistId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const bookings = (await db.query('select * from bookings where therapist_id=$1 order by date desc', [therapistId])).rows;
        res.json({ bookings });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get logged-in therapist's profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'therapist') {
            return res.status(403).json({ error: 'Access denied. Therapist role required.' });
        }

        const therapist = (await db.query(
            'select id, user_id, name, specialty, rating, reviews, experience, location, avatar, price, available from therapists where user_id=$1',
            [req.user.id]
        )).rows[0];

        if (!therapist) {
            return res.status(404).json({ error: 'Therapist profile not found' });
        }

        res.json({ therapist });
    } catch (error) {
        console.error('Error fetching therapist profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update logged-in therapist's profile
router.patch('/profile', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'therapist') {
            return res.status(403).json({ error: 'Access denied. Therapist role required.' });
        }

        const { specialty, experience, location, price, available } = req.body;

        // Build update query dynamically based on provided fields
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (specialty !== undefined) {
            updates.push(`specialty=$${paramCount++}`);
            values.push(specialty);
        }
        if (experience !== undefined) {
            updates.push(`experience=$${paramCount++}`);
            values.push(experience);
        }
        if (location !== undefined) {
            updates.push(`location=$${paramCount++}`);
            values.push(location);
        }
        if (price !== undefined) {
            updates.push(`price=$${paramCount++}`);
            values.push(price);
        }
        if (available !== undefined) {
            updates.push(`available=$${paramCount++}`);
            values.push(available);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(req.user.id);
        const query = `update therapists set ${updates.join(', ')} where user_id=$${paramCount} returning *`;

        const result = await db.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Therapist profile not found' });
        }

        res.json({ therapist: result.rows[0], message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating therapist profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get therapist's bookings (for logged-in therapist)
router.get('/my-bookings', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'therapist') {
            return res.status(403).json({ error: 'Access denied. Therapist role required.' });
        }

        // Get therapist id from user_id
        const therapist = (await db.query('select id from therapists where user_id=$1', [req.user.id])).rows[0];

        if (!therapist) {
            return res.status(404).json({ error: 'Therapist profile not found' });
        }

        const bookings = (await db.query(
            'select * from bookings where therapist_id=$1 order by date desc, time desc',
            [therapist.id]
        )).rows;

        res.json({ bookings });
    } catch (error) {
        console.error('Error fetching therapist bookings:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
