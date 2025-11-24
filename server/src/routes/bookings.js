const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// Get user's bookings
router.get('/my-bookings', authMiddleware, async (req, res) => {
    try {
        const bookings = await db.query(
            'SELECT * FROM bookings WHERE user_id = $1 ORDER BY date DESC, time DESC',
            [req.user.id]
        );
        res.json({ bookings: bookings.rows });
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get booking by ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const booking = await db.query(
            'SELECT * FROM bookings WHERE id = $1',
            [req.params.id]
        );

        if (booking.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const bookingData = booking.rows[0];

        // Check authorization
        if (bookingData.user_id !== req.user.id && req.user.role !== 'therapist') {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json({ booking: bookingData });
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update booking status
router.patch('/:id/status', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const booking = await db.query(
            'SELECT * FROM bookings WHERE id = $1',
            [req.params.id]
        );

        if (booking.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const bookingData = booking.rows[0];

        // Check authorization
        if (bookingData.user_id !== req.user.id && req.user.role !== 'therapist') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const updated = await db.query(
            'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );

        res.json({ booking: updated.rows[0], message: 'Booking status updated' });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Reschedule booking
router.post('/:id/reschedule', authMiddleware, async (req, res) => {
    try {
        const { date, time } = req.body;

        if (!date || !time) {
            return res.status(400).json({ error: 'Date and time are required' });
        }

        const booking = await db.query(
            'SELECT * FROM bookings WHERE id = $1',
            [req.params.id]
        );

        if (booking.rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const bookingData = booking.rows[0];

        // Only user can reschedule
        if (bookingData.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const updated = await db.query(
            'UPDATE bookings SET date = $1, time = $2, status = $3 WHERE id = $4 RETURNING *',
            [date, time, 'confirmed', req.params.id]
        );

        // Also update the associated session if it exists
        await db.query(
            'UPDATE sessions SET scheduled_date = $1, scheduled_time = $2 WHERE booking_id = $3',
            [date, time, req.params.id]
        );

        res.json({ booking: updated.rows[0], message: 'Booking rescheduled successfully' });
    } catch (error) {
        console.error('Error rescheduling booking:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
