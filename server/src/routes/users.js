const express = require('express');
const router = express.Router();
const dataStore = require('../utils/dataStore');
const authMiddleware = require('../middleware/auth');
router.get('/me', authMiddleware, (req, res) => {
    try {
        const user = dataStore.getUserById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.patch('/me', authMiddleware, (req, res) => {
    try {
        const user = dataStore.getUserById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { name, avatar, phone, bio } = req.body;

        if (name) user.name = name;
        if (avatar) user.avatar = avatar;
        if (phone) user.phone = phone;
        if (bio) user.bio = bio;

        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/me/bookings', authMiddleware, (req, res) => {
    try {
        const bookings = dataStore.getUserBookings(req.user.id);
        res.json({ bookings });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
