import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TherapistSignup() {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [account, setAccount] = useState({ name: '', email: '', password: '', confirm: '' });
  const [app, setApp] = useState({ fullName: '', licenseNumber: '', specialization: '', yearsExperience: '', bio: '' });

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      // 1) Create user account (role will be 'user' on server)
      if (!account.name || !account.email || !account.password || account.password !== account.confirm) {
        setError('Check name/email/password');
        setLoading(false);
        return;
      }
      const signupRes = await fetch(`${API}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: account.name, email: account.email, password: account.password })
      });
      if (!signupRes.ok) {
        const msg = (await signupRes.json())?.error || 'Failed to create account';
        setError(msg);
        setLoading(false);
        return;
      }
      const { token } = await signupRes.json();

      // 2) Submit therapist application
      const applyRes = await fetch(`${API}/api/therapist/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fullName: app.fullName || account.name,
          licenseNumber: app.licenseNumber,
          specialization: app.specialization,
          yearsExperience: app.yearsExperience ? Number(app.yearsExperience) : null,
          bio: app.bio
        })
      });
      if (!applyRes.ok) {
        const msg = (await applyRes.json())?.error || 'Failed to submit application';
        setError(msg);
        setLoading(false);
        return;
      }

      // Success — send user to login
      navigate('/login?applied=1');
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <div>
          <h1>Therapist Signup</h1>
          <p>Create your account and submit your application for admin approval.</p>
        </div>
      </header>

      <div className="card" style={{ padding: '1rem', display: 'grid', gap: '1rem', maxWidth: 720 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn ${step===1?'btn-primary':''}`} onClick={() => setStep(1)}>1. Account</button>
          <button className={`btn ${step===2?'btn-primary':''}`} onClick={() => setStep(2)}>2. Application</button>
        </div>

        {error && <div style={{ color: 'crimson' }}>{error}</div>}

        {step === 1 ? (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <input className="input" placeholder="Full name" value={account.name} onChange={e => setAccount({ ...account, name: e.target.value })} />
            <input className="input" type="email" placeholder="Email" value={account.email} onChange={e => setAccount({ ...account, email: e.target.value })} />
            <input className="input" type="password" placeholder="Password" value={account.password} onChange={e => setAccount({ ...account, password: e.target.value })} />
            <input className="input" type="password" placeholder="Confirm Password" value={account.confirm} onChange={e => setAccount({ ...account, confirm: e.target.value })} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => setStep(2)}>Next</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <input className="input" placeholder="Legal full name" value={app.fullName} onChange={e => setApp({ ...app, fullName: e.target.value })} />
            <input className="input" placeholder="License number" value={app.licenseNumber} onChange={e => setApp({ ...app, licenseNumber: e.target.value })} />
            <input className="input" placeholder="Specialization" value={app.specialization} onChange={e => setApp({ ...app, specialization: e.target.value })} />
            <input className="input" type="number" placeholder="Years of experience" value={app.yearsExperience} onChange={e => setApp({ ...app, yearsExperience: e.target.value })} />
            <textarea className="input" rows={4} placeholder="Short professional bio" value={app.bio} onChange={e => setApp({ ...app, bio: e.target.value })} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? 'Submitting...' : 'Create & Apply'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
