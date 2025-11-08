const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { validateSignup, validateLogin } = require('../middleware/validate');
const logger = require('../utils/logger');

// Signup
router.post('/signup', validateSignup, async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

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
        logger.info('User signed up:', { id, email, role: roleFinal });
        res.status(201).json({
            user: { id, name, email, role: roleFinal, avatar },
            token
        });
    } catch (error) {
        logger.error('Signup error:', error);
        next(error);
    }
});

// Login
router.post('/login', validateLogin, async (req, res, next) => {
    try {
        const { email, password, role } = req.body;

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
        logger.info('User logged in:', { id: row.id, email: row.email, role: row.role });
        res.json({
            user: { id: row.id, name: row.name, email: row.email, role: row.role, avatar: row.avatar },
            token
        });
    } catch (error) {
        logger.error('Login error:', error);
        next(error);
    }
});

router.get('/verify', async (req, res, next) => {
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
        logger.error('Token verification error:', error);
        next(error);
    }
});

module.exports = router;
