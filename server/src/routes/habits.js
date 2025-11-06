const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const dataStore = require('../utils/dataStore');

router.get('/', authMiddleware, (req, res) => {
    try {
        const includeArchived = req.query.includeArchived === 'true';
        const habits = dataStore.listHabits(req.user.id, { includeArchived });
        res.json({ habits });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', authMiddleware, (req, res) => {
    try {
        const { name, frequency, goalPerWeek, targetPerDay, daysOfWeek, color } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });
        const habit = dataStore.createHabit({
            userId: req.user.id,
            name,
            frequency,
            goalPerWeek,
            targetPerDay,
            daysOfWeek,
            color
        });
        res.status(201).json({ habit });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.patch('/:id', authMiddleware, (req, res) => {
    try {
        const habit = dataStore.updateHabit(req.params.id, req.user.id, req.body);
        if (!habit) return res.status(404).json({ error: 'Not found' });
        res.json({ habit });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/:id', authMiddleware, (req, res) => {
    try {
        const ok = dataStore.deleteHabit(req.params.id, req.user.id);
        if (!ok) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/:id/toggle', authMiddleware, (req, res) => {
    try {
        const { date } = req.body;
        const result = dataStore.toggleHabitCompletion(req.params.id, req.user.id, date);
        if (!result) return res.status(404).json({ error: 'Not found' });
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:id/stats', authMiddleware, (req, res) => {
    try {
        const days = parseInt(req.query.days || '30', 10);
        const stats = dataStore.getHabitStats(req.params.id, req.user.id, days);
        if (!stats) return res.status(404).json({ error: 'Not found' });
        res.json({ stats });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/:id', authMiddleware, (req, res) => {
    const habit = dataStore.listHabits(req.user.id).find(h => h.id === req.params.id);
    if (!habit) return res.status(404).json({ error: 'Not found' });
    res.json({ habit });
});
router.get('/:id/completions', authMiddleware, (req, res) => {
    try {
        const { from, to } = req.query;
        const comps = dataStore.getHabitCompletions(req.params.id, req.user.id, { from, to });
        if (!comps) return res.status(404).json({ error: 'Not found' });
        res.json({ completions: comps });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/:id/complete', authMiddleware, (req, res) => {
    try {
        const { timestamp } = req.body || {};
        const c = dataStore.addHabitCompletion(req.params.id, req.user.id, timestamp);
        if (!c) return res.status(404).json({ error: 'Not found' });
        res.status(201).json({ completion: c });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.delete('/:id/completions/:completionId', authMiddleware, (req, res) => {
    try {
        const ok = dataStore.removeHabitCompletion(req.params.id, req.user.id, req.params.completionId);
        if (!ok) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/summary/all', authMiddleware, (req, res) => {
    try {
        const summary = dataStore.getHabitSummary(req.user.id);
        res.json({ summary });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
