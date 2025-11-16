import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Save, Trash2, Edit3, Tag, Smile, Calendar, Search, Filter, PenTool, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Journal() {
    const { user } = useApp();
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState({ from: '', to: '', tag: '' });

    const [draft, setDraft] = useState({ title: '', content: '', mood: 7, tags: '' });
    const [editingId, setEditingId] = useState(null);

    const token = localStorage.getItem('authToken');

    const localKey = useMemo(() => `journal_${user?.id || 'guest'}`, [user?.id]);

    const loadEntries = async () => {
        setLoading(true);
        setError('');
        try {
            if (token) {
                const qs = new URLSearchParams();
                if (filter.from) qs.set('from', filter.from);
                if (filter.to) qs.set('to', filter.to);
                const res = await fetch(`${API_BASE_URL}/api/journal?${qs.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const json = await res.json();
                let list = json.entries || [];
                if (filter.tag) list = list.filter(e => (e.tags || []).includes(filter.tag));
                setEntries(list);
            } else {
                const raw = localStorage.getItem(localKey);
                const list = raw ? JSON.parse(raw) : [];
                let filtered = list;
                if (filter.from) filtered = filtered.filter(e => e.createdAt.slice(0,10) >= filter.from);
                if (filter.to) filtered = filtered.filter(e => e.createdAt.slice(0,10) <= filter.to);
                if (filter.tag) filtered = filtered.filter(e => (e.tags || []).includes(filter.tag));
                setEntries(filtered);
            }
        } catch (e) {
            setError('Failed to load entries');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEntries();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter.from, filter.to, filter.tag, API_BASE_URL]);

    const persistLocal = (list) => localStorage.setItem(localKey, JSON.stringify(list));

    const resetDraft = () => setDraft({ title: '', content: '', mood: 7, tags: '' });

    const handleSave = async () => {
        const payload = {
            title: draft.title?.trim(),
            content: draft.content?.trim(),
            mood: Number(draft.mood) || null,
            tags: draft.tags ? draft.tags.split(',').map(t => t.trim()).filter(Boolean) : []
        };
        try {
            if (token) {
                const url = editingId ? `${API_BASE_URL}/api/journal/${editingId}` : `${API_BASE_URL}/api/journal`;
                const method = editingId ? 'PATCH' : 'POST';
                const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Request failed');
                await loadEntries();
            } else {
                const now = new Date().toISOString();
                const list = [...entries];
                if (editingId) {
                    const idx = list.findIndex(e => e.id === editingId);
                    if (idx >= 0) list[idx] = { ...list[idx], ...payload, updatedAt: now };
                } else {
                    list.unshift({ id: `local-${Date.now()}`, userId: user?.id || 'guest', ...payload, createdAt: now, updatedAt: now });
                }
                setEntries(list);
                persistLocal(list);
            }
            setEditingId(null);
            resetDraft();
        } catch (e) {
            setError('Failed to save entry');
        }
    };

    const handleEdit = (entry) => {
        setEditingId(entry.id);
        setDraft({
            title: entry.title || '',
            content: entry.content || '',
            mood: entry.mood ?? 7,
            tags: (entry.tags || []).join(', ')
        });
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this entry?')) return;
        try {
            if (token) {
                const res = await fetch(`${API_BASE_URL}/api/journal/${id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Delete failed');
                await loadEntries();
            } else {
                const list = entries.filter(e => e.id !== id);
                setEntries(list);
                persistLocal(list);
            }
        } catch (e) {
            setError('Failed to delete entry');
        }
    };

    const getMoodColor = (mood) => {
        if (mood >= 8) return '#10b981'; // green
        if (mood >= 6) return '#3b82f6'; // blue
        if (mood >= 4) return '#f59e0b'; // yellow
        return '#ef4444'; // red
    };

    const getMoodEmoji = (mood) => {
        if (mood >= 8) return '😊';
        if (mood >= 6) return '🙂';
        if (mood >= 4) return '😐';
        return '😔';
    };

    return (
        <div className="dashboard-page journal-page">
            <header className="page-header">
                <div>
                    <h1 className="gradient-text">Daily Journal</h1>
                    <p>Reflect on your day and track your mood</p>
                </div>
            </header>

            <div className="journal-layout">
                <div className="journal-editor-section">
                    <div className="journal-section-header">
                        <PenTool className="section-icon" size={24} />
                        <h2>{editingId ? 'Edit Entry' : 'New Entry'}</h2>
                    </div>
                    <div className="card journal-form-card">
                        <div className="form-row">
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">
                                    <BookOpen size={18} />
                                    Title (Optional)
                                </label>
                                <input
                                    className="input journal-input"
                                    placeholder="Give your entry a title..."
                                    value={draft.title}
                                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                                />
                            </div>
                            <div className="form-group mood-input-group">
                                <label className="form-label">
                                    <Smile size={18} />
                                    Mood
                                </label>
                                <div className="mood-selector">
                                    <input
                                        type="range"
                                        min={1}
                                        max={10}
                                        value={draft.mood}
                                        onChange={(e) => setDraft({ ...draft, mood: e.target.value })}
                                        className="mood-slider"
                                        style={{ '--mood-color': getMoodColor(draft.mood) }}
                                    />
                                    <div className="mood-display">
                                        <span className="mood-emoji">{getMoodEmoji(draft.mood)}</span>
                                        <span className="mood-value">{draft.mood}/10</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label">
                                <PenTool size={18} />
                                Your Thoughts
                            </label>
                            <textarea
                                className="input journal-textarea"
                                placeholder="Write your thoughts, reflections, or anything on your mind..."
                                rows={8}
                                value={draft.content}
                                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label">
                                <Tag size={18} />
                                Tags
                            </label>
                            <input
                                className="input journal-input"
                                placeholder="Add tags separated by commas (e.g., work, gratitude, goals)"
                                value={draft.tags}
                                onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
                            />
                        </div>
                        
                        <div className="journal-form-actions">
                            <button 
                                className="btn btn-primary journal-save-btn" 
                                onClick={handleSave}
                            >
                                <Save size={18} /> 
                                <span>{editingId ? 'Update Entry' : 'Save Entry'}</span>
                            </button>
                            {editingId && (
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={() => { setEditingId(null); resetDraft(); }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                        
                        {error && <div className="error-message">{error}</div>}
                    </div>
                </div>

                <div className="journal-entries-section">
                    <div className="journal-section-header">
                        <BookOpen className="section-icon" size={24} />
                        <h2>Your Entries</h2>
                        {entries.length > 0 && (
                            <span className="journal-count">{entries.length}</span>
                        )}
                    </div>
                    
                    <div className="card journal-filters-card">
                        <div className="filters-container">
                            <div className="filter-group">
                                <Calendar size={18} />
                                <input 
                                    type="date" 
                                    className="input journal-filter-input" 
                                    value={filter.from} 
                                    onChange={(e) => setFilter({ ...filter, from: e.target.value })} 
                                    placeholder="From"
                                />
                            </div>
                            <span className="filter-separator">→</span>
                            <div className="filter-group">
                                <Calendar size={18} />
                                <input 
                                    type="date" 
                                    className="input journal-filter-input" 
                                    value={filter.to} 
                                    onChange={(e) => setFilter({ ...filter, to: e.target.value })} 
                                    placeholder="To"
                                />
                            </div>
                            <div className="filter-group filter-search">
                                <Search size={18} />
                                <input
                                    className="input journal-filter-input"
                                    placeholder="Filter by tag..."
                                    value={filter.tag}
                                    onChange={(e) => setFilter({ ...filter, tag: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="card journal-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading your entries...</p>
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="card journal-empty">
                            <BookOpen size={48} className="empty-icon" />
                            <h3>No entries yet</h3>
                            <p>Start your journaling journey by writing your first entry!</p>
                        </div>
                    ) : (
                        <div className="journal-entries-grid">
                            {entries.map((e) => (
                                <div key={e.id} className="card journal-entry-card">
                                    <div className="journal-entry-header">
                                        <div className="entry-icon-wrapper">
                                            <BookOpen size={20} />
                                        </div>
                                        <div className="entry-info">
                                            <h3 className="entry-title">{e.title || 'Untitled Entry'}</h3>
                                            <p className="entry-date">
                                                {new Date(e.createdAt).toLocaleDateString('en-US', { 
                                                    weekday: 'short', 
                                                    year: 'numeric', 
                                                    month: 'short', 
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        {typeof e.mood === 'number' && (
                                            <div 
                                                className="mood-badge" 
                                                style={{ '--mood-color': getMoodColor(e.mood) }}
                                            >
                                                <Heart size={14} />
                                                <span>{e.mood}/10</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="entry-content">
                                        {e.content}
                                    </div>
                                    
                                    {(e.tags || []).length > 0 && (
                                        <div className="entry-tags">
                                            {(e.tags || []).map((t, i) => (
                                                <span key={i} className="journal-tag">
                                                    <Tag size={12} />
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    
                                    <div className="entry-actions">
                                        <button 
                                            className="btn-icon entry-action-btn" 
                                            onClick={() => handleEdit(e)}
                                            title="Edit Entry"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button 
                                            className="btn-icon entry-action-btn danger" 
                                            onClick={() => handleDelete(e.id)}
                                            title="Delete Entry"
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
        </div>
    );
}
