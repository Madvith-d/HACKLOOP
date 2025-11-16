import React, { useEffect, useMemo, useState } from 'react';
import { CheckSquare, RotateCw, Plus, Trash2, Trophy, Target, Calendar, TrendingUp, Sparkles } from 'lucide-react';
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
        <div className="dashboard-page habits-page">
            <header className="page-header">
                <div>
                    <h1 className="gradient-text">Habit Tracker</h1>
                    <p>Build routines and keep your streaks going</p>
                </div>
            </header>

            <div className="habits-layout">
                <div className="habits-create-section">
                    <div className="habits-section-header">
                        <Sparkles className="section-icon" size={24} />
                        <h2>Create New Habit</h2>
                    </div>
                    <div className="card habits-form-card">
                        <div className="form-group">
                            <label className="form-label">
                                <Target size={18} />
                                Habit Name
                            </label>
                            <input 
                                className="input habits-input" 
                                placeholder="e.g., Meditate 10 minutes, Drink 8 glasses of water" 
                                value={draft.name} 
                                onChange={(e) => setDraft({ ...draft, name: e.target.value })} 
                            />
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">
                                    <Calendar size={18} />
                                    Frequency
                                </label>
                                <select 
                                    className="input habits-input" 
                                    value={draft.frequency} 
                                    onChange={(e) => setDraft({ ...draft, frequency: e.target.value })}
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                </select>
                            </div>
                            
                            {draft.frequency === 'daily' ? (
                                <div className="form-group">
                                    <label className="form-label">
                                        <Target size={18} />
                                        Target per Day
                                    </label>
                                    <input 
                                        className="input habits-input" 
                                        type="number" 
                                        min={1} 
                                        max={20} 
                                        value={draft.targetPerDay} 
                                        onChange={(e) => setDraft({ ...draft, targetPerDay: Number(e.target.value) })} 
                                    />
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label className="form-label">
                                        <TrendingUp size={18} />
                                        Goal per Week
                                    </label>
                                    <input 
                                        className="input habits-input" 
                                        type="number" 
                                        min={1} 
                                        max={7} 
                                        value={draft.goalPerWeek} 
                                        onChange={(e) => setDraft({ ...draft, goalPerWeek: Number(e.target.value) })} 
                                    />
                                </div>
                            )}
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label">
                                <Calendar size={18} />
                                Days of Week (Optional)
                            </label>
                            <div className="days-selector">
                                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => (
                                    <label 
                                        key={i} 
                                        className={`day-checkbox ${draft.daysOfWeek.includes(i) ? 'selected' : ''}`}
                                    >
                                        <input 
                                            type="checkbox" 
                                            checked={draft.daysOfWeek.includes(i)} 
                                            onChange={(e) => {
                                                const set = new Set(draft.daysOfWeek);
                                                if (e.target.checked) set.add(i); else set.delete(i);
                                                setDraft({ ...draft, daysOfWeek: Array.from(set).sort() });
                                            }} 
                                        />
                                        <span>{d}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        
                        <button 
                            className="btn btn-primary habits-submit-btn" 
                            onClick={createHabit}
                        >
                            <Plus size={18} /> 
                            <span>Add Habit</span>
                        </button>
                        
                        {error && <div className="error-message">{error}</div>}
                    </div>
                </div>

                <div className="habits-list-section">
                    <div className="habits-section-header">
                        <CheckSquare className="section-icon" size={24} />
                        <h2>My Habits</h2>
                        {habits.length > 0 && (
                            <span className="habits-count">{habits.length}</span>
                        )}
                    </div>
                    
                    {loading ? (
                        <div className="card habits-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading your habits...</p>
                        </div>
                    ) : habits.length === 0 ? (
                        <div className="card habits-empty">
                            <CheckSquare size={48} className="empty-icon" />
                            <h3>No habits yet</h3>
                            <p>Start building your routine by creating your first habit above!</p>
                        </div>
                    ) : (
                        <div className="habits-grid">
                            {habits.map(h => (
                                <div 
                                    key={h.id} 
                                    className={`card habit-card ${selected?.id === h.id ? 'active' : ''}`}
                                    onClick={async () => { setSelected(h); await loadStats(h.id); }}
                                >
                                    <div className="habit-card-header">
                                        <div className="habit-icon-wrapper">
                                            <CheckSquare size={20} />
                                        </div>
                                        <div className="habit-info">
                                            <h3 className="habit-name">{h.name}</h3>
                                            <p className="habit-meta">
                                                {h.frequency === 'daily' 
                                                    ? `Daily • Target: ${h.targetPerDay || 1}/day` 
                                                    : `Weekly • Goal: ${h.goalPerWeek}/week`}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="habit-actions">
                                        <button 
                                            className="btn-icon habit-action-btn" 
                                            onClick={(e) => { e.stopPropagation(); toggleToday(h); }}
                                            title="Toggle Today"
                                        >
                                            <RotateCw size={16} />
                                        </button>
                                        <a 
                                            className="btn-icon habit-action-btn" 
                                            href={`/habits/${h.id}`} 
                                            onClick={(e) => e.stopPropagation()}
                                            title="View Details"
                                        >
                                            <TrendingUp size={16} />
                                        </a>
                                        <button 
                                            className="btn-icon habit-action-btn danger" 
                                            onClick={(e) => { e.stopPropagation(); deleteHabit(h.id); }}
                                            title="Delete Habit"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {selected && stats && (
                <div className="habits-progress-section">
                    <div className="habits-section-header">
                        <Trophy className="section-icon" size={24} />
                        <h2>Progress — {selected.name}</h2>
                    </div>
                    <div className="card habits-progress-card">
                        <div className="progress-stats">
                            <div className="progress-stat">
                                <Trophy size={24} className="stat-icon" />
                                <div>
                                    <div className="stat-value">{stats.currentStreak}</div>
                                    <div className="stat-label">Day Streak</div>
                                </div>
                            </div>
                            <div className="progress-stat">
                                <Target size={24} className="stat-icon" />
                                <div>
                                    <div className="stat-value">{stats.totalCompletions || 0}</div>
                                    <div className="stat-label">Total Completions</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="heatmap-container">
                            <h4 className="heatmap-title">Last 30 Days</h4>
                            <div className="heatmap-grid">
                                {stats.lastNDays.map((d, idx) => (
                                    <div 
                                        key={d.date} 
                                        className={`heatmap-day ${d.done ? 'completed' : ''}`}
                                        title={`${d.date}: ${d.done ? 'Completed' : 'Not completed'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
