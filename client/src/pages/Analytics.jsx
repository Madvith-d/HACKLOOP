import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Target, Award } from 'lucide-react';

export default function Analytics() {
    const moodData = [
        { date: 'Mon', mood: 7.5, energy: 6.5 },
        { date: 'Tue', mood: 6.8, energy: 6.0 },
        { date: 'Wed', mood: 8.2, energy: 7.5 },
        { date: 'Thu', mood: 7.0, energy: 6.8 },
        { date: 'Fri', mood: 8.5, energy: 8.0 },
        { date: 'Sat', mood: 9.0, energy: 8.5 },
        { date: 'Sun', mood: 7.8, energy: 7.2 },
    ];

    const emotionDistribution = [
        { emotion: 'Happy', count: 15 },
        { emotion: 'Calm', count: 12 },
        { emotion: 'Neutral', count: 8 },
        { emotion: 'Anxious', count: 5 },
        { emotion: 'Sad', count: 3 },
    ];

    const insights = [
        {
            title: 'Mood Trend',
            value: '+12%',
            description: 'Your mood has improved this week',
            icon: TrendingUp,
            color: '#4ade80'
        },
        {
            title: 'Check-in Streak',
            value: '15 days',
            description: 'Keep up the good work!',
            icon: Award,
            color: '#fbbf24'
        },
        {
            title: 'Weekly Goal',
            value: '85%',
            description: 'Complete 2 more check-ins',
            icon: Target,
            color: '#667eea'
        },
    ];

    return (
        <div className="analytics-page">
            <header className="page-header">
                <div>
                    <h1>Your Analytics</h1>
                    <p>Track your mental wellness journey</p>
                </div>
            </header>

            <div className="insights-grid">
                {insights.map((insight, index) => {
                    const Icon = insight.icon;
                    return (
                        <div key={index} className="insight-card" style={{ borderColor: insight.color }}>
                            <div className="insight-icon" style={{ backgroundColor: insight.color + '20' }}>
                                <Icon size={24} style={{ color: insight.color }} />
                            </div>
                            <div className="insight-content">
                                <h3>{insight.value}</h3>
                                <p className="insight-title">{insight.title}</p>
                                <p className="insight-desc">{insight.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Weekly Mood & Energy Trends</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={moodData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="date" stroke="#888" />
                            <YAxis stroke="#888" domain={[0, 10]} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1a1a2e',
                                    border: '1px solid #333',
                                    borderRadius: '8px'
                                }}
                            />
                            <Line type="monotone" dataKey="mood" stroke="#667eea" strokeWidth={3} />
                            <Line type="monotone" dataKey="energy" stroke="#764ba2" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h3>Emotion Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={emotionDistribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="emotion" stroke="#888" />
                            <YAxis stroke="#888" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1a1a2e',
                                    border: '1px solid #333',
                                    borderRadius: '8px'
                                }}
                            />
                            <Bar dataKey="count" fill="#667eea" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="stats-summary">
                <h3>Monthly Summary</h3>
                <div className="summary-grid">
                    <div className="summary-item">
                        <span className="summary-label">Total Check-ins</span>
                        <span className="summary-value">43</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">AI Conversations</span>
                        <span className="summary-value">28</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Therapy Sessions</span>
                        <span className="summary-value">4</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Average Mood</span>
                        <span className="summary-value">7.8/10</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
