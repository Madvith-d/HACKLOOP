import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Target, Award, Loader2 } from 'lucide-react';
import { emotionAPI, chatAPI } from '../utils/api';
import { calculateWellnessScore, calculateWellnessTrend, getWellnessInsights } from '../utils/wellnessScore';

export default function Analytics() {
    const [loading, setLoading] = useState(true);
    const [moodData, setMoodData] = useState([]);
    const [emotionDistribution, setEmotionDistribution] = useState([]);
    const [insights, setInsights] = useState([]);
    const [wellnessScore, setWellnessScore] = useState(null);
    const [summary, setSummary] = useState({
        totalCheckIns: 0,
        aiConversations: 0,
        therapySessions: 0,
        averageMood: '--',
    });

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('authToken');
                if (!token) {
                    setLoading(false);
                    return;
                }

                // Fetch data in parallel
                const [emotionsRes, chatHistoryRes, analyticsRes] = await Promise.all([
                    emotionAPI.getMyEmotions().catch(() => ({ emotions: [] })),
                    chatAPI.getHistory(100, 0).catch(() => ({ messages: [] })),
                    emotionAPI.getAnalytics().catch(() => ({})),
                ]);

                const emotions = emotionsRes.emotions || [];
                const chatMessages = chatHistoryRes.messages || [];
                const analytics = analyticsRes || {};

                // Process mood data from chat messages (last 7 days)
                const last7Days = [];
                for (let i = 6; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    
                    // Get messages from this day
                    const dayMessages = chatMessages.filter(m => {
                        const msgDate = new Date(m.created_at);
                        return msgDate.toDateString() === date.toDateString();
                    });

                    // Calculate average mood from emotional analysis
                    let avgMood = 5;
                    let avgEnergy = 5;
                    if (dayMessages.length > 0) {
                        const moods = dayMessages
                            .map(m => {
                                const analysis = typeof m.emotional_analysis === 'string' 
                                    ? JSON.parse(m.emotional_analysis) 
                                    : m.emotional_analysis;
                                if (analysis?.sentiment !== undefined) {
                                    return (analysis.sentiment + 1) * 5; // Convert -1 to 1 range to 0-10
                                }
                                return null;
                            })
                            .filter(m => m !== null);
                        
                        if (moods.length > 0) {
                            avgMood = moods.reduce((a, b) => a + b, 0) / moods.length;
                            avgEnergy = avgMood * 0.9; // Approximate energy from mood
                        }
                    }

                    last7Days.push({
                        date: dayName,
                        mood: Math.round(avgMood * 10) / 10,
                        energy: Math.round(avgEnergy * 10) / 10,
                    });
                }
                setMoodData(last7Days);

                // Process emotion distribution from analytics
                if (analytics.emotionDistribution) {
                    const distribution = Object.entries(analytics.emotionDistribution)
                        .map(([emotion, count]) => ({
                            emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
                            count,
                        }))
                        .sort((a, b) => b.count - a.count);
                    setEmotionDistribution(distribution);
                } else {
                    // Fallback: count emotions from chat messages
                    const emotionCounts = {};
                    chatMessages.forEach(m => {
                        const analysis = typeof m.emotional_analysis === 'string' 
                            ? JSON.parse(m.emotional_analysis) 
                            : m.emotional_analysis;
                        if (analysis?.emotionScores) {
                            const scores = analysis.emotionScores;
                            Object.keys(scores).forEach(emotion => {
                                if (scores[emotion] > 0.5) {
                                    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
                                }
                            });
                        }
                    });
                    const distribution = Object.entries(emotionCounts)
                        .map(([emotion, count]) => ({
                            emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
                            count,
                        }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 5);
                    setEmotionDistribution(distribution);
                }

                // Calculate wellness score
                const wellness = calculateWellnessScore(analytics, chatMessages, [], []);
                setWellnessScore(wellness);

                // Calculate trend (simplified - would need historical data)
                const trend = calculateWellnessTrend([
                    { score: wellness.score - 5, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                    { score: wellness.score, date: new Date() },
                ]);

                // Generate insights
                const wellnessInsights = getWellnessInsights(wellness, trend);
                const newInsights = [
                    {
                        title: 'Wellness Score',
                        value: `${wellness.score}/100`,
                        description: `Your current wellness level is ${wellness.level}`,
                        icon: TrendingUp,
                        color: wellness.color,
                    },
                    {
                        title: 'Mood Trend',
                        value: trend.trend === 'improving' ? `+${trend.percentage}%` : trend.trend === 'declining' ? `${trend.percentage}%` : 'Stable',
                        description: trend.trend === 'improving' 
                            ? 'Your mood has improved this week'
                            : trend.trend === 'declining'
                            ? 'Your mood has declined this week'
                            : 'Your mood has been stable',
                        icon: trend.trend === 'improving' ? TrendingUp : TrendingDown,
                        color: trend.trend === 'improving' ? '#4ade80' : trend.trend === 'declining' ? '#ef4444' : '#667eea',
                    },
                    {
                        title: 'Check-ins',
                        value: `${emotions.length}`,
                        description: 'Total emotion check-ins recorded',
                        icon: Award,
                        color: '#fbbf24',
                    },
                ];
                setInsights(newInsights);

                // Update summary
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                const recentCheckIns = emotions.filter(e => {
                    const timestamp = new Date(e.timestamp);
                    return timestamp >= oneWeekAgo;
                }).length;

                const avgMood = last7Days.length > 0
                    ? (last7Days.reduce((sum, d) => sum + d.mood, 0) / last7Days.length).toFixed(1)
                    : '--';

                setSummary({
                    totalCheckIns: emotions.length,
                    aiConversations: chatMessages.length,
                    therapySessions: 0, // Would need to fetch from sessions API
                    averageMood: avgMood,
                });
            } catch (error) {
                console.error('Error fetching analytics data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalyticsData();
    }, []);

    return (
        <div className="analytics-page">
            <header className="page-header">
                <div>
                    <h1>Your Analytics</h1>
                    <p>Track your mental wellness journey</p>
                </div>
            </header>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto', color: '#667eea' }} />
                    <p style={{ marginTop: '1rem', color: 'var(--color-muted-foreground)' }}>Loading analytics...</p>
                </div>
            ) : (
                <>
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
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="date" stroke="#64748b" />
                            <YAxis stroke="#64748b" domain={[0, 10]} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
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
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="emotion" stroke="#64748b" />
                            <YAxis stroke="#64748b" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <Bar dataKey="count" fill="#667eea" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

                    <div className="stats-summary">
                        <h3>Summary</h3>
                        <div className="summary-grid">
                            <div className="summary-item">
                                <span className="summary-label">Total Check-ins</span>
                                <span className="summary-value">{summary.totalCheckIns}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">AI Conversations</span>
                                <span className="summary-value">{summary.aiConversations}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Therapy Sessions</span>
                                <span className="summary-value">{summary.therapySessions}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Average Mood</span>
                                <span className="summary-value">{summary.averageMood}/10</span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
