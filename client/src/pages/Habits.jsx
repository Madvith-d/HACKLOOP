import React, { useEffect, useMemo, useState } from 'react';
import { CheckSquare, RotateCw, Plus, Trash2, Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Habits() {
    const { user } = useApp();
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const token = localStorage.getItem('authToken');

    const [habits, setHabits] = useState([]);
    const [selected, setSelected] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [draft, setDraft] = useState({ name: '', frequency: 'daily', goalPerWeek: 7, targetPerDay: 1, daysOfWeek: [] });

    const localKey = useMemo(() => `habits_${user?.id || 'guest'}`, [user?.id]);
    const localCompKey = useMemo(() => `habit_completions_${user?.id || 'guest'}`, [user?.id]);

    const loadHabits = async () => {
        setLoading(true);
        setError('');
        try {
            if (token) {
                const res = await fetch(`${API_BASE_URL}/api/habits`, { headers: { Authorization: `Bearer ${token}` } });
                const json = await res.json();
                setHabits(json.habits || []);
            } else {
                const raw = localStorage.getItem(localKey);
                setHabits(raw ? JSON.parse(raw) : []);
            }
        } catch (e) {
            setError('Failed to load habits');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async (habitId) => {
        try {
            if (token) {
                const res = await fetch(`${API_BASE_URL}/api/habits/${habitId}/stats?days=30`, { headers: { Authorization: `Bearer ${token}` } });
                const json = await res.json();
                setStats(json.stats || null);
            } else {
                const comps = JSON.parse(localStorage.getItem(localCompKey) || '{}');
                const setDates = new Set(comps[habitId] || []);
                const today = new Date();
                let currentStreak = 0;
                const lastNDays = [];
                for (let i = 29; i >= 0; i--) {
                    const d = new Date(today);
                    d.setDate(today.getDate() - i);
                    const key = d.toISOString().slice(0, 10);
                    const done = setDates.has(key);
                    lastNDays.push({ date: key, done });
                    if (i === 0) currentStreak = done ? 1 : 0;
                }
                setStats({ currentStreak, lastNDays, totalCompletions: Array.from(setDates).length });
            }
        } catch {}
    };

    useEffect(() => { loadHabits(); }, []);

    const persistLocal = (list) => localStorage.setItem(localKey, JSON.stringify(list));

    const createHabit = async () => {
        if (!draft.name.trim()) return;
        try {
            if (token) {
                const res = await fetch(`${API_BASE_URL}/api/habits`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(draft)
                });
                if (!res.ok) throw new Error('Failed');
                await loadHabits();
            } else {
                const list = [...habits, { id: `local-${Date.now()}`, userId: user?.id || 'guest', ...draft, createdAt: new Date().toISOString(), archived: false }];
                setHabits(list);
                persistLocal(list);
            }
            setDraft({ name: '', frequency: 'daily', goalPerWeek: 7, targetPerDay: 1, daysOfWeek: [] });
        } catch (e) {
            setError('Failed to create habit');
        }
    };

    const deleteHabit = async (id) => {
        if (!confirm('Delete this habit?')) return;
        try {
            if (token) {
                const res = await fetch(`${API_BASE_URL}/api/habits/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) throw new Error('Failed');
                await loadHabits();
            } else {
                const list = habits.filter(h => h.id !== id);
                setHabits(list);
                persistLocal(list);
                const comps = JSON.parse(localStorage.getItem(localCompKey) || '{}');
                delete comps[id];
                localStorage.setItem(localCompKey, JSON.stringify(comps));
            }
            if (selected?.id === id) { setSelected(null); setStats(null); }
        } catch (e) {
            setError('Failed to delete habit');
        }
    };

    const toggleToday = async (habit) => {
        try {
            if (token) {
                await fetch(`${API_BASE_URL}/api/habits/${habit.id}/toggle`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({}) });
                await loadStats(habit.id);
            } else {
                const comps = JSON.parse(localStorage.getItem(localCompKey) || '{}');
                const key = new Date().toISOString().slice(0, 10);
                comps[habit.id] = comps[habit.id] || [];
                const set = new Set(comps[habit.id]);
                if (set.has(key)) set.delete(key); else set.add(key);
                comps[habit.id] = Array.from(set);
                localStorage.setItem(localCompKey, JSON.stringify(comps));
                await loadStats(habit.id);
            }
        } catch (e) {
            setError('Failed to toggle');
        }
    };

    return (
        <div className="dashboard-page">
            <header className="page-header">
                <div>
                    <h1>Habit Tracker</h1>
                    <p>Build routines and keep your streaks</p>
                </div>
            </header>

            <div className="dashboard-grid">
                <div className="dashboard-section">
                    <h2>Create Habit</h2>
                    <div className="card" style={{ padding: '1rem', display: 'grid', gap: '0.75rem' }}>
                        <input className="input" placeholder="Habit name (e.g., Meditate 10 min)" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <select className="input" value={draft.frequency} onChange={(e) => setDraft({ ...draft, frequency: e.target.value })}>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                            </select>
                            <input className="input" type="number" min={1} max={7} value={draft.goalPerWeek} onChange={(e) => setDraft({ ...draft, goalPerWeek: Number(e.target.value) })} />
                            <input className="input" type="number" min={1} max={20} value={draft.targetPerDay} onChange={(e) => setDraft({ ...draft, targetPerDay: Number(e.target.value) })} placeholder="Target per day" />
                        </div>
                        <div>
                            <div style={{ marginBottom: 8, color: 'var(--color-muted-foreground)' }}>Days of week (optional):</div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => (
                                    <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--color-border)', borderRadius: 6, padding: '4px 8px' }}>
                                        <input type="checkbox" checked={draft.daysOfWeek.includes(i)} onChange={(e) => {
                                            const set = new Set(draft.daysOfWeek);
                                            if (e.target.checked) set.add(i); else set.delete(i);
                                            setDraft({ ...draft, daysOfWeek: Array.from(set).sort() });
                                        }} />
                                        {d}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button className="btn btn-primary" onClick={createHabit} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Plus size={18} /> Add Habit
                        </button>
                        {error && <div style={{ color: 'crimson' }}>{error}</div>}
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2>My Habits</h2>
                    {loading ? (
                        <div className="card" style={{ padding: '1rem' }}>Loading...</div>
                    ) : habits.length === 0 ? (
                        <div className="card" style={{ padding: '1rem', color: 'var(--color-muted-foreground)' }}>No habits yet.</div>
                    ) : (
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {habits.map(h => (
                                <div key={h.id} className={`card ${selected?.id === h.id ? 'active' : ''}`} style={{ padding: '1rem', cursor: 'pointer' }} onClick={async () => { setSelected(h); await loadStats(h.id); }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <CheckSquare size={18} />
                                            <div>
                                                <div style={{ fontWeight: 700 }}>{h.name}</div>
                                                <div style={{ fontSize: 12, color: 'var(--color-muted-foreground)' }}>{h.frequency === 'daily' ? `Daily (target ${h.targetPerDay || 1}/day)` : `Weekly goal: ${h.goalPerWeek}`}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn" onClick={(e) => { e.stopPropagation(); toggleToday(h); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <RotateCw size={16} /> Toggle Today
                                            </button>
                                            <a className="btn" href={`/habits/${h.id}`} onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                Details
                                            </a>
                                            <button className="btn btn-danger" onClick={(e) => { e.stopPropagation(); deleteHabit(h.id); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Trash2 size={16} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {selected && stats && (
                <div className="dashboard-section">
                    <h2>Progress — {selected.name}</h2>
                    <div className="card" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <Trophy size={18} />
                            <strong>Current streak: {stats.currentStreak} days</strong>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(15, minmax(0, 1fr))', gap: 6 }}>
                            {stats.lastNDays.map((d) => (
                                <div key={d.date} title={d.date} style={{ height: 18, borderRadius: 4, background: d.done ? 'var(--color-primary)' : 'var(--color-border)' }} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
