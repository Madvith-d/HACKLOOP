const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

router.get('/', authMiddleware, async (req, res) => {
    try {
        const includeArchived = req.query.includeArchived === 'true';
        const rows = (await db.query(
            'select id, user_id as "userId", name, frequency, goal_per_week as "goalPerWeek", target_per_day as "targetPerDay", days_of_week as "daysOfWeek", color, archived, created_at as "createdAt" from habits where user_id=$1 and ($2::boolean or archived=false) order by created_at desc',
            [req.user.id, includeArchived]
        )).rows;
        res.json({ habits: rows });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, frequency, goalPerWeek, targetPerDay, daysOfWeek, color } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });
        const id = uuidv4();
        await db.query(
            'insert into habits (id, user_id, name, frequency, goal_per_week, target_per_day, days_of_week, color) values ($1,$2,$3,$4,$5,$6,$7,$8)',
            [id, req.user.id, name, frequency || 'daily', goalPerWeek ?? null, targetPerDay ?? null, Array.isArray(daysOfWeek) ? daysOfWeek : null, color || null]
        );
        const row = (await db.query('select id, user_id as "userId", name, frequency, goal_per_week as "goalPerWeek", target_per_day as "targetPerDay", days_of_week as "daysOfWeek", color, archived, created_at as "createdAt" from habits where id=$1', [id])).rows[0];
        res.status(201).json({ habit: row });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.patch('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, frequency, goalPerWeek, targetPerDay, daysOfWeek, color, archived } = req.body;
        const upd = await db.query(
            'update habits set name=coalesce($3,name), frequency=coalesce($4,frequency), goal_per_week=coalesce($5,goal_per_week), target_per_day=coalesce($6,target_per_day), days_of_week=coalesce($7,days_of_week), color=coalesce($8,color), archived=coalesce($9,archived) where id=$1 and user_id=$2 returning id, user_id as "userId", name, frequency, goal_per_week as "goalPerWeek", target_per_day as "targetPerDay", days_of_week as "daysOfWeek", color, archived, created_at as "createdAt"',
            [req.params.id, req.user.id, name || null, frequency || null, goalPerWeek ?? null, targetPerDay ?? null, Array.isArray(daysOfWeek) ? daysOfWeek : null, color || null, typeof archived === 'boolean' ? archived : null]
        );
        if (upd.rowCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ habit: upd.rows[0] });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const del = await db.query('delete from habits where id=$1 and user_id=$2', [req.params.id, req.user.id]);
        if (del.rowCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/:id/toggle', authMiddleware, async (req, res) => {
    try {
        const date = req.body?.date ? new Date(req.body.date) : new Date();
        const dateKey = date.toISOString().slice(0,10);
        const existing = await db.query('select id from habit_completions where habit_id=$1 and date_key=$2 order by timestamp desc limit 1', [req.params.id, dateKey]);
        if (existing.rowCount > 0) {
            await db.query('delete from habit_completions where id=$1', [existing.rows[0].id]);
            return res.json({ completed: false, date: dateKey });
        } else {
            const cid = uuidv4();
            await db.query('insert into habit_completions (id, habit_id, timestamp, date_key) values ($1,$2,now(),$3)', [cid, req.params.id, dateKey]);
            return res.json({ completed: true, date: dateKey, completionId: cid });
        }
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:id/stats', authMiddleware, async (req, res) => {
    try {
        const days = parseInt(req.query.days || '30', 10);
        const to = new Date();
        const from = new Date();
        from.setDate(to.getDate() - (days - 1));
        const comps = (await db.query('select date_key from habit_completions where habit_id=$1 and timestamp between $2 and $3', [req.params.id, from, to])).rows;
        const set = new Set(comps.map(c => c.date_key.toISOString().slice(0,10)));
        const dates = [];
        let currentStreak = 0, bestStreak = 0, running = 0;
        for (let i=0;i<days;i++){
            const d = new Date(to);
            d.setDate(to.getDate()-i);
            const key = d.toISOString().slice(0,10);
            const done = set.has(key);
            dates.push({ date: key, done });
            if (done) { running++; bestStreak = Math.max(bestStreak, running); if (i===0) currentStreak = 1; else if (currentStreak>0) currentStreak++; }
            else { if (i===0) currentStreak = 0; running = 0; }
        }
        const total = dates.filter(x=>x.done).length;
        res.json({ stats: { currentStreak, bestStreak, lastNDays: dates.reverse(), totalCompletions: total } });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/:id', authMiddleware, async (req, res) => {
    const row = (await db.query('select id, user_id as "userId", name, frequency, goal_per_week as "goalPerWeek", target_per_day as "targetPerDay", days_of_week as "daysOfWeek", color, archived, created_at as "createdAt" from habits where id=$1 and user_id=$2', [req.params.id, req.user.id])).rows[0];
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json({ habit: row });
});
router.get('/:id/completions', authMiddleware, async (req, res) => {
    try {
        const rows = (await db.query('select id, timestamp as "timestampISO", date_key as "dateKey" from habit_completions where habit_id=$1 order by timestamp desc', [req.params.id])).rows;
        res.json({ completions: rows });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/:id/complete', authMiddleware, async (req, res) => {
    try {
        const ts = req.body?.timestamp ? new Date(req.body.timestamp) : new Date();
        const cid = uuidv4();
        const dateKey = ts.toISOString().slice(0,10);
        await db.query('insert into habit_completions (id, habit_id, timestamp, date_key) values ($1,$2,$3,$4)', [cid, req.params.id, ts, dateKey]);
        res.status(201).json({ completion: { id: cid, timestampISO: ts.toISOString(), dateKey } });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.delete('/:id/completions/:completionId', authMiddleware, async (req, res) => {
    try {
        const del = await db.query('delete from habit_completions where id=$1', [req.params.completionId]);
        if (del.rowCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/summary/all', authMiddleware, async (req, res) => {
    try {
        const habits = (await db.query('select id, user_id as "userId", name from habits where user_id=$1', [req.user.id])).rows;
        const results = [];
        const to = new Date();
        for (const h of habits) {
            const comps = (await db.query('select date_key from habit_completions where habit_id=$1', [h.id])).rows;
            const set = new Set(comps.map(c => c.date_key.toISOString().slice(0,10)));
            let bestStreak = 0, running = 0;
            for (let i=0;i<90;i++){ const d = new Date(to); d.setDate(to.getDate()-i); const key = d.toISOString().slice(0,10); if (set.has(key)) { running++; bestStreak=Math.max(bestStreak,running);} else { running=0; } }
            results.push({ habit: h, stats: { bestStreak } });
        }
        res.json({ summary: results });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
