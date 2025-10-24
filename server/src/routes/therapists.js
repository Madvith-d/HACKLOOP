const express = require('express');
const router = express.Router();
const dataStore = require('../utils/dataStore');
const authMiddleware = require('../middleware/auth');
router.get('/', (req, res) => {
    try {
        const therapists = dataStore.getAllTherapists();
        res.json({ therapists });
    } catch (error) {
        console.error('Error fetching therapists:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/:id', (req, res) => {
    try {
        const therapist = dataStore.getTherapistById(req.params.id);
        
        if (!therapist) {
            return res.status(404).json({ error: 'Therapist not found' });
        }

        res.json({ therapist });
    } catch (error) {
        console.error('Error fetching therapist:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/:id/book', authMiddleware, (req, res) => {
    try {
        const { date, time } = req.body;
        const therapistId = req.params.id;

        if (!date || !time) {
            return res.status(400).json({ error: 'Missing date or time' });
        }

        const therapist = dataStore.getTherapistById(therapistId);
        if (!therapist) {
            return res.status(404).json({ error: 'Therapist not found' });
        }
        const booking = dataStore.createBooking({
            userId: req.user.id,
            therapistId,
            therapistName: therapist.name,
            date,
            time,
            price: therapist.price
        });
        const session = dataStore.createSession({
            bookingId: booking.id,
            userId: req.user.id,
            therapistId,
            therapistName: therapist.name,
            scheduledDate: date,
            scheduledTime: time,
            status: 'scheduled'
        });

        res.status(201).json({ 
            booking,
            session,
            message: 'Session booked successfully'
        });
    } catch (error) {
        console.error('Error booking session:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/:id/bookings', authMiddleware, (req, res) => {
    try {
        const therapistId = req.params.id;
        if (req.user.role !== 'therapist' && req.user.id !== therapistId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const bookings = dataStore.getTherapistBookings(therapistId);
        res.json({ bookings });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
