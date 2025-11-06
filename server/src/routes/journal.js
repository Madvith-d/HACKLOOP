const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const dataStore = require('../utils/dataStore');

router.get('/', authMiddleware, (req, res) => {
    try {
        const { from, to } = req.query;
        const entries = dataStore.listJournalEntries(req.user.id, { from, to });
        res.json({ entries });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:id', authMiddleware, (req, res) => {
    const entry = dataStore.getJournalEntry(req.params.id, req.user.id);
    if (!entry) return res.status(404).json({ error: 'Not found' });
    res.json({ entry });
});

router.post('/', authMiddleware, (req, res) => {
    try {
        const { title, content, mood, tags } = req.body;
        if (!content && !title) {
            return res.status(400).json({ error: 'Title or content is required' });
        }
        const entry = dataStore.createJournalEntry({
            userId: req.user.id,
            title,
            content,
            mood,
            tags
        });
        res.status(201).json({ entry });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.patch('/:id', authMiddleware, (req, res) => {
    try {
        const updated = dataStore.updateJournalEntry(req.params.id, req.user.id, req.body);
        if (!updated) return res.status(404).json({ error: 'Not found' });
        res.json({ entry: updated });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/:id', authMiddleware, (req, res) => {
    try {
        const ok = dataStore.deleteJournalEntry(req.params.id, req.user.id);
        if (!ok) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
