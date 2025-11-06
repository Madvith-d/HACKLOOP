const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const existing = await db.query('select 1 from users where email=$1', [email]);
        if (existing.rowCount > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = uuidv4();
        const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;
        const roleFinal = role || 'user';
        await db.query('insert into users (id, name, email, password_hash, role, avatar) values ($1,$2,$3,$4,$5,$6)', [id, name, email, hashedPassword, roleFinal, avatar]);
        const token = jwt.sign(
            { id, email, role: roleFinal },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.status(201).json({
            user: { id, name, email, role: roleFinal, avatar },
            token
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const sel = await db.query('select id, name, email, password_hash, role, avatar from users where email=$1', [email]);
        if (sel.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' });
        const row = sel.rows[0];
        const isValidPassword = await bcrypt.compare(password, row.password_hash);
        if (!isValidPassword) return res.status(401).json({ error: 'Invalid credentials' });
        if (role && row.role !== role) return res.status(403).json({ error: 'Access denied for this role' });
        const token = jwt.sign(
            { id: row.id, email: row.email, role: row.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({
            user: { id: row.id, name: row.name, email: row.email, role: row.role, avatar: row.avatar },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const sel = await db.query('select id, name, email, role, avatar from users where id=$1', [decoded.id]);
        if (sel.rowCount === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ user: sel.rows[0] });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;
