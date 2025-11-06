const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const sel = await db.query('select id, name, email, role, avatar, created_at from users where id=$1', [req.user.id]);
        if (sel.rowCount === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ user: sel.rows[0] });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.patch('/me', authMiddleware, async (req, res) => {
    try {
        const { name, avatar, phone, bio } = req.body;
        const sel = await db.query('select id from users where id=$1', [req.user.id]);
        if (sel.rowCount === 0) return res.status(404).json({ error: 'User not found' });
        // store phone/bio in future schema; for now update name/avatar only
        const upd = await db.query('update users set name=coalesce($2,name), avatar=coalesce($3,avatar) where id=$1 returning id, name, email, role, avatar, created_at', [req.user.id, name || null, avatar || null]);
        res.json({ user: upd.rows[0] });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/me/bookings', authMiddleware, async (req, res) => {
    try {
        const bookings = (await db.query('select * from bookings where user_id=$1 order by date desc', [req.user.id])).rows;
        res.json({ bookings });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
