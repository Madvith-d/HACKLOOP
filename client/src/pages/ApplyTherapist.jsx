import React, { useEffect, useState } from 'react';

export default function ApplyTherapist() {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const token = localStorage.getItem('authToken');
  const [form, setForm] = useState({ fullName: '', licenseNumber: '', specialization: '', yearsExperience: '', bio: '' });
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState(null);
  const [error, setError] = useState('');

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API}/api/therapist/application`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setApplication(json.application);
    } catch {}
  };

  useEffect(() => { fetchStatus(); }, []);

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/therapist/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : null })
      });
      if (!res.ok) {
        setError('Failed to submit application');
      } else {
        const json = await res.json();
        setApplication(json.application);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <div>
          <h1>Apply to Become a Therapist</h1>
          <p>Submit your credentials for admin review.</p>
        </div>
      </header>

      {application ? (
        <div className="card" style={{ padding: '1rem' }}>
          <div><strong>Status:</strong> {application.status}</div>
          <div><strong>Submitted:</strong> {new Date(application.submitted_at).toLocaleString()}</div>
          {application.reviewed_at && <div><strong>Reviewed:</strong> {new Date(application.reviewed_at).toLocaleString()}</div>}
          <div style={{ marginTop: 12, color: 'var(--color-muted-foreground)' }}>
            You will be notified once an admin reviews your application.
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '1rem', display: 'grid', gap: '0.75rem', maxWidth: 700 }}>
          <input className="input" placeholder="Full name" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
          <input className="input" placeholder="License number" value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} />
          <input className="input" placeholder="Specialization" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} />
          <input className="input" type="number" placeholder="Years of experience" value={form.yearsExperience} onChange={e => setForm({ ...form, yearsExperience: e.target.value })} />
          <textarea className="input" rows={4} placeholder="Short bio" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? 'Submitting...' : 'Submit application'}</button>
            {error && <span style={{ color: 'crimson' }}>{error}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
