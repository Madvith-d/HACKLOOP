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

module.exports = router;
