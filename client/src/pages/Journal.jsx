import React, { useState } from 'react';
import { BookOpen, Save, Calendar, Search, Filter } from 'lucide-react';

export default function Journal() {
    const [entries, setEntries] = useState([
        {
            id: 1,
            date: new Date('2025-10-20'),
            title: 'Great day with friends',
            content: 'Had an amazing time at the park today. Feeling grateful for the people in my life.',
            mood: 8.5,
            tags: ['gratitude', 'social']
        },
        {
            id: 2,
            date: new Date('2025-10-19'),
            title: 'Work stress',
            content: 'Feeling overwhelmed with deadlines. Need to practice better time management.',
            mood: 5.5,
            tags: ['work', 'stress']
        }
    ]);

    const [newEntry, setNewEntry] = useState({
        title: '',
        content: '',
        mood: 7,
        tags: ''
    });

    const [isEditing, setIsEditing] = useState(false);

    const handleSaveEntry = () => {
        if (!newEntry.title || !newEntry.content) {
            alert('Please fill in both title and content');
            return;
        }

        const entry = {
            id: entries.length + 1,
            date: new Date(),
            title: newEntry.title,
            content: newEntry.content,
            mood: parseFloat(newEntry.mood),
            tags: newEntry.tags.split(',').map(t => t.trim()).filter(t => t)
        };

        setEntries([entry, ...entries]);
        setNewEntry({ title: '', content: '', mood: 7, tags: '' });
        setIsEditing(false);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    return (
        <div className="journal-page">
            <header className="page-header">
                <div>
                    <h1>My Journal</h1>
                    <p>Express your thoughts and track your mental wellness journey</p>
                </div>
                <button 
                    className="primary-button"
                    onClick={() => setIsEditing(!isEditing)}
                >
                    <BookOpen size={20} />
                    {isEditing ? 'Cancel' : 'New Entry'}
                </button>
            </header>

            {isEditing && (
                <div className="journal-editor">
                    <h2>Create New Entry</h2>
                    <div className="editor-form">
                        <input
                            type="text"
                            placeholder="Entry title..."
                            value={newEntry.title}
                            onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                            className="entry-title-input"
                        />
                        
                        <textarea
                            placeholder="Write your thoughts here..."
                            value={newEntry.content}
                            onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                            className="entry-content-input"
                            rows={8}
                        />

                        <div className="entry-metadata">
                            <div className="mood-selector">
                                <label>Mood: {newEntry.mood}/10</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    step="0.5"
                                    value={newEntry.mood}
                                    onChange={(e) => setNewEntry({ ...newEntry, mood: e.target.value })}
                                    className="mood-slider"
                                />
                            </div>

                            <div className="tags-input">
                                <label>Tags (comma-separated)</label>
                                <input
                                    type="text"
                                    placeholder="e.g., gratitude, work, family"
                                    value={newEntry.tags}
                                    onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
                                />
                            </div>
                        </div>

                        <button onClick={handleSaveEntry} className="save-button">
                            <Save size={20} />
                            Save Entry
                        </button>
                    </div>
                </div>
            )}

            <div className="journal-entries">
                <div className="entries-header">
                    <h2>Your Entries ({entries.length})</h2>
                    <div className="entries-filters">
                        <button className="filter-button">
                            <Search size={18} />
                            Search
                        </button>
                        <button className="filter-button">
                            <Filter size={18} />
                            Filter
                        </button>
                    </div>
                </div>

                <div className="entries-list">
                    {entries.map((entry) => (
                        <div key={entry.id} className="journal-entry-card">
                            <div className="entry-header">
                                <div className="entry-date">
                                    <Calendar size={16} />
                                    {formatDate(entry.date)}
                                </div>
                                <div className="entry-mood">
                                    Mood: <span className="mood-value">{entry.mood}/10</span>
                                </div>
                            </div>

                            <h3 className="entry-title">{entry.title}</h3>
                            <p className="entry-content">{entry.content}</p>

                            {entry.tags && entry.tags.length > 0 && (
                                <div className="entry-tags">
                                    {entry.tags.map((tag, idx) => (
                                        <span key={idx} className="tag">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {entries.length === 0 && (
                    <div className="empty-state">
                        <BookOpen size={48} />
                        <h3>No journal entries yet</h3>
                        <p>Start writing to track your mental wellness journey</p>
                    </div>
                )}
            </div>
        </div>
    );
}
