const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const db = require('../db');

router.get('/', authMiddleware, async (req, res) => {
    try {
        const { from, to } = req.query;
        const params = [req.user.id];
        let where = 'where user_id = $1';
        if (from) { params.push(from); where += ` and created_at >= $${params.length}`; }
        if (to) { params.push(to); where += ` and created_at <= $${params.length}`; }
        const q = `select id, user_id as "userId", title, content, mood, tags, created_at as "createdAt", updated_at as "updatedAt" from journals ${where} order by created_at desc`;
        const rows = (await db.query(q, params)).rows;
        res.json({ entries: rows });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:id', authMiddleware, async (req, res) => {
    const row = (await db.query('select id, user_id as "userId", title, content, mood, tags, created_at as "createdAt", updated_at as "updatedAt" from journals where id=$1 and user_id=$2', [req.params.id, req.user.id])).rows[0];
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json({ entry: row });
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, content, mood, tags } = req.body;
        if (!content && !title) {
            return res.status(400).json({ error: 'Title or content is required' });
        }
        const { v4: uuidv4 } = require('uuid');
        const id = uuidv4();
        const now = new Date();
        await db.query('insert into journals (id, user_id, title, content, mood, tags, created_at, updated_at) values ($1,$2,$3,$4,$5,$6,$7,$8)', [id, req.user.id, title || null, content || null, mood ?? null, tags ? JSON.stringify(tags) : null, now, now]);
        const row = (await db.query('select id, user_id as "userId", title, content, mood, tags, created_at as "createdAt", updated_at as "updatedAt" from journals where id=$1', [id])).rows[0];
        res.status(201).json({ entry: row });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.patch('/:id', authMiddleware, async (req, res) => {
    try {
        const { title, content, mood, tags } = req.body;
        const now = new Date();
        const upd = await db.query('update journals set title=coalesce($3,title), content=coalesce($4,content), mood=coalesce($5,mood), tags=coalesce($6::jsonb,tags), updated_at=$7 where id=$1 and user_id=$2 returning id, user_id as "userId", title, content, mood, tags, created_at as "createdAt", updated_at as "updatedAt"', [req.params.id, req.user.id, title || null, content || null, mood ?? null, tags ? JSON.stringify(tags) : null, now]);
        if (upd.rowCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ entry: upd.rows[0] });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const del = await db.query('delete from journals where id=$1 and user_id=$2', [req.params.id, req.user.id]);
        if (del.rowCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});


module.exports = router;
