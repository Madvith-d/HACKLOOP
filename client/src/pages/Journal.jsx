import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Save, Trash2, Edit3, Tag, Smile, Calendar } from 'lucide-react';
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

    return (
        <div className="dashboard-page">
            <header className="page-header">
                <div>
                    <h1>Daily Journal</h1>
                    <p>Reflect on your day and track your mood</p>
                </div>
            </header>

            <div className="dashboard-grid">
                <div className="dashboard-section">
                    <h2>{editingId ? 'Edit Entry' : 'New Entry'}</h2>
                    <div className="card" style={{ padding: '1rem', display: 'grid', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <div className="input" style={{ flex: 1 }}>
                                <input
                                    placeholder="Title (optional)"
                                    value={draft.title}
                                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                                />
                            </div>
                            <div className="input" style={{ width: 140, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Smile size={18} />
                                <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={draft.mood}
                                    onChange={(e) => setDraft({ ...draft, mood: e.target.value })}
                                />
                                <span>/10</span>
                            </div>
                        </div>
                        <textarea
                            className="input"
                            placeholder="Write your thoughts..."
                            rows={5}
                            value={draft.content}
                            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                        />
                        <div className="input" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Tag size={18} />
                            <input
                                placeholder="Tags (comma separated)"
                                value={draft.tags}
                                onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Save size={18} /> {editingId ? 'Update' : 'Save'}
                            </button>
                            {editingId && (
                                <button className="btn" onClick={() => { setEditingId(null); resetDraft(); }}>
                                    Cancel
                                </button>
                            )}
                        </div>
                        {error && <div style={{ color: 'crimson' }}>{error}</div>}
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2>Entries</h2>
                    <div className="card" style={{ padding: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Calendar size={18} />
                            <input type="date" value={filter.from} onChange={(e) => setFilter({ ...filter, from: e.target.value })} />
                            <span>→</span>
                            <input type="date" value={filter.to} onChange={(e) => setFilter({ ...filter, to: e.target.value })} />
                            <input
                                className="input"
                                placeholder="Filter by tag"
                                value={filter.tag}
                                onChange={(e) => setFilter({ ...filter, tag: e.target.value })}
                                style={{ marginLeft: 'auto', maxWidth: 220 }}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="card" style={{ padding: '1rem' }}>Loading...</div>
                    ) : entries.length === 0 ? (
                        <div className="card" style={{ padding: '1rem', color: 'var(--color-muted-foreground)' }}>
                            No entries yet.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {entries.map((e) => (
                                <div key={e.id} className="card" style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <BookOpen size={18} />
                                            <div>
                                                <div style={{ fontWeight: 700 }}>{e.title || 'Untitled'}</div>
                                                <div style={{ fontSize: 12, color: 'var(--color-muted-foreground)' }}>{new Date(e.createdAt).toLocaleString()}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn" onClick={() => handleEdit(e)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Edit3 size={16} /> Edit
                                            </button>
                                            <button className="btn btn-danger" onClick={() => handleDelete(e.id)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Trash2 size={16} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{e.content}</div>
                                    <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', color: 'var(--color-muted-foreground)' }}>
                                        {typeof e.mood === 'number' && <span>Mood: {e.mood}/10</span>}
                                        {(e.tags || []).map((t, i) => (
                                            <span key={i} className="day-badge">#{t}</span>
                                        ))}
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
