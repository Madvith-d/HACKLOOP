import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Trash2, Plus } from 'lucide-react';

export default function HabitDetail() {
    const { id } = useParams();
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const token = localStorage.getItem('authToken');
    const [habit, setHabit] = useState(null);
    const [stats, setStats] = useState(null);
    const [completions, setCompletions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const headers = useMemo(() => token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {}, [token]);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            if (!token) {
                setError('Login required for detailed tracking.');
                setLoading(false);
                return;
            }
            const [hRes, sRes, cRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/habits/${id}`, { headers }),
                fetch(`${API_BASE_URL}/api/habits/${id}/stats?days=90`, { headers }),
                fetch(`${API_BASE_URL}/api/habits/${id}/completions`, { headers })
            ]);
            const h = (await hRes.json()).habit;
            const s = (await sRes.json()).stats;
            const c = (await cRes.json()).completions || [];
            setHabit(h);
            setStats(s);
            setCompletions(c);
        } catch (e) {
            setError('Failed to load habit');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [id]);

    const addCompletion = async () => {
        try {
            await fetch(`${API_BASE_URL}/api/habits/${id}/complete`, { method: 'POST', headers, body: JSON.stringify({}) });
            await load();
        } catch {
            setError('Failed to add completion');
        }
    };

    const deleteCompletion = async (completionId) => {
        try {
            await fetch(`${API_BASE_URL}/api/habits/${id}/completions/${completionId}`, { method: 'DELETE', headers });
            await load();
        } catch {
            setError('Failed to delete completion');
        }
    };

    const Heatmap = ({ days }) => {
        const items = days || [];
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(30, 10px)', gap: 4 }}>
                {items.map(d => (
                    <div key={d.date} title={d.date}
                        style={{ width: 10, height: 10, borderRadius: 2, background: d.done ? 'var(--color-primary)' : 'var(--color-border)' }} />
                ))}
            </div>
        );
    };

    if (loading) return <div className="dashboard-page"><div className="card" style={{ padding: '1rem' }}>Loading...</div></div>;
    if (error) return <div className="dashboard-page"><div className="card" style={{ padding: '1rem', color: 'crimson' }}>{error}</div></div>;

    return (
        <div className="dashboard-page">
            <header className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link to="/habits" className="btn"><ArrowLeft size={16} /> Back</Link>
                    <h1>{habit?.name}</h1>
                </div>
                <div className="muted">Frequency: {habit?.frequency} {habit?.frequency === 'weekly' ? `(goal ${habit?.goalPerWeek}/wk)` : `(target ${habit?.targetPerDay}/day)`}</div>
            </header>

            <div className="dashboard-grid">
                <div className="dashboard-section">
                    <h2>Progress</h2>
                    <div className="card" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <Trophy size={18} />
                            <strong>Current streak: {stats?.currentStreak} days</strong>
                            <span style={{ marginLeft: 12, color: 'var(--color-muted-foreground)' }}>Best: {stats?.bestStreak}</span>
                            <span style={{ marginLeft: 12, color: 'var(--color-muted-foreground)' }}>7d: {stats?.rate7}%</span>
                            <span style={{ marginLeft: 12, color: 'var(--color-muted-foreground)' }}>30d: {stats?.rate30}%</span>
                        </div>
                        <Heatmap days={stats?.lastNDays?.slice(-90)} />
                        <div style={{ marginTop: 12 }}>
                            <button className="btn btn-primary" onClick={addCompletion} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <Plus size={16} /> Add completion
                            </button>
                        </div>
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2>Completions</h2>
                    <div className="card" style={{ padding: '1rem' }}>
                        {completions.length === 0 ? (
                            <div className="muted">No completions yet.</div>
                        ) : (
                            <div style={{ display: 'grid', gap: 8 }}>
                                {completions.map(c => (
                                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                                        <div>{new Date(c.timestampISO).toLocaleString()}</div>
                                        <button className="btn btn-danger" onClick={() => deleteCompletion(c.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
