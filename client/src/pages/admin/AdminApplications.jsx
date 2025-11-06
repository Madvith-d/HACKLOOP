import React, { useEffect, useState } from 'react';

export default function AdminApplications() {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const token = localStorage.getItem('authToken');
  const [status, setStatus] = useState('pending');
  const [apps, setApps] = useState([]);

  const load = async () => {
    const res = await fetch(`${API}/api/therapist/admin/therapist-applications?status=${encodeURIComponent(status)}` , { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    setApps(json.applications || []);
  };

  useEffect(() => { load(); }, [status]);

  const act = async (id, action) => {
    await fetch(`${API}/api/therapist/admin/therapist-applications/${id}/${action}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    await load();
  };

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <div>
          <h1>Therapist Applications</h1>
          <p>Review and approve/reject applications</p>
        </div>
      </header>
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <label>Status: </label>
        <select className="input" value={status} onChange={e => setStatus(e.target.value)} style={{ maxWidth: 200, marginLeft: 8 }}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      {apps.length === 0 ? (
        <div className="card" style={{ padding: '1rem' }}>No applications.</div>
      ) : (
        <div className="dashboard-grid">
          {apps.map(a => (
            <div key={a.id} className="card" style={{ padding: '1rem' }}>
              <div><strong>Name:</strong> {a.full_name}</div>
              <div><strong>License:</strong> {a.license_number || '-'}</div>
              <div><strong>Specialization:</strong> {a.specialization || '-'}</div>
              <div><strong>Years:</strong> {a.years_experience ?? '-'}</div>
              <div><strong>Submitted:</strong> {new Date(a.submitted_at).toLocaleString()}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {status === 'pending' && (
                  <>
                    <button className="btn btn-primary" onClick={() => act(a.id, 'approve')}>Approve</button>
                    <button className="btn btn-danger" onClick={() => act(a.id, 'reject')}>Reject</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
