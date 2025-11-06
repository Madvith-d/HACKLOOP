const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// User: submit application
router.post('/apply', auth, async (req, res) => {
  try {
    const { fullName, licenseNumber, specialization, yearsExperience, bio, documents } = req.body || {};
    // Upsert latest application as pending
    const id = uuidv4();
    await db.query(`
      create table if not exists therapist_applications (
        id uuid primary key,
        user_id uuid not null references users(id) on delete cascade,
        full_name text,
        license_number text,
        specialization text,
        years_experience int,
        bio text,
        documents jsonb,
        status text not null default 'pending',
        submitted_at timestamptz not null default now(),
        reviewed_at timestamptz,
        reviewer_id uuid
      )`);
    await db.query('insert into therapist_applications (id, user_id, full_name, license_number, specialization, years_experience, bio, documents, status) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [
      id, req.user.id, fullName || null, licenseNumber || null, specialization || null, yearsExperience || null, bio || null, documents ? JSON.stringify(documents) : null, 'pending'
    ]);
    const row = (await db.query('select * from therapist_applications where id=$1', [id])).rows[0];
    res.status(201).json({ application: row });
  } catch (e) {
    console.error('Therapist apply error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// User: get my latest application
router.get('/application', auth, async (req, res) => {
  try {
    const row = (await db.query('select * from therapist_applications where user_id=$1 order by submitted_at desc limit 1', [req.user.id])).rows[0];
    res.json({ application: row || null });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: list applications by status
router.get('/admin/therapist-applications', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const status = (req.query.status || 'pending').toString();
    const rows = (await db.query('select * from therapist_applications where status=$1 order by submitted_at asc', [status])).rows;
    res.json({ applications: rows });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: approve
router.post('/admin/therapist-applications/:id/approve', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const id = req.params.id;
    const app = (await db.query('update therapist_applications set status=$2, reviewed_at=now(), reviewer_id=$3 where id=$1 returning *', [id, 'approved', req.user.id])).rows[0];
    if (!app) return res.status(404).json({ error: 'Not found' });
    // Set user role
    await db.query("update users set role='therapist' where id=$1", [app.user_id]);
    // Link/create therapist profile
    const has = await db.query('select id from therapists where user_id=$1', [app.user_id]);
    if (has.rowCount === 0) {
      await db.query('insert into therapists (id, user_id, name, specialty, experience, price, available) values ($1,$2,$3,$4,$5,$6,$7)', [
        uuidv4(), app.user_id, app.full_name || 'Therapist', app.specialization || null, (app.years_experience ? app.years_experience + ' years' : null), 100, ['Mon','Wed']
      ]);
    }
    res.json({ application: app, updatedRole: 'therapist' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: reject
router.post('/admin/therapist-applications/:id/reject', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const id = req.params.id;
    const app = (await db.query('update therapist_applications set status=$2, reviewed_at=now(), reviewer_id=$3 where id=$1 returning *', [id, 'rejected', req.user.id])).rows[0];
    if (!app) return res.status(404).json({ error: 'Not found' });
    res.json({ application: app });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
